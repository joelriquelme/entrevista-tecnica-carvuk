import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/errors'
import { useProducts } from '../api/queries'
import { AddToCartButton } from '../components/AddToCartButton'
import { ProductFormDialog } from '../components/ProductFormDialog'
import { EmptyState, ErrorState, LoadingState } from '../components/QueryStates'
import { useConfirmDeleteProduct } from '../hooks/useDeleteProduct'
import { formatCLP } from '../lib/money'
import type { Product } from '../types'

type DialogState = { mode: 'create' } | { mode: 'edit'; product: Product } | null

export function CatalogPage() {
  const products = useProducts()
  const [dialog, setDialog] = useState<DialogState>(null)
  const { requestDelete, deletingId, error: deleteError, reset: resetDelete } =
    useConfirmDeleteProduct()

  return (
    <section>
      <div className="page-header">
        <h1>Catálogo</h1>
        <button type="button" className="btn btn--primary" onClick={() => setDialog({ mode: 'create' })}>
          Nuevo producto
        </button>
      </div>

      {deleteError && (
        <div className="alert alert--error" role="alert">
          <span>No se pudo eliminar el producto. {getErrorMessage(deleteError)}</span>
          <button type="button" className="btn btn--link" onClick={resetDelete}>
            Cerrar
          </button>
        </div>
      )}

      {products.isPending ? (
        <LoadingState label="Cargando productos…" />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => void products.refetch()} />
      ) : products.data.length === 0 ? (
        <EmptyState title="Aún no hay productos">
          <p className="muted">Crea el primero con el botón «Nuevo producto».</p>
        </EmptyState>
      ) : (
        <ul className="product-grid">
          {products.data.map((product) => (
            <li key={product.id} className="card product-card">
              <div className="product-card__body">
                <h2 className="product-card__name">
                  <Link to={`/productos/${product.id}`}>{product.name}</Link>
                </h2>
                <p className="product-card__description">
                  {product.description || <span className="muted">Sin descripción</span>}
                </p>
                <p className="price">{formatCLP(product.price)}</p>
              </div>
              <AddToCartButton product={product} />
              <div className="product-card__actions">
                <Link to={`/productos/${product.id}`} className="btn btn--link">
                  Ver detalle
                </Link>
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => setDialog({ mode: 'edit', product })}
                  aria-label={`Editar ${product.name}`}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => requestDelete(product)}
                  disabled={deletingId === product.id}
                  aria-label={`Eliminar ${product.name}`}
                >
                  {deletingId === product.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <ProductFormDialog
          product={dialog.mode === 'edit' ? dialog.product : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  )
}
