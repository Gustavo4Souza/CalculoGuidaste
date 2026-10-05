import { describe, expect, it } from 'vitest'
import { CATALOGO } from '../../data/catalogo'
import {
  direcaoDoGiro,
  extremosDoCaminhao,
  giroDoPonto,
  ladoZDaSapata,
  posicaoDaSapata,
  rotacaoDoGiro,
  xNoMundo,
} from './geometriaCena'

const MD = CATALOGO['MD-300L'].especificacao
const TM = CATALOGO['TM-130'].especificacao

describe('geometriaCena — caminhão a partir das fichas (Épico 13)', () => {
  it('MD-300L: giro 0° = frente, então a cabine fica em +X; eixos da ficha p.4 (5,94 / 1,36 / 0 m do centro de giro)', () => {
    expect(MD.caminhao.eixosM.map((e) => xNoMundo(MD, e.valor))).toEqual([5.94, 1.36, 0])
    expect(extremosDoCaminhao(MD)).toEqual({ xMin: -2.455, xMax: 9.989 })
    // 12.444 mm de comprimento de transporte (ficha p.4)
    expect(extremosDoCaminhao(MD).xMax - extremosDoCaminhao(MD).xMin).toBeCloseTo(12.444, 9)
  })

  it('TM-130: giro 0° = traseira, então a cabine fica em -X', () => {
    expect(xNoMundo(TM, TM.caminhao.dianteiraM.valor)).toBe(-8)
    expect(extremosDoCaminhao(TM).xMin).toBe(-8)
  })

  it('sapata traseira do MD-300L a 2,075 m atrás do centro de giro, extensão máxima 3,25 m (6,5 m entre sapatas)', () => {
    expect(posicaoDaSapata(MD, 'traseira_direita', 3.25)).toEqual([-2.075, 0, 3.25])
    expect(posicaoDaSapata(MD, 'traseira_esquerda', 3.25)).toEqual([-2.075, 0, -3.25])
  })

  it('TM-130: a sapata dianteira fica a 4,7153 m do centro de giro (cota da ficha p.2)', () => {
    const [x, , z] = posicaoDaSapata(TM, 'dianteira_esquerda', 2.85)
    expect(Math.hypot(x, z)).toBeCloseTo(4.7153, 3)
  })

  it('direita/esquerda seguem a frente do caminhão (frente em -X inverte o lado Z)', () => {
    expect(ladoZDaSapata(MD, 'dianteira_direita')).toBe(1)
    expect(ladoZDaSapata(TM, 'dianteira_direita')).toBe(-1)
  })

  it('giro horário visto de cima: 90° aponta para +Z, e o giro do ponto é a inversa', () => {
    const [x, , z] = direcaoDoGiro(90)
    expect(x).toBeCloseTo(0, 9)
    expect(z).toBeCloseTo(1, 9)
    expect(giroDoPonto(0, 5)).toBeCloseTo(90, 9)
    expect(giroDoPonto(-3, 0)).toBeCloseTo(180, 9)
    // a rotação Y do grupo leva o +X local para a direção do giro
    const r = rotacaoDoGiro(90)
    expect(Math.cos(r)).toBeCloseTo(0, 9)
    expect(-Math.sin(r)).toBeCloseTo(1, 9)
  })
})
