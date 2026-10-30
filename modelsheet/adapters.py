import datetime as dt
from decimal import ROUND_HALF_EVEN, Decimal, localcontext

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def serialize(value):
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


class FieldAdapter:
    def supported(self, field):
        return (
            isinstance(
                field,
                (
                    models.CharField,
                    models.TextField,
                    models.IntegerField,
                    models.DecimalField,
                    models.FloatField,
                    models.BooleanField,
                    models.DateField,
                    models.TimeField,
                    models.UUIDField,
                    models.ForeignKey,
                ),
            )
            and not field.primary_key
        )

    def editable(self, field):
        return self.supported(field) and field.editable and not isinstance(field, models.ForeignKey)

    def serialize(self, field, instance):
        return serialize(field.value_from_object(instance))

    def parse(self, field, value):
        if isinstance(value, (dict, list)):
            raise ValidationError("A scalar value is required.")
        if value is None or value == "":
            if field.null:
                return None
            if isinstance(field, (models.CharField, models.TextField)):
                return ""
            raise ValidationError("This field cannot be empty.")
        if isinstance(field, models.BooleanField) and isinstance(value, str):
            if value.lower() in ("true", "1"):
                value = True
            elif value.lower() in ("false", "0"):
                value = False
        if isinstance(field, models.DecimalField):
            value = Decimal(str(value))
            if not value.is_finite():
                raise ValidationError("A finite decimal is required.")
            with localcontext() as context:
                context.prec = max(28, field.max_digits + 2)
                value = value.quantize(
                    Decimal(1).scaleb(-field.decimal_places), rounding=ROUND_HALF_EVEN
                )
        if isinstance(field, models.IntegerField) and not isinstance(field, models.BooleanField):
            integer = Decimal(str(value))
            if (
                isinstance(value, bool)
                or not integer.is_finite()
                or integer.adjusted() > 19
                or integer != integer.to_integral_value()
            ):
                raise ValidationError("An integer is required.")
        if isinstance(field, models.FloatField):
            import math

            if not math.isfinite(float(value)):
                raise ValidationError("A finite number is required.")
        value = field.to_python(value)
        if isinstance(value, dt.datetime) and timezone.is_naive(value) and settings.USE_TZ:
            value = timezone.make_aware(value, dt.UTC)
        elif isinstance(value, dt.datetime) and timezone.is_aware(value) and not settings.USE_TZ:
            value = value.astimezone(dt.UTC).replace(tzinfo=None)
        return value

    def metadata(self, field):
        return {
            "name": field.name,
            "label": str(field.verbose_name),
            "type": field.get_internal_type(),
            "nullable": field.null,
            "choices": [[serialize(k), str(v)] for k, v in field.flatchoices],
        }


class SaveAdapter:
    """Override for project validation/business logic. External effects must be idempotent."""

    def validate(self, instance, request):
        instance.full_clean()

    def save(self, instance, fields, request):
        instance.save()


class BackgroundAdapter:
    """Implement enqueue and capture/restore_context; see docs/background.md."""

    def capture_context(self, request):
        return {}

    def restore_context(self, user, context):
        raise NotImplementedError("Restore a request including tenant and project context")

    def enqueue(self, operation_id, phase):
        raise NotImplementedError("Durably enqueue modelsheet.background.process(id, phase)")
