const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatCLP(amount: number): string {
  return clpFormatter.format(amount)
}

const percentFormatter = new Intl.NumberFormat('es-CL', {
  style: 'percent',
  maximumFractionDigits: 2,
})

export function formatPercent(rate: number): string {
  return percentFormatter.format(rate)
}
