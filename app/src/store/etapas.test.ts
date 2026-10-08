import { describe, expect, it } from 'vitest'
import { CATALOGO } from '../data/catalogo'
import { situacaoDasEtapas, type EstadoDoFluxo } from './etapas'
import { parametrosIniciais } from './parametrosIniciais'

const vazio: EstadoDoFluxo = {
  livre: false,
  temOrcamentoAtivo: false,
  raioNecessarioM: null,
  configuracaoEscolhida: false,
  cenarioSalvo: false,
}
const cenario = (peso = 0) => {
  const p = parametrosIniciais(CATALOGO['MD-300L'])
  p.carga.pesoKg = peso
  return p
}

describe('situacaoDasEtapas', () => {
  it('no começo só Início e Projeto estão liberados; cada etapa bloqueada diz o que falta', () => {
    const s = situacaoDasEtapas(vazio, cenario())
    expect(s.inicio.liberada && s.projeto.liberada).toBe(true)
    expect(s.carga).toEqual({ liberada: false, motivo: 'Defina o projeto e o orçamento na etapa 1.' })
    expect(s.guindaste.liberada).toBe(false)
    expect(s.simulacao.motivo).toContain('Escolha uma configuração')
    expect(s.relatorio.motivo).toContain('Salve o cenário')
  })

  it('com o orçamento definido, a carga libera; o guindaste só com peso E raio necessário', () => {
    const f = { ...vazio, temOrcamentoAtivo: true }
    expect(situacaoDasEtapas(f, cenario()).carga.liberada).toBe(true)
    expect(situacaoDasEtapas(f, cenario(9000)).guindaste.liberada).toBe(false)
    expect(situacaoDasEtapas({ ...f, raioNecessarioM: 7 }, cenario()).guindaste.liberada).toBe(false)
    expect(situacaoDasEtapas({ ...f, raioNecessarioM: 7 }, cenario(9000)).guindaste.liberada).toBe(true)
  })

  it('simulação e verificação liberam com a configuração escolhida; o relatório só com o cenário salvo', () => {
    const f = { ...vazio, temOrcamentoAtivo: true, raioNecessarioM: 7, configuracaoEscolhida: true }
    const s = situacaoDasEtapas(f, cenario(9000))
    expect(s.simulacao.liberada && s.verificacao.liberada).toBe(true)
    expect(s.relatorio.liberada).toBe(false)
    expect(situacaoDasEtapas({ ...f, cenarioSalvo: true }, cenario(9000)).relatorio.liberada).toBe(true)
  })

  it('simulação livre: sem projeto, já entra na simulação (o projeto é criado ao salvar)', () => {
    const s = situacaoDasEtapas({ ...vazio, livre: true }, cenario())
    expect(s.carga.liberada && s.simulacao.liberada && s.verificacao.liberada).toBe(true)
    expect(s.relatorio.liberada).toBe(false)
  })
})
