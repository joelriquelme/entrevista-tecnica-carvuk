export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 999

export type CartLine = {
  productId: number
  name: string
  unitPrice: number
  quantity: number
}

export type CartState = {
  lines: CartLine[]
}

export type CartProduct = {
  id: number
  name: string
  price: number
}

export type CartAction =
  | { type: 'add'; product: CartProduct; quantity?: number }
  | { type: 'increment'; productId: number }
  | { type: 'decrement'; productId: number }
  | { type: 'setQuantity'; productId: number; quantity: number }
  | { type: 'remove'; productId: number }
  | { type: 'clear' }

export const emptyCart: CartState = { lines: [] }

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity)))
}

function updateQuantity(state: CartState, productId: number, quantity: number): CartState {
  return {
    lines: state.lines.map((line) =>
      line.productId === productId ? { ...line, quantity: clampQuantity(quantity) } : line,
    ),
  }
}

function findLine(state: CartState, productId: number): CartLine | undefined {
  return state.lines.find((line) => line.productId === productId)
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const { product } = action
      const quantity = clampQuantity(action.quantity ?? 1)
      const existing = findLine(state, product.id)
      if (!existing) {
        return {
          lines: [
            ...state.lines,
            { productId: product.id, name: product.name, unitPrice: product.price, quantity },
          ],
        }
      }
      return {
        lines: state.lines.map((line) =>
          line.productId === product.id
            ? {
                ...line,
                name: product.name,
                unitPrice: product.price,
                quantity: clampQuantity(line.quantity + quantity),
              }
            : line,
        ),
      }
    }
    case 'increment': {
      const line = findLine(state, action.productId)
      return line ? updateQuantity(state, action.productId, line.quantity + 1) : state
    }
    case 'decrement': {
      const line = findLine(state, action.productId)
      if (!line) return state
      if (line.quantity <= MIN_QUANTITY) {
        return { lines: state.lines.filter((item) => item.productId !== action.productId) }
      }
      return updateQuantity(state, action.productId, line.quantity - 1)
    }
    case 'setQuantity':
      return updateQuantity(state, action.productId, action.quantity)
    case 'remove':
      return { lines: state.lines.filter((line) => line.productId !== action.productId) }
    case 'clear':
      return emptyCart
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false
  const line = value as Record<string, unknown>
  return (
    Number.isInteger(line.productId) &&
    typeof line.name === 'string' &&
    Number.isInteger(line.unitPrice) &&
    Number.isInteger(line.quantity)
  )
}

/** Parses persisted cart data defensively; anything malformed is discarded. */
export function parseStoredCart(raw: string | null): CartState {
  if (!raw) return emptyCart
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return emptyCart
    const lines: unknown = (parsed as { lines?: unknown }).lines
    if (!Array.isArray(lines)) return emptyCart
    return {
      lines: lines
        .filter(isCartLine)
        .map((line) => ({ ...line, quantity: clampQuantity(line.quantity) })),
    }
  } catch {
    return emptyCart
  }
}
