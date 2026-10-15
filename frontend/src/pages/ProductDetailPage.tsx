import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage, isNotFound } from '../api/errors'
import { useProduct } from '../api/queries'
import { AddToCartButton } from '../components/AddToCartButton'
import { ProductFormDialog } from '../components/ProductFormDialog'
import { QuantityStepper } from '../components/QuantityStepper'
import { EmptyState, ErrorState, LoadingState } from '../components/QueryStates'
import { useConfirmDeleteProduct } from '../hooks/useDeleteProduct'
import { formatDateTime } from '../lib/date'
import { formatCLP } from '../lib/money'
import { NotFoundPage } from './NotFoundPage'

export function ProductDetailPage() {
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const product = useProduct(productId)
  const [quantity, setQuantity] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const { requestDelete, deletingId, error: deleteError } = useConfirmDeleteProduct()

  if (!Number.isInteger(productId) || productId <= 0) return <NotFoundPage />

  return (
    <section>
      <Link to="/" className="back-link">
        ← Volver al catálogo
      </Link>

      {product.isPending ? (
        <LoadingState label="Cargando producto…" />
      ) : product.isError ? (
        isNotFound(product.error) ? (
          <EmptyState title="Producto no encontrado">
            <p className="muted">Puede que haya sido eliminado.</p>
            <Link to="/" className="btn btn--primary">
              Ir al catálogo
            </Link>
          </EmptyState>
        ) : (
          <ErrorState error={product.error} onRetry={() => void product.refetch()} />
        )
      ) : (
        <article className="card detail">
          <h1>{product.data.name}</h1>
          <p className="price price--large">{formatCLP(product.data.price)}</p>
          <p className="detail__description">
            {product.data.description || <span className="muted">Sin descripción</span>}
          </p>
          <p className="muted small">Actualizado: {formatDateTime(product.data.updated_at)}</p>

          <div className="detail__buy">
            <QuantityStepper value={quantity} onChange={setQuantity} label={product.data.name} />
            <AddToCartButton product={product.data} quantity={quantity} />
          </div>

          {deleteError && (
            <p className="alert alert--error" role="alert">
              No se pudo eliminar el producto. {getErrorMessage(deleteError)}
            </p>
          )}

          <div className="detail__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setIsEditing(true)}>
              Editar
            </button>
            <button
              type="button"
              className="btn btn--danger"
              disabled={deletingId === product.data.id}
              onClick={() => requestDelete(product.data, () => navigate('/', { replace: true }))}
            >
              {deletingId === product.data.id ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>

          {isEditing && (
            <ProductFormDialog product={product.data} onClose={() => setIsEditing(false)} />
          )}
        </article>
      )}
    </section>
  )
}
