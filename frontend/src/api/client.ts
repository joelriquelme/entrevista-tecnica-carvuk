import type { Product, ProductInput, Receipt, ReceiptItemInput, TaxInfo } from '../types'
import { ApiError, messageFromResponse } from './errors'

const API_URL: string = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

type TokenGetter = () => Promise<string | null>

let tokenGetter: TokenGetter | null = null

/** Registered from inside ClerkProvider so every request carries the session token. */
export function setTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')

  const token = tokenGetter ? await tokenGetter() : null
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  const body = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(response.status, messageFromResponse(response.status, body), body)
  }
  return body as T
}

export const api = {
  listProducts: () => request<Product[]>('/products/'),
  getProduct: (id: number) => request<Product>(`/products/${id}/`),
  createProduct: (input: ProductInput) =>
    request<Product>('/products/', { method: 'POST', body: JSON.stringify(input) }),
  updateProduct: (id: number, input: Partial<ProductInput>) =>
    request<Product>(`/products/${id}/`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteProduct: (id: number) => request<null>(`/products/${id}/`, { method: 'DELETE' }),

  getTax: () => request<TaxInfo>('/tax/'),

  listReceipts: () => request<Receipt[]>('/receipts/'),
  getReceipt: (id: number) => request<Receipt>(`/receipts/${id}/`),
  createReceipt: (items: ReceiptItemInput[]) =>
    request<Receipt>('/receipts/', { method: 'POST', body: JSON.stringify({ items }) }),
  emitReceipt: (id: number) => request<Receipt>(`/receipts/${id}/emit/`, { method: 'POST' }),
}
