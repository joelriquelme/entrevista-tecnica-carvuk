from decimal import ROUND_HALF_UP, Decimal

# Fixed by the business, regardless of the products.
TAX_RATE = Decimal('0.15')


def calculate_totals(gross_total: int) -> tuple[int, int]:
    """Return (tax, net_total) for a gross amount in whole CLP (prices include tax)."""
    if gross_total < 0:
        raise ValueError('gross_total must be >= 0')
    tax = int((Decimal(gross_total) * TAX_RATE).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    return tax, gross_total - tax
