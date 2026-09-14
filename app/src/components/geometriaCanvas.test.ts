import { describe, expect, it } from 'vitest'
import {
  ANGULO_MAX_GRAUS,
  ANGULO_MIN_GRAUS,
  anguloDoPonto,
  aplicarSnapComprimento,
  pontaDaLanca,
  projetarComprimento,
} from './geometriaCanvas'

const COMPRIMENTOS_MD300L = [10.5, 14.1, 17.7, 21.3, 24.9, 28.5, 32.1]

describe('geometriaCanvas (posição 3D pura da lança)', () => {
  it('pontaDaLanca(10, 0) fica na horizontal, a 10m de alcance e altura 0', () => {
    const p = pontaDaLanca(10, 0)
    expect(p.x).toBeCloseTo(10, 5)
    expect(p.y).toBeCloseTo(0, 5)
  })

  it('pontaDaLanca(10, 90) fica na vertical, alcance 0 e altura 10', () => {
    const p = pontaDaLanca(10, 90)
    expect(p.x).toBeCloseTo(0, 5)
    expect(p.y).toBeCloseTo(10, 5)
  })

  it('pontaDaLanca(14.1, 60) bate com a trigonometria manual', () => {
    const anguloRad = (60 * Math.PI) / 180
    const p = pontaDaLanca(14.1, 60)
    expect(p.x).toBeCloseTo(14.1 * Math.cos(anguloRad), 5)
    expect(p.y).toBeCloseTo(14.1 * Math.sin(anguloRad), 5)
  })

  it('anguloDoPonto é a operação inversa de pontaDaLanca dentro do range de arrasto', () => {
    for (const anguloOriginal of [10, 30, 45, 60, 80]) {
      const ponta = pontaDaLanca(20, anguloOriginal)
      const anguloRecuperado = anguloDoPonto(ponta.x, ponta.y)
      expect(anguloRecuperado).toBeCloseTo(anguloOriginal, 3)
    }
  })

  it('anguloDoPonto satura no mínimo e no máximo do range de arrasto', () => {
    expect(anguloDoPonto(100, 0.001)).toBeCloseTo(ANGULO_MIN_GRAUS, 3)
    expect(anguloDoPonto(0.001, 100)).toBeCloseTo(ANGULO_MAX_GRAUS, 3)
  })
})

describe('projetarComprimento (Task 8.2 — arrasto do comprimento da lança)', () => {
  it('projeta exatamente o comprimento quando o ponto arrastado está sobre a própria direção da lança', () => {
    const angulo = 37
    const alvo = pontaDaLanca(25, angulo) // ponto exatamente a 25m na direção do ângulo
    const resultado = projetarComprimento(alvo.x, alvo.y, angulo, 10.5, 32.1)
    expect(resultado).toBeCloseTo(25, 6)
  })

  it('ignora o desvio perpendicular à lança — só a projeção na direção do ângulo importa', () => {
    const angulo = 0 // lança na horizontal: direção = eixo X
    // ponto (20, 5): 20m na direção da lança + 5m fora do plano da lança
    const resultado = projetarComprimento(20, 5, angulo, 10.5, 32.1)
    expect(resultado).toBeCloseTo(20, 6)
  })

  it('nunca extrapola abaixo do mínimo real da tabela (10,50 m)', () => {
    const resultado = projetarComprimento(2, 0, 0, 10.5, 32.1)
    expect(resultado).toBe(10.5)
  })

  it('nunca extrapola acima do máximo real da tabela (32,10 m)', () => {
    const resultado = projetarComprimento(50, 0, 0, 10.5, 32.1)
    expect(resultado).toBe(32.1)
  })

  it('mantém a direção da lança mesmo em ângulos altos (perto da vertical)', () => {
    const angulo = 80
    const alvo = pontaDaLanca(18, angulo)
    const resultado = projetarComprimento(alvo.x, alvo.y, angulo, 10.5, 32.1)
    expect(resultado).toBeCloseTo(18, 6)
  })
})

describe('aplicarSnapComprimento (Task 9.2 — marcas de encaixe nos 7 comprimentos reais)', () => {
  it('gruda no comprimento real mais próximo quando dentro da tolerância', () => {
    expect(aplicarSnapComprimento(17.85, COMPRIMENTOS_MD300L)).toBe(17.7)
    expect(aplicarSnapComprimento(17.55, COMPRIMENTOS_MD300L)).toBe(17.7)
  })

  it('mantém o valor livre/contínuo quando longe de qualquer marca (decisão do Épico 8 preservada)', () => {
    expect(aplicarSnapComprimento(19.5, COMPRIMENTOS_MD300L)).toBe(19.5)
    expect(aplicarSnapComprimento(23.4, COMPRIMENTOS_MD300L)).toBe(23.4)
  })

  it('gruda exatamente nos extremos (menor e maior comprimento real)', () => {
    expect(aplicarSnapComprimento(10.6, COMPRIMENTOS_MD300L)).toBe(10.5)
    expect(aplicarSnapComprimento(32.0, COMPRIMENTOS_MD300L)).toBe(32.1)
  })

  it('respeita uma tolerância customizada', () => {
    expect(aplicarSnapComprimento(18.0, COMPRIMENTOS_MD300L, 0.5)).toBe(17.7)
    expect(aplicarSnapComprimento(18.0, COMPRIMENTOS_MD300L, 0.2)).toBe(18.0)
  })

  it('não gruda em nada quando a lista de comprimentos reais está vazia', () => {
    expect(aplicarSnapComprimento(20, [])).toBe(20)
  })
})
