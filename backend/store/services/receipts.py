from django.db import transaction
from rest_framework.exceptions import ValidationError

from ..models import Product, Receipt, ReceiptItem
from .tax import calculate_totals


def create_receipt(items: list[dict], created_by: str = '') -> Receipt:
    """Create a receipt from cart items [{product_id, quantity}].

    Repeated products are merged, prices are snapshotted and totals are computed
    with the fixed tax rule. The receipt starts as "pending": the SII emission is
    requested explicitly afterwards (see services.sii).
    """
    quantities: dict[int, int] = {}
    for item in items:
        quantities[item['product_id']] = quantities.get(item['product_id'], 0) + item['quantity']

    products = Product.objects.in_bulk(list(quantities))
    missing = [pid for pid in quantities if pid not in products]
    if missing:
        raise ValidationError({'items': [f'Productos no encontrados: {", ".join(map(str, missing))}.']})

    with transaction.atomic():
        lines = [
            ReceiptItem(
                product=products[pid],
                product_name=products[pid].name,
                unit_price=products[pid].price,
                quantity=qty,
                subtotal=products[pid].price * qty,
            )
            for pid, qty in quantities.items()
        ]
        gross_total = sum(line.subtotal for line in lines)
        tax, net_total = calculate_totals(gross_total)
        receipt = Receipt.objects.create(
            gross_total=gross_total, tax=tax, net_total=net_total, created_by=created_by
        )
        for line in lines:
            line.receipt = receipt
        ReceiptItem.objects.bulk_create(lines)

    return receipt
