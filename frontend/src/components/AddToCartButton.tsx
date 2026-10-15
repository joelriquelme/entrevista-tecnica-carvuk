import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { MAX_QUANTITY } from '../cart/cartReducer'
import type { Product } from '../types'

type AddToCartButtonProps = {
  product: Product
  quantity?: number
}

export function AddToCartButton({ product, quantity = 1 }: AddToCartButtonProps) {
  const { add, getQuantity } = useCart()
  const inCart = getQuantity(product.id)

  return (
    <div className="add-to-cart">
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => add(product, quantity)}
        disabled={inCart >= MAX_QUANTITY}
      >
        Agregar al carrito<span className="visually-hidden">: {product.name}</span>
      </button>
      <span aria-live="polite">
        {inCart > 0 && (
          <Link to="/carrito" className="in-cart">
            En carrito ({inCart})
          </Link>
        )}
      </span>
    </div>
  )
}
