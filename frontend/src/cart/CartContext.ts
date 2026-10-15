import { createContext, useContext } from 'react'
import type { CartLine, CartProduct } from './cartReducer'

export type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  getQuantity: (productId: number) => number
  add: (product: CartProduct, quantity?: number) => void
  increment: (productId: number) => void
  decrement: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
