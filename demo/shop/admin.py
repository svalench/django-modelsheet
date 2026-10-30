from django.contrib import admin

from modelsheet.admin import ModelSheetAdmin

from .models import Category, Order, Product


@admin.register(Product)
class ProductAdmin(ModelSheetAdmin):
    list_display = ("name", "price", "stock", "status", "category", "active")
    list_filter = ("status", "category", "active")
    search_fields = ("name", "note")
    sheet_fields = (
        "name",
        "price",
        "cost_price",
        "stock",
        "status",
        "category",
        "active",
        "available_on",
        "note",
    )
    sheet_editable = (
        "name",
        "price",
        "cost_price",
        "stock",
        "status",
        "active",
        "available_on",
        "note",
    )
    sheet_computed_fields = {"inventory_value": "=[price]*[stock]"}
    list_per_page = 200


@admin.register(Order)
class OrderAdmin(ModelSheetAdmin):
    list_display = ("reference", "total", "paid")
    sheet_fields = ("reference", "total", "paid", "created_at")
    sheet_editable = ("paid",)
    search_fields = ("reference",)
    list_per_page = 200


admin.site.register(Category)
