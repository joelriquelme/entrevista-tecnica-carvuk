import { useState } from 'react'
import { useDeleteProduct as useDeleteProductMutation } from '../api/queries'
import { useCart } from '../cart/CartContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Product } from '../types'

type PendingDelete = { product: Product; onDeleted?: () => void }

/**
 * Asks for confirmation in a dialog, deletes the product and drops it from the cart.
 * Render `confirmDialog` somewhere in the page.
 */
export function useConfirmDeleteProduct() {
  const mutation = useDeleteProductMutation()
  const { remove } = useCart()
  const [pending, setPending] = useState<PendingDelete | null>(null)

  const requestDelete = (product: Product, onDeleted?: () => void) => {
    mutation.reset()
    setPending({ product, onDeleted })
  }

  const confirmDelete = () => {
    if (!pending) return
    const { product, onDeleted } = pending
    setPending(null)
    mutation.mutate(product.id, {
      onSuccess: () => {
        remove(product.id)
        onDeleted?.()
      },
    })
  }

  const confirmDialog = pending && (
    <ConfirmDialog
      title="Eliminar producto"
      confirmLabel="Eliminar"
      onConfirm={confirmDelete}
      onCancel={() => setPending(null)}
    >
      <p>
        ¿Eliminar <strong>{pending.product.name}</strong> del catálogo? Esta acción no se puede deshacer.
      </p>
      <p className="muted small">Las boletas ya generadas no se verán afectadas.</p>
    </ConfirmDialog>
  )

  return {
    requestDelete,
    confirmDialog,
    deletingId: mutation.isPending ? mutation.variables : undefined,
    error: mutation.error,
    reset: mutation.reset,
  }
}
