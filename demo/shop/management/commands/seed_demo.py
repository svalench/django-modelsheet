from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from demo.shop.models import Category, Product


class Command(BaseCommand):
    help = "Seed local demo products; creates admin/admin only when --create-user is supplied."

    def add_arguments(self, parser):
        parser.add_argument("--rows", type=int, default=500)
        parser.add_argument("--create-user", action="store_true")

    def handle(self, *args, **options):
        category, _ = Category.objects.get_or_create(name="Consumables")
        Product.objects.bulk_create(
            [
                Product(
                    name=f"Product {i:07}",
                    price=Decimal("10.00") + i,
                    stock=i % 30,
                    category=category,
                )
                for i in range(options["rows"])
            ],
            ignore_conflicts=True,
        )
        if options["create_user"]:
            user, created = get_user_model().objects.get_or_create(
                username="admin", defaults={"is_staff": True, "is_superuser": True}
            )
            if created:
                user.set_password("admin")
                user.save()
                self.stdout.write("Local demo login: admin / admin")
        self.stdout.write(f"Products: {Product.objects.count()}")
