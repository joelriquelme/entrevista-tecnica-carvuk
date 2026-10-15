import { formatCLP, formatPercent } from '../lib/money'

type TotalsSummaryProps = {
  net: number
  tax: number
  gross: number
  /** Tax rate (e.g. 0.15). Omitted when unknown, e.g. on a stored receipt. */
  rate?: number
}

export function TotalsSummary({ net, tax, gross, rate }: TotalsSummaryProps) {
  return (
    <dl className="totals">
      <div className="totals__row">
        <dt>Valor neto</dt>
        <dd>{formatCLP(net)}</dd>
      </div>
      <div className="totals__row">
        <dt>Impuesto{rate !== undefined ? ` (${formatPercent(rate)})` : ''}</dt>
        <dd>{formatCLP(tax)}</dd>
      </div>
      <div className="totals__row totals__row--total">
        <dt>Valor bruto (total a pagar)</dt>
        <dd>{formatCLP(gross)}</dd>
      </div>
    </dl>
  )
}
