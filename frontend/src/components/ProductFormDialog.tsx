import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { useSaveProduct } from '../api/queries'
import type { Product } from '../types'

const NAME_MAX_LENGTH = 200
const PRICE_MAX = 999_999_999

type FormErrors = Partial<Record<'name' | 'price', string>>

type ProductFormDialogProps = {
  /** Product to edit; omit to create a new one. */
  product?: Product
  onClose: () => void
  onSaved?: (product: Product) => void
}

function validate(name: string, price: string): FormErrors {
  const errors: FormErrors = {}
  if (!name.trim()) errors.name = 'El nombre es obligatorio.'
  else if (name.trim().length > NAME_MAX_LENGTH) {
    errors.name = `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`
  }

  const trimmedPrice = price.trim()
  if (!trimmedPrice) errors.price = 'El precio es obligatorio.'
  else if (!/^\d+$/.test(trimmedPrice)) {
    errors.price = 'El precio debe ser un número entero, sin puntos ni decimales.'
  } else if (Number(trimmedPrice) <= 0) errors.price = 'El precio debe ser mayor a 0.'
  else if (Number(trimmedPrice) > PRICE_MAX) errors.price = 'El precio es demasiado alto.'
  return errors
}

export function ProductFormDialog({ product, onClose, onSaved }: ProductFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formId = useId()
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [errors, setErrors] = useState<FormErrors>({})
  const saveProduct = useSaveProduct()

  useEffect(() => {
    const dialog = dialogRef.current
    // Native modal: focus trap, Esc to close and backdrop for free. Unmounting removes it.
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const isEditing = product !== undefined
  const title = isEditing ? 'Editar producto' : 'Nuevo producto'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(name, price)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    saveProduct.mutate(
      {
        id: product?.id,
        input: { name: name.trim(), description: description.trim(), price: Number(price.trim()) },
      },
      {
        onSuccess: (saved) => {
          onSaved?.(saved)
          onClose()
        },
      },
    )
  }

  const nameErrorId = `${formId}-name-error`
  const priceErrorId = `${formId}-price-error`

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={`${formId}-title`}
      onClose={onClose}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h2 id={`${formId}-title`} className="dialog__title">
          {title}
        </h2>

        <div className="field">
          <label htmlFor={`${formId}-name`}>Nombre *</label>
          <input
            id={`${formId}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? nameErrorId : undefined}
          />
          {errors.name && (
            <p id={nameErrorId} className="field__error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={`${formId}-description`}>Descripción</label>
          <textarea
            id={`${formId}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </div>

        <div className="field">
          <label htmlFor={`${formId}-price`}>Precio (CLP) *</label>
          <input
            id={`${formId}-price`}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="numeric"
            placeholder="Ej: 1100"
            autoComplete="off"
            aria-invalid={errors.price ? true : undefined}
            aria-describedby={errors.price ? priceErrorId : undefined}
          />
          {errors.price && (
            <p id={priceErrorId} className="field__error">
              {errors.price}
            </p>
          )}
        </div>

        {saveProduct.isError && (
          <p className="alert alert--error" role="alert">
            {getErrorMessage(saveProduct.error)}
          </p>
        )}

        <div className="dialog__actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saveProduct.isPending}>
            {saveProduct.isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
