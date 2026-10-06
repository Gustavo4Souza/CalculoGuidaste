import { describe, expect, it } from 'vitest'
import { arredondarParaBaixo, TOLERANCIA_RUIDO_KG } from './interpolacao'

describe('arredondarParaBaixo (RT-MC05) — com tolerância de ruído numérico (06/10/2026)', () => {
  it('continua arredondando para baixo qualquer fração real', () => {
    expect(arredondarParaBaixo(18349.4)).toBe(18349)
    expect(arredondarParaBaixo(18349.999)).toBe(18349)
    expect(arredondarParaBaixo(9975)).toBe(9975)
  })

  it('não "perde" 1 kg por ruído de ponto flutuante (raio 4,500000000001 m → 18.349,9999999 kg)', () => {
    expect(arredondarParaBaixo(18349.9999999)).toBe(18350)
    expect(arredondarParaBaixo(18350 - TOLERANCIA_RUIDO_KG / 2)).toBe(18350)
  })
})
