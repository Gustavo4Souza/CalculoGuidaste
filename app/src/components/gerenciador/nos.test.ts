import { describe, expect, it } from 'vitest'
import { CATALOGO } from '../../data/catalogo'
import { avaliarCenario } from '../../engine/avaliarCenario'
import { parametrosIniciais } from '../../store/parametrosIniciais'
import type { ParametrosDoCenario } from '../../types/cenario'
import { estadoDosNos, noDoMotivo, nosDaArvore } from './nos'

const MD = CATALOGO['MD-300L']
const TM = CATALOGO['TM-130']

/** MD-300L 17,70 m, raio 8 m, frontal (7.500 kg na tabela), com o cabo informado à mão. */
function md(alterar?: (p: ParametrosDoCenario) => void): ParametrosDoCenario {
  const p = parametrosIniciais(MD)
  p.cabo.massaSobrescritaKg = 0
  alterar?.(p)
  return p
}

describe('estadoDosNos', () => {
  it('cenário completo dentro da tabela: todos os nós ✔', () => {
    const p = md((c) => void (c.carga.pesoKg = 6000))
    const estados = estadoDosNos(p, avaliarCenario(p, MD))
    expect(Object.values(estados).every((e) => e === 'ok')).toBe(true)
  })

  it('massa linear do cabo não informada (cenário inicial) → "falta" no nó do cabo e na raiz', () => {
    const p = parametrosIniciais(MD)
    const estados = estadoDosNos(p, avaliarCenario(p, MD))
    expect(estados.cabo).toBe('falta')
    expect(estados.guindaste).toBe('falta')
    expect(estados.lanca).toBe('ok')
  })

  it('sapata em extensão parcial → "falta" nas sapatas', () => {
    const p = md((c) => void (c.sapatas.dianteira_esquerda = 2))
    expect(estadoDosNos(p, avaliarCenario(p, MD)).sapatas).toBe('falta')
  })

  it('9.000 kg contra 7.500 kg da tabela → carga reprovada (pior que "falta")', () => {
    const p = md((c) => void (c.carga.pesoKg = 9000))
    const estados = estadoDosNos(p, avaliarCenario(p, MD))
    expect(estados.carga).toBe('reprovado')
    expect(estados.guindaste).toBe('reprovado')
  })

  it('acima do limite do engenheiro → "atenção" nos limites', () => {
    const p = md((c) => {
      c.carga.pesoKg = 6000 // 80% de 7.500 kg
      c.limiteUtilizacaoPercentual = 70
    })
    expect(estadoDosNos(p, avaliarCenario(p, MD)).limites).toBe('atencao')
  })

  it('TM-130 inicial: nº de pernas e massas não informados → "falta" no cabo', () => {
    const p = parametrosIniciais(TM)
    expect(estadoDosNos(p, avaliarCenario(p, TM)).cabo).toBe('falta')
  })
})

describe('noDoMotivo', () => {
  it('cada motivo do motor aponta para o nó onde ele se corrige', () => {
    const p = md((c) => {
      c.sapatas.traseira_direita = 2
      c.giroGraus = 0
    })
    const motivos = avaliarCenario(p, MD).motivosSemDado
    expect(motivos.map((m) => noDoMotivo(m, false))).toEqual(['sapatas'])
  })

  it('raio sem célula na tabela é da lança (ou do JIB, com ele ligado)', () => {
    expect(noDoMotivo('Raio 13,00 m sem célula na coluna 14,10 m.', false)).toBe('lanca')
    expect(noDoMotivo('Raio 40,00 m sem célula na tabela de JIB.', true)).toBe('jib')
    expect(noDoMotivo('Massa linear do cabo de içamento não informada.', false)).toBe('cabo')
  })
})

describe('nosDaArvore', () => {
  it('o nó do JIB só aparece com o JIB ligado', () => {
    expect(nosDaArvore(md())).not.toContain('jib')
    expect(nosDaArvore(md((c) => void (c.jib.ativo = true)))).toContain('jib')
  })
})
