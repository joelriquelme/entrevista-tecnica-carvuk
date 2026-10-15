import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/errors'
import { useCreateReceipt, useProducts, useTaxRate } from '../api/queries'
import { useCart } from '../cart/CartContext'
import { QuantityStepper } from '../components/QuantityStepper'
import { EmptyState } from '../components/QueryStates'
import { TotalsSummary } from '../components/TotalsSummary'
import { formatCLP } from '../lib/money'
import { calculateTotals } from '../lib/totals'

export function CartPage() {
  const cart = useCart()
  const navigate = useNavigate()
  const products = useProducts()
  const tax = useTaxRate()
  const createReceipt = useCreateReceipt()

  // Reconcile cart lines with the live catalog: prices/names may have changed
  // and products may have been deleted since they were added.
  const catalog = products.data ? new Map(products.data.map((product) => [product.id, product])) : null
  const lines = cart.lines.map((line) => {
    const product = catalog?.get(line.productId)
    return {
      ...line,
      name: product?.name ?? line.name,
      unitPrice: product?.price ?? line.unitPrice,
      priceChanged: product !== undefined && product.price !== line.unitPrice,
      unavailable: catalog !== null && product === undefined,
    }
  })
  const hasUnavailable = lines.some((line) => line.unavailable)
  const totals = calculateTotals(lines, tax.rate)

  const handleGenerate = () => {
    createReceipt.mutate(
      lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      {
        onSuccess: (receipt) => {
          cart.clear()
          navigate(`/boletas/${receipt.id}`)
        },
      },
    )
  }

  if (cart.lines.length === 0) {
    return (
      <section>
        <h1>Carrito</h1>
        <EmptyState title="Tu carrito está vacío">
          <p className="muted">Agrega productos desde el catálogo para generar una boleta.</p>
          <Link to="/" className="btn btn--primary">
            Ir al catálogo
          </Link>
        </EmptyState>
      </section>
    )
  }

  return (
    <section>
      <div className="page-header">
        <h1>Carrito</h1>
        <button
          type="button"
          className="btn btn--link"
          onClick={() => {
            if (window.confirm('¿Vaciar el carrito?')) cart.clear()
          }}
          disabled={createReceipt.isPending}
        >
          Vaciar carrito
        </button>
      </div>

      <div className="cart-layout">
        <ul className="cart-lines" aria-label="Productos en el carrito">
          {lines.map((line) => (
            <li key={line.productId} className={`card cart-line${line.unavailable ? ' cart-line--unavailable' : ''}`}>
              <div className="cart-line__info">
                {line.unavailable ? (
                  <span className="cart-line__name">{line.name}</span>
                ) : (
                  <Link to={`/productos/${line.productId}`} className="cart-line__name">
                    {line.name}
                  </Link>
                )}
                <span className="muted small">{formatCLP(line.unitPrice)} c/u</span>
                {line.unavailable && (
                  <span className="field__error">Este producto ya no está disponible. Quítalo para continuar.</span>
                )}
                {line.priceChanged && (
                  <span className="note">El precio cambió desde que lo agregaste.</span>
                )}
              </div>
              <QuantityStepper
                value={line.quantity}
                label={line.name}
                onChange={(quantity) => cart.setQuantity(line.productId, quantity)}
                onRemove={() => cart.remove(line.productId)}
              />
              <span className="cart-line__subtotal">{formatCLP(line.unitPrice * line.quantity)}</span>
              <button
                type="button"
                className="btn btn--link btn--danger-text"
                onClick={() => cart.remove(line.productId)}
                aria-label={`Quitar ${line.name} del carrito`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>

        <aside className="card summary" aria-label="Resumen de la compra">
          <h2>Resumen</h2>
          <TotalsSummary net={totals.net} tax={totals.tax} gross={totals.gross} rate={tax.rate} />
          {tax.isFallback && (
            <p className="note">No se pudo obtener la tasa de impuesto; se muestra una estimación con 15%.</p>
          )}
          {products.isError && (
            <p className="note">No se pudo verificar el catálogo; los precios pueden estar desactualizados.</p>
          )}
          {createReceipt.isError && (
            <p className="alert alert--error" role="alert">
              No se pudo generar la boleta. {getErrorMessage(createReceipt.error)}
            </p>
          )}
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleGenerate}
            disabled={createReceipt.isPending || hasUnavailable || tax.isLoading}
          >
            {createReceipt.isPending ? 'Generando boleta…' : 'Generar boleta'}
          </button>
          <p className="muted small">El total final lo calcula el servidor al emitir la boleta.</p>
        </aside>
      </div>
    </section>
  )
}
