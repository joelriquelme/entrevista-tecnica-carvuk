import { useState } from 'react'
import { MAX_QUANTITY, MIN_QUANTITY, clampQuantity } from '../cart/cartReducer'

type QuantityStepperProps = {
  value: number
  onChange: (quantity: number) => void
  /** Accessible name of the product, used in the button/input labels. */
  label: string
  /** When set, the minus button at quantity 1 triggers this instead (e.g. remove the line). */
  onRemove?: () => void
}

export function QuantityStepper({ value, onChange, label, onRemove }: QuantityStepperProps) {
  // Local draft so the user can clear the field while typing without the value jumping.
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    setDraft(null)
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isNaN(parsed)) onChange(clampQuantity(parsed))
  }

  const canRemove = onRemove !== undefined && value <= MIN_QUANTITY

  return (
    <div className="stepper">
      <button
        type="button"
        className="btn btn--icon"
        aria-label={canRemove ? `Quitar ${label} del carrito` : `Disminuir cantidad de ${label}`}
        disabled={!canRemove && value <= MIN_QUANTITY}
        onClick={() => (canRemove ? onRemove() : onChange(value - 1))}
      >
        −
      </button>
      <input
        className="stepper__input"
        type="number"
        inputMode="numeric"
        min={MIN_QUANTITY}
        max={MAX_QUANTITY}
        step={1}
        aria-label={`Cantidad de ${label}`}
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value)
        }}
      />
      <button
        type="button"
        className="btn btn--icon"
        aria-label={`Aumentar cantidad de ${label}`}
        disabled={value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
