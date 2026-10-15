from django.db.models import Prefetch
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from .models import Product, Receipt, ReceiptItem
from .serializers import ProductSerializer, ReceiptCreateSerializer, ReceiptSerializer
from .services.receipts import create_receipt
from .services.sii import request_sii_emission
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

    def get_queryset(self):
        # With auth enabled every user only sees the receipts they created.
        queryset = super().get_queryset()
        user_id = self._user_id()
        return queryset.filter(created_by=user_id) if user_id else queryset

    def create(self, request, *args, **kwargs):
        payload = ReceiptCreateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        receipt = create_receipt(payload.validated_data['items'], created_by=self._user_id())
        return Response(self._serialize(receipt.pk), status=status.HTTP_201_CREATED)

    def _user_id(self) -> str:
        return getattr(self.request.user, 'id', '') or ''

    @action(detail=True, methods=['post'])
    def emit(self, request, pk=None):
        """Retry the SII emission of a receipt that is pending or failed."""
        receipt = self.get_object()
        if receipt.sii_status not in (Receipt.SiiStatus.PENDING, Receipt.SiiStatus.FAILED):
            return Response(
                {'detail': f'La boleta ya está en estado "{receipt.get_sii_status_display()}".'},
                status=status.HTTP_409_CONFLICT,
            )
        request_sii_emission(receipt.pk)
        return Response(self._serialize(receipt.pk))

    def _serialize(self, pk):
        # Re-read: the SII request (and even its webhook) may have changed the receipt meanwhile.
        return self.get_serializer(self.get_queryset().get(pk=pk)).data
