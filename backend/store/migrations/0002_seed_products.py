from django.db import migrations

SEED_PRODUCTS = [
    ('Leche', 'Leche entera 1 L', 1100),
    ('Pan', 'Marraqueta, 1 kg', 1500),
    ('Aceite', 'Aceite vegetal 1 L', 2000),
    ('Arroz', 'Arroz grado 1, 1 kg', 1300),
    ('Huevos', 'Bandeja de 12 huevos', 3200),
    ('Azúcar', 'Azúcar granulada 1 kg', 1200),
    ('Fideos', 'Spaghetti 400 g', 900),
    ('Café', 'Café instantáneo 170 g', 4500),
]


def seed_products(apps, schema_editor):
    Product = apps.get_model('store', 'Product')
    for name, description, price in SEED_PRODUCTS:
        Product.objects.get_or_create(name=name, defaults={'description': description, 'price': price})


def unseed_products(apps, schema_editor):
    Product = apps.get_model('store', 'Product')
    Product.objects.filter(name__in=[name for name, _, _ in SEED_PRODUCTS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('store', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_products, unseed_products),
    ]
