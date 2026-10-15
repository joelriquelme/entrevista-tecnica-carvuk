import { describe, expect, it } from 'vitest'
import { calculateTotals } from './totals'

describe('calculateTotals', () => {
  it('matches the example from the spec', () => {
    const totals = calculateTotals(
      [
        { unitPrice: 1100, quantity: 2 },
        { unitPrice: 2000, quantity: 1 },
      ],
      0.15,
    )
    expect(totals).toEqual({ gross: 4200, tax: 630, net: 3570 })
  })

  it('rounds half up to whole pesos', () => {
    // 4210 × 0.15 = 631.5 → 632
    expect(calculateTotals([{ unitPrice: 4210, quantity: 1 }], 0.15).tax).toBe(632)
    // 4209 × 0.15 = 631.35 → 631
    expect(calculateTotals([{ unitPrice: 4209, quantity: 1 }], 0.15).tax).toBe(631)
  })

  it('returns zeros for an empty cart', () => {
    expect(calculateTotals([], 0.15)).toEqual({ gross: 0, tax: 0, net: 0 })
  })
})
