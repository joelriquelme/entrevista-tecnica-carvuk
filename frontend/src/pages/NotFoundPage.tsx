import { Link } from 'react-router-dom'
import { EmptyState } from '../components/QueryStates'

export function NotFoundPage() {
  return (
    <section>
      <EmptyState title="Página no encontrada">
        <p className="muted">La dirección que buscas no existe.</p>
        <Link to="/" className="btn btn--primary">
          Ir al catálogo
        </Link>
      </EmptyState>
    </section>
  )
}
