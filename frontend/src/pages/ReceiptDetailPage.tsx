import { Link, useParams } from 'react-router-dom'
import { getErrorMessage, isNotFound } from '../api/errors'
import { useEmitReceipt, useReceipt, useTaxRate } from '../api/queries'
import { PdfLink } from '../components/PdfLink'
import { EmptyState, ErrorState, LoadingState } from '../components/QueryStates'
import { SiiStatusBadge } from '../components/SiiStatusBadge'
import { TotalsSummary } from '../components/TotalsSummary'
import { formatDateTime } from '../lib/date'
import { formatCLP } from '../lib/money'
import type { Receipt } from '../types'
import { NotFoundPage } from './NotFoundPage'

function SiiSection({ receipt }: { receipt: Receipt }) {
  const emit = useEmitReceipt()
  const canRetry = receipt.sii_status === 'failed' || receipt.sii_status === 'pending'

  return (
    <section className="card" aria-labelledby="sii-title">
      <h2 id="sii-title">Emisión SII</h2>
      <dl className="details">
        <div>
          <dt>Estado</dt>
          <dd>
            <SiiStatusBadge status={receipt.sii_status} />
          </dd>
        </div>
        <div>
          <dt>N° SII</dt>
          <dd>{receipt.sii_code || '—'}</dd>
        </div>
        <div>
          <dt>Documento</dt>
          <dd>
            <PdfLink url={receipt.pdf_url} receiptId={receipt.id} />
          </dd>
        </div>
        <div>
          <dt>Solicitada</dt>
          <dd>{formatDateTime(receipt.sii_requested_at)}</dd>
        </div>
        <div>
          <dt>Emitida</dt>
          <dd>{formatDateTime(receipt.sii_issued_at)}</dd>
        </div>
      </dl>

      {receipt.sii_status === 'failed' && receipt.sii_error && (
        <p className="alert alert--error">Error del SII: {receipt.sii_error}</p>
      )}
      {receipt.sii_status === 'requested' && (
        <p className="muted small" role="status">
          <span className="spinner spinner--small" aria-hidden="true" /> Esperando respuesta del SII. Se
          actualizará sola en cuanto llegue.
        </p>
      )}
      {receipt.sii_status === 'pending' && (
        <p className="note">La boleta aún no se ha enviado al SII.</p>
      )}

      {canRetry && (
        <div className="section-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => emit.mutate(receipt.id)}
            disabled={emit.isPending}
          >
            {emit.isPending
              ? 'Enviando…'
              : receipt.sii_status === 'failed'
                ? 'Reintentar emisión'
                : 'Emitir en SII'}
          </button>
        </div>
      )}
      {emit.isError && (
        <p className="alert alert--error" role="alert">
          No se pudo solicitar la emisión. {getErrorMessage(emit.error)}
        </p>
      )}
    </section>
  )
}

export function ReceiptDetailPage() {
  const { id } = useParams()
  const receiptId = Number(id)
  const receipt = useReceipt(receiptId)
  const tax = useTaxRate()

  if (!Number.isInteger(receiptId) || receiptId <= 0) return <NotFoundPage />

  return (
    <section>
      <Link to="/boletas" className="back-link">
        ← Volver a boletas
      </Link>

      {receipt.isPending ? (
        <LoadingState label="Cargando boleta…" />
      ) : receipt.isError ? (
        isNotFound(receipt.error) ? (
          <EmptyState title="Boleta no encontrada">
            <Link to="/boletas" className="btn btn--primary">
              Ver todas las boletas
            </Link>
          </EmptyState>
        ) : (
          <ErrorState error={receipt.error} onRetry={() => void receipt.refetch()} />
        )
      ) : (
        <div className="stack">
          <div className="page-header">
            <h1>Boleta N° {receipt.data.id}</h1>
            <SiiStatusBadge status={receipt.data.sii_status} />
          </div>
          <p className="muted">Generada el {formatDateTime(receipt.data.created_at)}</p>

          <section className="card" aria-labelledby="items-title">
            <h2 id="items-title">Detalle</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col" className="num">Precio unitario</th>
                    <th scope="col" className="num">Cantidad</th>
                    <th scope="col" className="num">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td className="num">{formatCLP(item.unit_price)}</td>
                      <td className="num">{item.quantity}</td>
                      <td className="num">{formatCLP(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TotalsSummary
              net={receipt.data.net_total}
              tax={receipt.data.tax}
              gross={receipt.data.gross_total}
              rate={tax.isLoading || tax.isFallback ? undefined : tax.rate}
            />
          </section>

          <SiiSection receipt={receipt.data} />
        </div>
      )}
    </section>
  )
}
