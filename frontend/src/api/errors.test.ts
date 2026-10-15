import { describe, expect, it } from 'vitest'
import { messageFromResponse } from './errors'

describe('messageFromResponse', () => {
  it('reads DRF detail', () => {
    expect(messageFromResponse(400, { detail: 'Producto no existe.' })).toBe('Producto no existe.')
  })

  it('labels field errors in Spanish', () => {
    expect(messageFromResponse(400, { name: ['Este campo es requerido.'] })).toBe(
      'Nombre: Este campo es requerido.',
    )
  })

  it('flattens nested item errors', () => {
    expect(messageFromResponse(400, { items: [{}, { quantity: ['Debe ser mayor a 0.'] }] })).toBe(
      'Cantidad: Debe ser mayor a 0.',
    )
  })

  it('handles auth errors', () => {
    expect(messageFromResponse(401, null)).toMatch(/sesión/)
  })
})
