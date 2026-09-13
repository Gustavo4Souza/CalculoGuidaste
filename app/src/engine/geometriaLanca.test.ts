import { describe, expect, it } from 'vitest'
import { calcularAlturaDoGancho, calcularRaioReal } from './geometriaLanca'

describe('calcularRaioReal (RF11 / Task 2.2)', () => {
  it('lança na horizontal (0°): raio = comprimento - recuo', () => {
    const raio = calcularRaioReal({ alturaPeDaLancaM: 3.0, recuoPeDaLancaM: 1.4 }, 17.7, 0)
    expect(raio).toBeCloseTo(17.7 - 1.4, 9)
  })

  it('lança na vertical (90°): raio = -recuo (alcance horizontal da lança é zero)', () => {
    const raio = calcularRaioReal({ alturaPeDaLancaM: 3.0, recuoPeDaLancaM: 1.4 }, 17.7, 90)
    expect(raio).toBeCloseTo(-1.4, 9)
  })

  it('recuo zero (TM-130): raio = comprimento × cos(ângulo)', () => {
    const raio = calcularRaioReal({ alturaPeDaLancaM: 2.8, recuoPeDaLancaM: 0 }, 10, 60)
    expect(raio).toBeCloseTo(10 * Math.cos((60 * Math.PI) / 180), 9)
  })

  it('ângulo intermediário (MD-300L, 14,10m a 45°) fica entre os dois casos anteriores', () => {
    const raio = calcularRaioReal({ alturaPeDaLancaM: 3.0, recuoPeDaLancaM: 1.4 }, 14.1, 45)
    expect(raio).toBeCloseTo(14.1 * Math.cos((45 * Math.PI) / 180) - 1.4, 9)
  })
})

describe('calcularAlturaDoGancho', () => {
  it('lança na horizontal (0°): altura do gancho = altura do pé da lança', () => {
    const altura = calcularAlturaDoGancho({ alturaPeDaLancaM: 3.0, recuoPeDaLancaM: 1.4 }, 17.7, 0)
    expect(altura).toBeCloseTo(3.0, 9)
  })

  it('lança na vertical (90°): altura do gancho = altura do pé da lança + comprimento', () => {
    const altura = calcularAlturaDoGancho({ alturaPeDaLancaM: 3.0, recuoPeDaLancaM: 1.4 }, 17.7, 90)
    expect(altura).toBeCloseTo(3.0 + 17.7, 9)
  })
})
