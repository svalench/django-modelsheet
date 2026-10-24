from django.core.exceptions import ValidationError
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=[("ready", "Ready"), ("order", "Order")], default="ready"
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT, null=True, blank=True)
    active = models.BooleanField(default=True)
    available_on = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True)

    def clean(self):
        if self.price is not None and self.cost_price is not None and self.price < self.cost_price:
            raise ValidationError({"price": "Price must not be lower than cost."})
        if self.stock is not None and self.stock < 0:
            raise ValidationError({"stock": "Stock cannot be negative."})

    def __str__(self):
        return self.name


class Order(models.Model):
    reference = models.CharField(max_length=40, unique=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
