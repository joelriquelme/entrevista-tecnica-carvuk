from django.core.validators import MinValueValidator
from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.PositiveIntegerField(validators=[MinValueValidator(1)], help_text='Precio en CLP, impuesto incluido')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name', 'id']

    def __str__(self):
        return f'{self.name} (${self.price})'


class Receipt(models.Model):
    class SiiStatus(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        REQUESTED = 'requested', 'Emitiendo'
        ISSUED = 'issued', 'Emitida'
        FAILED = 'failed', 'Error'

    # Snapshot: a receipt must not change if prices or the tax rule change later.
    gross_total = models.PositiveIntegerField()
    tax = models.PositiveIntegerField()
    net_total = models.PositiveIntegerField()
    created_by = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    sii_status = models.CharField(max_length=20, choices=SiiStatus.choices, default=SiiStatus.PENDING)
    sii_code = models.CharField(max_length=100, blank=True)
    pdf_url = models.URLField(max_length=500, blank=True)
    sii_error = models.TextField(blank=True)
    sii_requested_at = models.DateTimeField(null=True, blank=True)
    sii_issued_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f'Boleta #{self.pk}'


class ReceiptItem(models.Model):
    receipt = models.ForeignKey(Receipt, related_name='items', on_delete=models.CASCADE)
    # Nullable so deleting a product from the catalog keeps the receipt history intact.
    product = models.ForeignKey(Product, related_name='receipt_items', null=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=200)
    unit_price = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    subtotal = models.PositiveIntegerField()

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.quantity} x {self.product_name}'


class WebhookEvent(models.Model):
    """Raw log of every SII webhook call, as evidence and for debugging."""

    source = models.CharField(max_length=50, default='sii')
    payload = models.JSONField(default=dict, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    error = models.TextField(blank=True)

    class Meta:
        ordering = ['-received_at']

    def __str__(self):
        return f'{self.source} webhook #{self.pk}'
