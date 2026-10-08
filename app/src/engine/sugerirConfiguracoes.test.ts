import { describe, expect, it } from 'vitest'
import { CATALOGO } from '../data/catalogo'
import { parametrosIniciais } from '../store/parametrosIniciais'
import type { ParametrosDoCenario, StatusDoCenario } from '../types/cenario'
import { avaliarCenario } from './avaliarCenario'
import { sugerirConfiguracoes, type CandidatoDaFrota } from './sugerirConfiguracoes'

const MD = CATALOGO['MD-300L']
const TM = CATALOGO['TM-130']

/** Pedido de 9.000 kg com o cabo informado à mão (0 kg), para o somatório ser só a carga. */
function frota(alterar?: (p: ParametrosDoCenario) => void): CandidatoDaFrota[] {
  return [MD, TM].map((ctx) => {
    const base = parametrosIniciais(ctx)
    base.carga.pesoKg = 9000
    base.cabo.massaSobrescritaKg = 0
    if (ctx === TM) {
      base.cabo.numeroDePernas = 4 // informado pelo engenheiro (a ficha não traz)
      base.moitao.massaKg = 150 // informado pelo engenheiro (a ficha não traz)
    }
    alterar?.(base)
    return { ctx, base }
  })
}

const ORDEM: Record<StatusDoCenario, number> = { ok: 0, atencao: 1, sem_dado: 2, nok: 3 }

describe('sugerirConfiguracoes', () => {
  it('RF15 — menor guindaste primeiro: o TM-130 (26 t) vem antes do MD-300L (30 t)', () => {
    const { sugestoes } = sugerirConfiguracoes(frota(), 7)
    const ordemGuindastes = [...new Set(sugestoes.map((s) => s.guindasteId))]
    expect(ordemGuindastes).toEqual(['TM-130', 'MD-300L'])
  })

  it('cada sugestão é exatamente o que avaliarCenario responde, no raio pedido (valores reais da tabela)', () => {
    const { sugestoes } = sugerirConfiguracoes(frota(), 7)
    for (const s of sugestoes) {
      expect(s.avaliacao).toEqual(avaliarCenario(s.parametros, CATALOGO[s.guindasteId]))
      expect(s.avaliacao.geometria.raioM).toBeCloseTo(7, 6)
    }
    const cap = (id: string, comprimento: number, regiao: string) =>
      sugestoes.find((s) => s.guindasteId === id && Math.abs(s.comprimentoLancaM - comprimento) < 1e-9 && s.regiao === regiao)
        ?.avaliacao.capacidade.capacidadeKg
    // MD-300L, 7 m: 17,70 m frontal = 10.800 kg; 10,50 m frontal = 10.500 kg (tabela real, ponto exato).
    expect(cap('MD-300L', 17.7, 'frontal')).toBe(10800)
    expect(cap('MD-300L', 10.5, 'frontal')).toBe(10500)
    // TM-130, 7 m: Zona I = 18.500 kg; Zona II = 11.200 kg (diagrama polar).
    expect(cap('TM-130', 12.4, 'I')).toBe(18500)
    expect(cap('TM-130', 12.4, 'II')).toBe(11200)
  })

  it('a área de cada sugestão é a que o giro escolhido deriva (frontal 0°, lateral/traseira no meio do setor)', () => {
    const { sugestoes } = sugerirConfiguracoes(frota(), 7)
    for (const s of sugestoes) expect(s.avaliacao.giro.regioes).toEqual([s.regiao])
  })

  it('dentro de cada guindaste: aprovadas primeiro, reprovadas por último', () => {
    const { sugestoes } = sugerirConfiguracoes(frota((p) => void (p.carga.pesoKg = 12000)), 7)
    for (const id of ['TM-130', 'MD-300L']) {
      const ordens = sugestoes.filter((s) => s.guindasteId === id).map((s) => ORDEM[s.avaliacao.status])
      expect(ordens).toEqual([...ordens].sort((a, b) => a - b))
    }
    // 12.000 kg contra 10.800 kg (17,70 m frontal a 7 m) reprova.
    const md1770 = sugestoes.find((s) => s.guindasteId === 'MD-300L' && s.comprimentoLancaM === 17.7 && s.regiao === 'frontal')
    expect(md1770?.avaliacao.status).toBe('nok')
  })

  it('MD-300L: a passagem de cabo acompanha a tabela de cada comprimento (8 / 6 / 4 pernas)', () => {
    const { sugestoes } = sugerirConfiguracoes(frota(), 7)
    const pernas = (c: number) => sugestoes.find((s) => s.guindasteId === 'MD-300L' && s.comprimentoLancaM === c)?.parametros.cabo.numeroDePernas
    expect(pernas(10.5)).toBe(8)
    expect(pernas(17.7)).toBe(6)
    expect(pernas(28.5)).toBe(4)
  })

  it('raio de 30 m: só a lança de 32,10 m do MD-300L alcança; o resto fica "fora de alcance"', () => {
    const { sugestoes, foraDeAlcance } = sugerirConfiguracoes(frota(), 30)
    expect(new Set(sugestoes.map((s) => `${s.guindasteId} ${s.comprimentoLancaM}`))).toEqual(new Set(['MD-300L 32.1']))
    expect(foraDeAlcance).toContainEqual({ guindasteId: 'TM-130', comprimentoLancaM: 12.4 })
    expect(foraDeAlcance).toContainEqual({ guindasteId: 'MD-300L', comprimentoLancaM: 28.5 })
  })

  it('regra de ouro: sem o nº de pernas do TM-130, a sugestão fica "não validada" com o motivo', () => {
    const { sugestoes } = sugerirConfiguracoes(frota((p) => void (p.cabo.numeroDePernas = p.guindasteId === 'TM-130' ? null : p.cabo.numeroDePernas)), 7)
    const tm = sugestoes.filter((s) => s.guindasteId === 'TM-130')
    expect(tm.length).toBeGreaterThan(0)
    for (const s of tm) {
      expect(s.avaliacao.status).toBe('sem_dado')
      expect(s.avaliacao.motivosSemDado.join(' ')).toContain('Nº de pernas do cabo não informado')
    }
  })
})
