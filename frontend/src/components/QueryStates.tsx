import type { ReactNode } from 'react'
import { getErrorMessage } from '../api/errors'

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

type ErrorStateProps = {
  error: unknown
  title?: string
  onRetry?: () => void
}

export function ErrorState({ error, title = 'No pudimos cargar la información', onRetry }: ErrorStateProps) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">{title}</p>
      <p>{getErrorMessage(error)}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  children?: ReactNode
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="state">
      <p className="state__title">{title}</p>
      {children}
    </div>
  )
}
