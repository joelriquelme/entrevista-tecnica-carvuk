from django.test import SimpleTestCase

from store.services.tax import TAX_RATE, calculate_totals


class CalculateTotalsTests(SimpleTestCase):
    def test_rate_is_fixed_at_15_percent(self):
        self.assertEqual(str(TAX_RATE), '0.15')

    def test_statement_example(self):
        # 2 x Leche $1.100 + 1 x Aceite $2.000 = $4.200
        self.assertEqual(calculate_totals(4200), (630, 3570))

    def test_rounds_half_up_to_whole_pesos(self):
        self.assertEqual(calculate_totals(4210), (632, 3578))  # 631.5 -> 632
        self.assertEqual(calculate_totals(4203), (630, 3573))  # 630.45 -> 630

    def test_net_plus_tax_is_always_gross(self):
        for gross in (0, 1, 7, 999, 1100, 123457):
            tax, net = calculate_totals(gross)
            self.assertEqual(tax + net, gross)

    def test_negative_gross_is_rejected(self):
        with self.assertRaises(ValueError):
            calculate_totals(-1)
