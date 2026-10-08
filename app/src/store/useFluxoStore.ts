/**
 * Fluxo de trabalho (Épico 18): Início → ① Projeto → ② Carga → ③ Guindaste
 * → ④ Simulação → ⑤ Verificação → ⑥ Relatório. Etapas navegáveis: dá para
 * voltar e pular para qualquer etapa liberada (regra em `etapas.ts`).
 *
 * Não guarda dados do cenário: a carga e a configuração vivem na store da
 * simulação (estado único, Épico 11) e os projetos na de projetos (Épico 15).
 * Aqui ficam só o que é do fluxo — a etapa, o orçamento em que se está
 * trabalhando e o raio necessário do pedido (que não faz parte do cenário).
 */
import { create } from 'zustand'
import { CATALOGO } from '../data/catalogo'
import type { ContextoDoGuindaste } from '../engine/avaliarCenario'
import type { ParametrosDoCenario } from '../types/cenario'
import type { Orcamento, Projeto } from '../types/projeto'
import { situacaoDasEtapas, type Etapa } from './etapas'
import { parametrosIniciais } from './parametrosIniciais'
import { useInterfaceStore } from './useInterfaceStore'
import { useProjetosStore } from './useProjetosStore'
import { useSimulacaoStore } from './useSimulacaoStore'

export interface OrcamentoAtivo {
  projeto: Projeto
  orcamento: Orcamento
}

interface FluxoState {
  etapa: Etapa
  livre: boolean
  orcamentoAtivo: OrcamentoAtivo | null
  raioNecessarioM: number | null
  configuracaoEscolhida: boolean

  /** Vai para a etapa, se estiver liberada (devolve se foi). */
  irPara: (etapa: Etapa) => boolean
  /** Volta ao Início, sem projeto, sem configuração (o cenário recomeça). */
  reiniciar: () => void
  iniciarSimulacaoLivre: () => void
  definirOrcamentoAtivo: (ativo: OrcamentoAtivo) => void
  definirRaioNecessario: (raioM: number | null) => void
  /** Etapa ③: carrega a configuração sugerida na simulação e segue para ela. */
  escolherConfiguracao: (parametros: ParametrosDoCenario) => void
  /** Etapa ⑤: começa outro cenário no mesmo orçamento, mantendo a carga. */
  novoCenarioNoOrcamento: () => void
}

/** Estado atual de liberação das etapas (lê as três stores). */
export function situacaoAtual() {
  const f = useFluxoStore.getState()
  return situacaoDasEtapas(
    {
      livre: f.livre,
      temOrcamentoAtivo: f.orcamentoAtivo !== null,
      raioNecessarioM: f.raioNecessarioM,
      configuracaoEscolhida: f.configuracaoEscolhida,
      cenarioSalvo: useProjetosStore.getState().aberto !== null,
    },
    useSimulacaoStore.getState().cenario,
  )
}

/**
 * Cenário-base de um guindaste para o pedido: os valores iniciais do
 * guindaste (da ficha) com a carga, os acessórios, os limites, o ambiente e
 * a massa linear do cabo que o engenheiro informou na etapa ②.
 */
export function baseDoPedido(ctx: ContextoDoGuindaste, pedido: ParametrosDoCenario): ParametrosDoCenario {
  const p = parametrosIniciais(ctx)
  p.carga = structuredClone(pedido.carga)
  p.acessorios = structuredClone(pedido.acessorios)
  p.alturaIcamentoNecessariaM = pedido.alturaIcamentoNecessariaM
  p.limiteUtilizacaoPercentual = pedido.limiteUtilizacaoPercentual
  p.ambiente = structuredClone(pedido.ambiente)
  p.cabo.massaLinearKgM = pedido.cabo.massaLinearKgM
  return p
}

export const useFluxoStore = create<FluxoState>((set, get) => ({
  etapa: 'inicio',
  livre: false,
  orcamentoAtivo: null,
  raioNecessarioM: null,
  configuracaoEscolhida: false,

  irPara: (etapa) => {
    if (!situacaoAtual()[etapa].liberada) return false
    if (etapa !== 'simulacao') useInterfaceStore.getState().confirmarEdicao()
    set({ etapa })
    return true
  },
  reiniciar: () => {
    useInterfaceStore.getState().confirmarEdicao()
    useProjetosStore.getState().desvincular()
    useSimulacaoStore.getState().selecionarGuindaste(useSimulacaoStore.getState().cenario.guindasteId)
    set({ etapa: 'inicio', livre: false, orcamentoAtivo: null, raioNecessarioM: null, configuracaoEscolhida: false })
  },
  iniciarSimulacaoLivre: () => set({ livre: true, etapa: 'simulacao' }),
  definirOrcamentoAtivo: (orcamentoAtivo) => set({ orcamentoAtivo }),
  definirRaioNecessario: (raioNecessarioM) => set({ raioNecessarioM }),
  escolherConfiguracao: (parametros) => {
    useProjetosStore.getState().desvincular()
    useSimulacaoStore.getState().carregarCenario(parametros)
    set({ configuracaoEscolhida: true })
    get().irPara('simulacao')
  },
  novoCenarioNoOrcamento: () => {
    useProjetosStore.getState().desvincular()
    set({ configuracaoEscolhida: false })
    get().irPara(get().raioNecessarioM !== null ? 'guindaste' : 'carga')
  },
}))

// Abrir um cenário salvo (gerenciador, Início) ou salvar um novo define o orçamento em que se
// está trabalhando; abrir a partir das etapas iniciais leva direto à simulação.
useProjetosStore.subscribe((s, anterior) => {
  if (!s.aberto || s.aberto.cenario.id === anterior.aberto?.cenario.id) return
  const fluxo = useFluxoStore.getState()
  const vindoDoInicio = ['inicio', 'projeto', 'carga', 'guindaste'].includes(fluxo.etapa)
  useFluxoStore.setState({
    orcamentoAtivo: { projeto: s.aberto.projeto, orcamento: s.aberto.orcamento },
    configuracaoEscolhida: true,
    ...(vindoDoInicio ? { etapa: 'simulacao' as Etapa } : {}),
  })
})

/** Guindastes da frota com tabela da lança principal, para a sugestão de configurações. */
export function frotaParaSugestao(): ContextoDoGuindaste[] {
  return Object.values(CATALOGO).filter(
    (c) => c.tabelas.principalVarianteA !== undefined || c.tabelas.principalZonaRaio !== undefined,
  )
}
