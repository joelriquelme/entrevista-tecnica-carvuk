const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  description: 'Descripción',
  price: 'Precio',
  items: 'Productos',
  product_id: 'Producto',
  quantity: 'Cantidad',
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/** Flattens a DRF error body ({"field": ["msg"]}, {"detail": "msg"}, nested lists…) into readable lines. */
function collectMessages(value: unknown, label?: string): string[] {
  if (value == null) return []
  if (typeof value === 'string' || typeof value === 'number') {
    return [label ? `${label}: ${value}` : String(value)]
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectMessages(entry, label))
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => {
      const isGeneric = key === 'detail' || key === 'non_field_errors'
      const fieldLabel = isGeneric ? label : (FIELD_LABELS[key] ?? key)
      return collectMessages(entry, fieldLabel)
    })
  }
  return []
}

export function messageFromResponse(status: number, body: unknown): string {
  if (status === 401) return 'Tu sesión no es válida o expiró. Vuelve a iniciar sesión.'
  if (status === 403) return 'No tienes permisos para realizar esta acción.'
  if (status >= 500) return `El servidor tuvo un problema (${status}). Inténtalo nuevamente en unos momentos.`

  const messages = collectMessages(body)
  if (messages.length > 0) return [...new Set(messages)].join(' ')
  if (status === 404) return 'No encontramos lo que buscas.'
  return `La solicitud no se pudo completar (${status}).`
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.'
  }
  return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
