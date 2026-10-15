import { describe, expect, it } from 'vitest'
import { MAX_QUANTITY, cartReducer, emptyCart, parseStoredCart, type CartState } from './cartReducer'

const milk = { id: 1, name: 'Leche', price: 1100 }
const oil = { id: 2, name: 'Aceite', price: 2000 }

function withMilk(quantity = 1): CartState {
  return cartReducer(emptyCart, { type: 'add', product: milk, quantity })
}

describe('cartReducer', () => {
  it('adds a new product as a line', () => {
    expect(withMilk().lines).toEqual([{ productId: 1, name: 'Leche', unitPrice: 1100, quantity: 1 }])
  })

  it('accumulates quantity when adding an existing product', () => {
    const state = cartReducer(withMilk(2), { type: 'add', product: milk, quantity: 3 })
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0].quantity).toBe(5)
  })

  it('refreshes the price when adding an existing product again', () => {
    const state = cartReducer(withMilk(), { type: 'add', product: { ...milk, price: 1200 } })
    expect(state.lines[0].unitPrice).toBe(1200)
  })

  it('increments and decrements', () => {
    let state = cartReducer(withMilk(), { type: 'increment', productId: 1 })
    expect(state.lines[0].quantity).toBe(2)
    state = cartReducer(state, { type: 'decrement', productId: 1 })
    expect(state.lines[0].quantity).toBe(1)
  })

  it('removes the line when decrementing from 1', () => {
    expect(cartReducer(withMilk(), { type: 'decrement', productId: 1 }).lines).toEqual([])
  })

  it('clamps quantities to the allowed range', () => {
    const tooLow = cartReducer(withMilk(), { type: 'setQuantity', productId: 1, quantity: 0 })
    expect(tooLow.lines[0].quantity).toBe(1)
    const tooHigh = cartReducer(withMilk(), { type: 'setQuantity', productId: 1, quantity: 5000 })
    expect(tooHigh.lines[0].quantity).toBe(MAX_QUANTITY)
  })

  it('removes a line and clears the cart', () => {
    const state = cartReducer(withMilk(), { type: 'add', product: oil })
    const removed = cartReducer(state, { type: 'remove', productId: 1 })
    expect(removed.lines.map((line) => line.productId)).toEqual([2])
    expect(cartReducer(state, { type: 'clear' })).toEqual(emptyCart)
  })
})

describe('parseStoredCart', () => {
  it('returns an empty cart for missing or invalid data', () => {
    expect(parseStoredCart(null)).toEqual(emptyCart)
    expect(parseStoredCart('not json')).toEqual(emptyCart)
    expect(parseStoredCart(JSON.stringify({ lines: 'x' }))).toEqual(emptyCart)
  })

  it('keeps only valid lines', () => {
    const raw = JSON.stringify({
      lines: [
        { productId: 1, name: 'Leche', unitPrice: 1100, quantity: 2 },
        { productId: 'x', name: 'Malo', unitPrice: 1, quantity: 1 },
      ],
    })
    expect(parseStoredCart(raw).lines).toHaveLength(1)
  })
})
