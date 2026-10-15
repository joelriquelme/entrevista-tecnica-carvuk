export type Product = {
  id: number
  name: string
  description: string
  price: number
  created_at: string
  updated_at: string
}

export type ProductInput = {
  name: string
  description: string
  price: number
}

export type SiiStatus = 'pending' | 'requested' | 'issued' | 'failed'

export type ReceiptItem = {
  id: number
  product: number | null
  product_name: string
  unit_price: number
  quantity: number
  subtotal: number
}

export type Receipt = {
  id: number
  gross_total: number
  tax: number
  net_total: number
  created_by: string
  created_at: string
  sii_status: SiiStatus
  sii_code: string
  pdf_url: string
  sii_error: string
  sii_requested_at: string | null
  sii_issued_at: string | null
  items: ReceiptItem[]
}

export type ReceiptItemInput = {
  product_id: number
  quantity: number
}

export type TaxInfo = {
  rate: number
}
