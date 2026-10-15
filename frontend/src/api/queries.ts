import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProductInput, Receipt, ReceiptItemInput } from '../types'
import { DEFAULT_TAX_RATE } from '../lib/totals'
import { api } from './client'

const SII_POLL_INTERVAL_MS = 3000

export const queryKeys = {
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  tax: ['tax'] as const,
  receipts: ['receipts'] as const,
  receipt: (id: number) => ['receipts', id] as const,
}

const isEmitting = (receipt: Receipt) => receipt.sii_status === 'requested'

const isValidId = (id: number) => Number.isInteger(id) && id > 0

export function useProducts() {
  return useQuery({ queryKey: queryKeys.products, queryFn: api.listProducts })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
    enabled: isValidId(id),
  })
}

export function useTaxRate() {
  const query = useQuery({ queryKey: queryKeys.tax, queryFn: api.getTax, staleTime: Infinity })
  return {
    rate: query.data?.rate ?? DEFAULT_TAX_RATE,
    isLoading: query.isPending,
    isFallback: query.isError,
  }
}

export function useReceipts() {
  return useQuery({
    queryKey: queryKeys.receipts,
    queryFn: api.listReceipts,
    refetchInterval: (query) => (query.state.data?.some(isEmitting) ? SII_POLL_INTERVAL_MS : false),
  })
}

export function useReceipt(id: number) {
  return useQuery({
    queryKey: queryKeys.receipt(id),
    queryFn: () => api.getReceipt(id),
    enabled: isValidId(id),
    refetchInterval: (query) =>
      query.state.data && isEmitting(query.state.data) ? SII_POLL_INTERVAL_MS : false,
  })
}

export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ProductInput }) =>
      id === undefined ? api.createProduct(input) : api.updateProduct(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.product(product.id), product)
      void queryClient.invalidateQueries({ queryKey: queryKeys.products, exact: true })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteProduct(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.product(id), exact: true })
      void queryClient.invalidateQueries({ queryKey: queryKeys.products, exact: true })
    },
  })
}

export function useCreateReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: ReceiptItemInput[]) => api.createReceipt(items),
    onSuccess: (receipt) => {
      queryClient.setQueryData(queryKeys.receipt(receipt.id), receipt)
      void queryClient.invalidateQueries({ queryKey: queryKeys.receipts, exact: true })
    },
  })
}

export function useEmitReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.emitReceipt(id),
    onSuccess: (receipt) => {
      queryClient.setQueryData(queryKeys.receipt(receipt.id), receipt)
      void queryClient.invalidateQueries({ queryKey: queryKeys.receipts, exact: true })
    },
  })
}
