from django.db.models import Prefetch
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Product, Receipt, ReceiptItem
from .serializers import ProductSerializer, ReceiptCreateSerializer, ReceiptSerializer
from .services.receipts import create_receipt
from .services.tax import TAX_RATE


@api_view(['GET'])
def tax_info(request):
    return Response({'rate': float(TAX_RATE)})


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class ReceiptViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    queryset = Receipt.objects.prefetch_related(Prefetch('items', queryset=ReceiptItem.objects.order_by('id')))
    serializer_class = ReceiptSerializer

    def create(self, request, *args, **kwargs):
        payload = ReceiptCreateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        receipt = create_receipt(payload.validated_data['items'])
        return Response(self._serialize(receipt.pk), status=status.HTTP_201_CREATED)

    def _serialize(self, pk):
        return self.get_serializer(self.get_queryset().get(pk=pk)).data
