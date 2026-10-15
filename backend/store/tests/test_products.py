from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from store.models import Product


class ProductApiTests(APITestCase):
    def test_seed_products_are_loaded(self):
        names = set(Product.objects.values_list('name', flat=True))
        self.assertTrue({'Leche', 'Pan', 'Aceite'} <= names)

    def test_list_products(self):
        response = self.client.get(reverse('product-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), Product.objects.count())

    def test_create_product(self):
        response = self.client.post(reverse('product-list'), {'name': '  Té  ', 'price': 1800}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Té')

    def test_create_requires_name_and_positive_price(self):
        response = self.client.post(reverse('product-list'), {'name': '   ', 'price': 0}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('price', response.data)

    def test_update_and_delete_product(self):
        product = Product.objects.create(name='Sal', price=500)
        url = reverse('product-detail', args=[product.id])
        response = self.client.patch(url, {'price': 600}, format='json')
        self.assertEqual(response.data['price'], 600)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(pk=product.id).exists())

    def test_tax_endpoint(self):
        response = self.client.get(reverse('tax-info'))
        self.assertEqual(response.data, {'rate': 0.15})
