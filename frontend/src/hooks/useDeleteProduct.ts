import { useDeleteProduct as useDeleteProductMutation } from '../api/queries'
import { useCart } from '../cart/CartContext'
import type { Product } from '../types'

/** Asks for confirmation, deletes the product and drops it from the cart. */
export function useConfirmDeleteProduct() {
  const mutation = useDeleteProductMutation()
  const { remove } = useCart()

  const requestDelete = (product: Product, onDeleted?: () => void) => {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}"? Esta acción no se puede deshacer. Las boletas ya emitidas no se verán afectadas.`,
    )
    if (!confirmed) return
    mutation.mutate(product.id, {
      onSuccess: () => {
        remove(product.id)
        onDeleted?.()
      },
    })
  }

  return {
    requestDelete,
    deletingId: mutation.isPending ? mutation.variables : undefined,
    error: mutation.error,
    reset: mutation.reset,
  }
}
