from django.contrib import admin

from .models import Product, Receipt, ReceiptItem, WebhookEvent


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'updated_at']
    search_fields = ['name']


class ReceiptItemInline(admin.TabularInline):
    model = ReceiptItem
    extra = 0
    can_delete = False
    readonly_fields = ['product', 'product_name', 'unit_price', 'quantity', 'subtotal']


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'created_at', 'gross_total', 'tax', 'net_total', 'sii_status', 'sii_code']
    list_filter = ['sii_status']
    readonly_fields = [f.name for f in Receipt._meta.fields]
    inlines = [ReceiptItemInline]


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'source', 'received_at', 'processed', 'error']
    list_filter = ['processed']
    readonly_fields = ['source', 'payload', 'received_at', 'processed', 'error']
