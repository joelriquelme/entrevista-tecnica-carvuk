import type { SiiStatus } from '../types'

const STATUS_LABELS: Record<SiiStatus, string> = {
  pending: 'Pendiente',
  requested: 'Emitiendo…',
  issued: 'Emitida',
  failed: 'Error',
}

export function SiiStatusBadge({ status }: { status: SiiStatus }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABELS[status]}</span>
}
