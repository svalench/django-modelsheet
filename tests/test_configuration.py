from datetime import timedelta
from io import StringIO

import pytest
from django.contrib import admin
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import IntegrityError
from django.urls import NoReverseMatch, reverse
from django.utils import timezone

from demo.shop.models import Category, Order, Product
from modelsheet.adapters import SaveAdapter
from modelsheet.checks import check_configuration
from modelsheet.models import Operation, ViewSnapshot
from .conftest import BASE, loaded, post, preview_payload, save_payload

pytestmark = pytest.mark.django_db(transaction=True)


def test_registered_sheet_works_without_settings(api, products, settings):
    del settings.MODELSHEET
    assert not check_configuration(None)
    view = loaded(api)
    assert api.get(BASE + "schema/").status_code == 200
    assert post(api, "save", save_payload(view, {"price": "12"})).status_code == 200
    products[0].refresh_from_db()
    assert str(products[0].price) == "12.00"


@pytest.mark.parametrize("models", [[], ["shop.Order"]])
def test_explicit_model_restriction_still_applies(api, settings, models):
    settings.MODELSHEET = {"models": models}
    response = api.get(BASE + "schema/")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_enabled"


def test_disabled_sheet_stays_unavailable(api, monkeypatch):
    monkeypatch.setattr(admin.site._registry[Product], "sheet_enabled", False)
    response = api.get(BASE + "schema/")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_enabled"


def test_ordinary_admin_does_not_get_sheet_routes():
    with pytest.raises(NoReverseMatch):
        reverse("admin:shop_category_sheet_schema")


def test_roles_are_opt_in_and_idempotent(user):
    assert not Group.objects.filter(name__startswith="ModelSheet").exists()
    for _ in range(2):
        call_command("modelsheet_roles", stdout=StringIO())
    assert Group.objects.filter(name__startswith="ModelSheet").count() == 5
    assert (
        Group.objects.get(name="ModelSheet Auditor")
        .permissions.filter(codename="history_shop_product")
        .exists()
    )
    assert (
        not Group.objects.get(name="ModelSheet Auditor")
        .permissions.filter(codename="change_product")
        .exists()
    )
    assert Group.objects.get(name="ModelSheet Viewer").permissions.filter(
        content_type__app_label="shop", codename="view_product"
    ).exists()
    assert not Group.objects.get(name="ModelSheet Viewer").permissions.filter(
        content_type__app_label="shop", codename="view_category"
    ).exists()


@pytest.mark.parametrize("restrict", ["settings", "admin"])
def test_roles_only_include_enabled_models(settings, monkeypatch, restrict):
    if restrict == "settings":
        settings.MODELSHEET = {"models": ["shop.Product"]}
    else:
        monkeypatch.setattr(admin.site._registry[Order], "sheet_enabled", False)
    call_command("modelsheet_roles", stdout=StringIO())
    permissions = Group.objects.get(name="ModelSheet Editor").permissions
    assert permissions.filter(codename="view_product").exists()
    assert not permissions.filter(codename="view_order").exists()
    assert not permissions.filter(codename="view_field_shop_order_total").exists()


def test_roles_discover_custom_admin_sites(settings):
    from modelsheet.admin import ModelSheetAdmin

    class CategoryAdmin(ModelSheetAdmin):
        sheet_fields = ("name",)

    site = admin.AdminSite(name="custom")
    site.register(Category, CategoryAdmin)
    settings.MODELSHEET = {"models": ["shop.Category"]}
    call_command("modelsheet_roles", stdout=StringIO())
    permissions = Group.objects.get(name="ModelSheet Viewer").permissions
    assert permissions.filter(codename="view_category").exists()
    assert permissions.filter(codename="view_field_shop_category_name").exists()
    assert not permissions.filter(codename="view_product").exists()


def test_roles_require_an_enabled_admin(settings):
    settings.MODELSHEET = {"models": []}
    with pytest.raises(CommandError, match="Register an enabled ModelSheetAdmin"):
        call_command("modelsheet_roles", stdout=StringIO())
    assert not Group.objects.filter(name__startswith="ModelSheet").exists()


def test_invalid_configuration_reported(settings):
    settings.MODELSHEET = {"models": ["shop.NoSuchModel"], "count_mode": "fast", "page_size": 0}
    codes = {error.id for error in check_configuration(None)}
    assert {"modelsheet.E001", "modelsheet.E002", "modelsheet.E003"} <= codes


def test_cleanup_only_removes_old_terminal_data(api, products):
    view = loaded(api)
    post(api, "save", save_payload(view, {"price": 12}))
    operation = Operation.objects.get()
    Operation.objects.filter(pk=operation.pk).update(
        updated_at=timezone.now() - timedelta(days=366)
    )
    ViewSnapshot.objects.update(created_at=timezone.now() - timedelta(hours=2))
    active = Operation.objects.create(
        user=operation.user,
        site_name="admin",
        model_label="shop.Product",
        idempotency_key="active",
        request_hash="hash",
        status="running",
    )
    Operation.objects.filter(pk=active.pk).update(updated_at=timezone.now() - timedelta(days=366))
    call_command("modelsheet_cleanup", stdout=StringIO())
    assert not ViewSnapshot.objects.exists()
    assert list(Operation.objects.values_list("id", flat=True)) == [active.pk]


@pytest.mark.parametrize("value", [1.5, "1e9999999", True, {"value": 1}])
def test_integer_values_never_silently_truncate(api, products, value):
    view = loaded(api)
    response = post(api, "save", save_payload(view, {"stock": value}))
    assert response.status_code == 400


class ConstraintAdapter(SaveAdapter):
    def save(self, instance, fields, request):
        raise IntegrityError("Do not expose raw database details")


def test_database_constraint_is_row_error_and_rolls_back(api, products, settings):
    settings.MODELSHEET = {
        **settings.MODELSHEET,
        "save_adapter": "tests.test_configuration.ConstraintAdapter",
    }
    view = loaded(api)
    response = post(api, "save", save_payload(view, {"price": 12}))
    assert response.status_code == 409
    assert response.json()["error"]["pk"] == str(products[0].pk)
    assert b"raw database details" not in response.content
    assert not Operation.objects.exists()


def test_preview_validation_error_can_include_decimal_formula_values(api, products):
    response = post(
        api,
        "bulk/preview",
        preview_payload(assignments={"stock": "=[stock]-1", "price": "=[price]*1.07"}),
    )
    assert response.status_code == 200, response.content
    assert response.json()["errors"] == 1


def test_standard_russian_javascript_catalog(api):
    api.cookies["django_language"] = "ru"
    response = api.get("/admin/shop/product/sheet/jsi18n/")
    assert response.status_code == 200
    assert "Save" in response.content.decode()
