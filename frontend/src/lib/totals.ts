export const DEFAULT_TAX_RATE = 0.15

export type Totals = {
  gross: number
  tax: number
  net: number
}

type PricedLine = {
  unitPrice: number
  quantity: number
}

/**
 * Mirrors the backend rules: gross = Σ(unit price × quantity),
 * tax = round(gross × rate) half up in whole pesos, net = gross − tax.
 * Uses integer arithmetic (basis points) to avoid floating point drift on .5 cases.
 */
export function calculateTotals(lines: PricedLine[], rate: number): Totals {
  const gross = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const basisPoints = Math.round(rate * 10_000)
  const tax = Math.floor((gross * basisPoints + 5_000) / 10_000)
  return { gross, tax, net: gross - tax }
}
