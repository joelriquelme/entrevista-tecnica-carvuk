import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { CartContext, type CartContextValue } from './CartContext'
import { cartReducer, parseStoredCart, type CartState } from './cartReducer'

const STORAGE_KEY = 'carrito-feliz:cart'

function loadCart(): CartState {
  try {
    return parseStoredCart(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // localStorage can be unavailable (private mode, blocked storage).
    return parseStoredCart(null)
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Persisting is a convenience; the cart still works in memory.
    }
  }, [state])

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      itemCount: state.lines.reduce((sum, line) => sum + line.quantity, 0),
      getQuantity: (productId) =>
        state.lines.find((line) => line.productId === productId)?.quantity ?? 0,
      add: (product, quantity) => dispatch({ type: 'add', product, quantity }),
      increment: (productId) => dispatch({ type: 'increment', productId }),
      decrement: (productId) => dispatch({ type: 'decrement', productId }),
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
      remove: (productId) => dispatch({ type: 'remove', productId }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [state],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
