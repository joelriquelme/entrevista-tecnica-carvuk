from rest_framework import serializers

from .models import Product, Receipt, ReceiptItem


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El nombre es obligatorio.')
        return value


class ReceiptItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptItem
        fields = ['id', 'product', 'product_name', 'unit_price', 'quantity', 'subtotal']


class ReceiptSerializer(serializers.ModelSerializer):
    items = ReceiptItemSerializer(many=True, read_only=True)

    class Meta:
        model = Receipt
        fields = [
            'id', 'gross_total', 'tax', 'net_total', 'created_by', 'created_at',
            'sii_status', 'sii_code', 'pdf_url', 'sii_error', 'sii_requested_at', 'sii_issued_at',
            'items',
        ]
        read_only_fields = fields


class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class ReceiptCreateSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True, allow_empty=False, error_messages={'empty': 'El carrito está vacío.'})

