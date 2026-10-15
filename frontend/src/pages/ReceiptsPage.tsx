import { Link } from 'react-router-dom'
import { useReceipts } from '../api/queries'
import { EmptyState, ErrorState, LoadingState } from '../components/QueryStates'
import { PdfLink } from '../components/PdfLink'
import { SiiStatusBadge } from '../components/SiiStatusBadge'
import { formatDateTime } from '../lib/date'
import { formatCLP } from '../lib/money'
import type { Receipt } from '../types'

const describeItems = (receipt: Receipt) =>
  receipt.items.map((item) => `${item.product_name} ×${item.quantity}`).join(', ')

export function ReceiptsPage() {
  const receipts = useReceipts()
  const isPolling = receipts.data?.some((receipt) => receipt.sii_status === 'requested') ?? false

  return (
    <section>
      <div className="page-header">
        <h1>Boletas</h1>
        {isPolling && (
          <span className="muted small" role="status">
            <span className="spinner spinner--small" aria-hidden="true" /> Actualizando estado SII…
          </span>
        )}
      </div>

      {receipts.isPending ? (
        <LoadingState label="Cargando boletas…" />
      ) : receipts.isError ? (
        <ErrorState error={receipts.error} onRetry={() => void receipts.refetch()} />
      ) : receipts.data.length === 0 ? (
        <EmptyState title="Aún no hay boletas">
          <p className="muted">Agrega productos al carrito y genera tu primera boleta.</p>
          <Link to="/" className="btn btn--primary">
            Ir al catálogo
          </Link>
        </EmptyState>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <caption className="visually-hidden">Historial de boletas</caption>
            <thead>
              <tr>
                <th scope="col">N°</th>
                <th scope="col">Fecha</th>
                <th scope="col">Productos</th>
                <th scope="col" className="num">Neto</th>
                <th scope="col" className="num">Impuesto</th>
                <th scope="col" className="num">Total</th>
                <th scope="col">Estado SII</th>
                <th scope="col">N° SII</th>
                <th scope="col">PDF</th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {receipts.data.map((receipt) => (
                <tr key={receipt.id}>
                  <td>{receipt.id}</td>
                  <td className="nowrap">{formatDateTime(receipt.created_at)}</td>
                  <td className="items-cell">{describeItems(receipt)}</td>
                  <td className="num">{formatCLP(receipt.net_total)}</td>
                  <td className="num">{formatCLP(receipt.tax)}</td>
                  <td className="num strong">{formatCLP(receipt.gross_total)}</td>
                  <td>
                    <SiiStatusBadge status={receipt.sii_status} />
                  </td>
                  <td className="nowrap">{receipt.sii_code || '—'}</td>
                  <td>
                    <PdfLink url={receipt.pdf_url} receiptId={receipt.id} />
                  </td>
                  <td>
                    <Link to={`/boletas/${receipt.id}`} className="nowrap">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
