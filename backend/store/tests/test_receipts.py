from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from store.authentication import ClerkUser
from store.models import Product, Receipt


class ReceiptApiTests(APITestCase):
    def setUp(self):
        self.milk = Product.objects.create(name='Leche test', price=1100)
        self.oil = Product.objects.create(name='Aceite test', price=2000)

    def create(self, items):
        return self.client.post(reverse('receipt-list'), {'items': items}, format='json')

    def test_create_receipt_computes_totals(self):
        response = self.create([
            {'product_id': self.milk.id, 'quantity': 2},
            {'product_id': self.oil.id, 'quantity': 1},
        ])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            (response.data['gross_total'], response.data['tax'], response.data['net_total']), (4200, 630, 3570)
        )
        self.assertEqual(response.data['sii_status'], 'pending')
        self.assertEqual(len(response.data['items']), 2)

    def test_items_snapshot_name_and_price(self):
        receipt_id = self.create([{'product_id': self.milk.id, 'quantity': 1}]).data['id']
        self.milk.price = 9999
        self.milk.save()
        self.milk.delete()
        item = self.client.get(reverse('receipt-detail', args=[receipt_id])).data['items'][0]
        self.assertEqual((item['product'], item['product_name'], item['unit_price']), (None, 'Leche test', 1100))

    def test_repeated_products_are_merged(self):
        response = self.create([
            {'product_id': self.milk.id, 'quantity': 1},
            {'product_id': self.milk.id, 'quantity': 2},
        ])
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['quantity'], 3)
        self.assertEqual(response.data['gross_total'], 3300)

    def test_invalid_carts_are_rejected_without_creating_receipts(self):
        cases = [
            [],
            [{'product_id': self.milk.id, 'quantity': 0}],
            [{'product_id': 999999, 'quantity': 1}],
            [{'product_id': self.milk.id, 'quantity': 1}, {'product_id': 999999, 'quantity': 1}],
        ]
        for items in cases:
            with self.subTest(items=items):
                self.assertEqual(self.create(items).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Receipt.objects.count(), 0)

    def test_history_is_newest_first(self):
        first = self.create([{'product_id': self.milk.id, 'quantity': 1}]).data['id']
        second = self.create([{'product_id': self.oil.id, 'quantity': 1}]).data['id']
        ids = [r['id'] for r in self.client.get(reverse('receipt-list')).data]
        self.assertEqual(ids, [second, first])

    def test_each_user_only_sees_their_receipts(self):
        self.client.force_authenticate(ClerkUser(id='user_a'))
        own = self.create([{'product_id': self.milk.id, 'quantity': 1}]).data
        self.assertEqual(own['created_by'], 'user_a')

        self.client.force_authenticate(ClerkUser(id='user_b'))
        self.assertEqual(self.client.get(reverse('receipt-list')).data, [])
        response = self.client.get(reverse('receipt-detail', args=[own['id']]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
