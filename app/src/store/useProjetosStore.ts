/**
 * Projetos, orçamentos e cenários salvos (Épico 15, RF24) — estado do
 * gerenciador e do cenário aberto. Fala só com a interface
 * `RepositorioProjetos` (persistencia/repositorio.ts), nunca com o IndexedDB
 * direto. Abrir um cenário carrega os parâmetros salvos na store da
 * simulação (estado único, Épico 11) — o resultado é recalculado na hora.
 */
import { create } from 'zustand'
import { ErroDeImportacao } from '../persistencia/arquivoDeProjeto'
import { montarDadosCenario } from '../persistencia/montarCenario'
import { repositorio } from '../persistencia/repositorio'
import type { ArquivoDeProjeto, CenarioSalvo, DadosProjeto, Orcamento, Projeto } from '../types/projeto'
import { useSimulacaoStore } from './useSimulacaoStore'

export interface CenarioAberto {
  cenario: CenarioSalvo
  projeto: Projeto
  orcamento: Orcamento
}

interface ProjetosState {
  busca: string
  projetos: Projeto[]
  projetoId: string | null
  orcamentos: Orcamento[]
  orcamentoId: string | null
  cenarios: CenarioSalvo[]
  /** O cenário em edição na tela, se ele veio de (ou foi salvo em) um orçamento. */
  aberto: CenarioAberto | null
  mensagem: { tipo: 'ok' | 'erro'; texto: string } | null

  carregarProjetos: (busca?: string) => Promise<void>
  selecionarProjeto: (id: string | null) => Promise<void>
  selecionarOrcamento: (id: string | null) => Promise<void>

  /** null = falhou (a mensagem de erro fica em `mensagem`). */
  criarProjeto: (dados: DadosProjeto) => Promise<Projeto | null>
  atualizarProjeto: (id: string, dados: DadosProjeto) => Promise<void>
  excluirProjeto: (id: string) => Promise<void>

  /** null = falhou (a mensagem de erro fica em `mensagem`). */
  criarOrcamento: (projetoId: string, nome: string) => Promise<Orcamento | null>
  renomearOrcamento: (id: string, nome: string) => Promise<void>
  excluirOrcamento: (id: string) => Promise<void>

  /** "Salvar como cenário": grava a simulação atual como um cenário NOVO no orçamento. */
  /** true = salvo; false = falhou (mensagem de erro em `mensagem`). */
  salvarComoNovo: (orcamentoId: string, nome: string) => Promise<boolean>
  /** "Salvar": sobrescreve o cenário aberto com a simulação atual. */
  salvar: () => Promise<void>
  abrirCenario: (id: string) => Promise<void>
  duplicarCenario: (id: string, nome: string) => Promise<void>
  renomearCenario: (id: string, nome: string) => Promise<void>
  excluirCenario: (id: string) => Promise<void>
  /** "Novo": a simulação deixa de estar vinculada a um cenário salvo. */
  desvincular: () => void

  exportarProjeto: (id: string) => Promise<ArquivoDeProjeto>
  importarTexto: (texto: string) => Promise<void>
  limparMensagem: () => void
}

export const useProjetosStore = create<ProjetosState>((set, get) => {
  const erro = (e: unknown) =>
    set({ mensagem: { tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro inesperado ao acessar os dados salvos.' } })

  const recarregarCenarios = async () => {
    const { orcamentoId } = get()
    set({ cenarios: orcamentoId ? await repositorio.listarCenarios(orcamentoId) : [] })
  }
  const recarregarOrcamentos = async () => {
    const { projetoId } = get()
    set({ orcamentos: projetoId ? await repositorio.listarOrcamentos(projetoId) : [] })
  }

  return {
    busca: '',
    projetos: [],
    projetoId: null,
    orcamentos: [],
    orcamentoId: null,
    cenarios: [],
    aberto: null,
    mensagem: null,

    carregarProjetos: async (busca = get().busca) => {
      try {
        set({ busca, projetos: await repositorio.listarProjetos(busca) })
      } catch (e) {
        erro(e)
      }
    },

    selecionarProjeto: async (id) => {
      set({ projetoId: id, orcamentoId: null, cenarios: [] })
      try {
        await recarregarOrcamentos()
      } catch (e) {
        erro(e)
      }
    },

    selecionarOrcamento: async (id) => {
      set({ orcamentoId: id })
      try {
        await recarregarCenarios()
      } catch (e) {
        erro(e)
      }
    },

    criarProjeto: async (dados) => {
      try {
        const projeto = await repositorio.criarProjeto(dados)
        await get().carregarProjetos()
        await get().selecionarProjeto(projeto.id)
        return projeto
      } catch (e) {
        erro(e)
        return null
      }
    },

    atualizarProjeto: async (id, dados) => {
      try {
        const projeto = await repositorio.atualizarProjeto(id, dados)
        const { aberto } = get()
        if (aberto?.projeto.id === id) set({ aberto: { ...aberto, projeto } })
        await get().carregarProjetos()
      } catch (e) {
        erro(e)
      }
    },

    excluirProjeto: async (id) => {
      try {
        await repositorio.excluirProjeto(id)
        if (get().aberto?.projeto.id === id) set({ aberto: null })
        if (get().projetoId === id) await get().selecionarProjeto(null)
        await get().carregarProjetos()
      } catch (e) {
        erro(e)
      }
    },

    criarOrcamento: async (projetoId, nome) => {
      try {
        const orcamento = await repositorio.criarOrcamento({ projetoId, nome, descricao: '' })
        if (get().projetoId === projetoId) await recarregarOrcamentos()
        await get().carregarProjetos()
        return orcamento
      } catch (e) {
        erro(e)
        return null
      }
    },

    renomearOrcamento: async (id, nome) => {
      try {
        const atual = await repositorio.obterOrcamento(id)
        if (!atual) return
        const orcamento = await repositorio.atualizarOrcamento(id, { nome, descricao: atual.descricao })
        const { aberto } = get()
        if (aberto?.orcamento.id === id) set({ aberto: { ...aberto, orcamento } })
        await recarregarOrcamentos()
      } catch (e) {
        erro(e)
      }
    },

    excluirOrcamento: async (id) => {
      try {
        await repositorio.excluirOrcamento(id)
        if (get().aberto?.orcamento.id === id) set({ aberto: null })
        if (get().orcamentoId === id) set({ orcamentoId: null, cenarios: [] })
        await recarregarOrcamentos()
      } catch (e) {
        erro(e)
      }
    },

    salvarComoNovo: async (orcamentoId, nome) => {
      try {
        const parametros = useSimulacaoStore.getState().cenario
        const cenario = await repositorio.criarCenario(montarDadosCenario(orcamentoId, nome, parametros))
        const orcamento = (await repositorio.obterOrcamento(orcamentoId))!
        const projeto = (await repositorio.obterProjeto(orcamento.projetoId))!
        set({ aberto: { cenario, projeto, orcamento }, mensagem: { tipo: 'ok', texto: `Cenário "${nome}" salvo.` } })
        await get().selecionarProjeto(projeto.id)
        await get().selecionarOrcamento(orcamentoId)
        await get().carregarProjetos()
        return true
      } catch (e) {
        erro(e)
        return false
      }
    },

    salvar: async () => {
      const { aberto } = get()
      if (!aberto) return
      try {
        const parametros = useSimulacaoStore.getState().cenario
        const cenario = await repositorio.atualizarCenario(
          aberto.cenario.id,
          montarDadosCenario(aberto.orcamento.id, aberto.cenario.nome, parametros),
        )
        set({ aberto: { ...aberto, cenario }, mensagem: { tipo: 'ok', texto: `Cenário "${cenario.nome}" salvo.` } })
        await recarregarCenarios()
      } catch (e) {
        erro(e)
      }
    },

    abrirCenario: async (id) => {
      try {
        const cenario = await repositorio.obterCenario(id)
        if (!cenario) throw new Error('Cenário não encontrado.')
        const orcamento = (await repositorio.obterOrcamento(cenario.orcamentoId))!
        const projeto = (await repositorio.obterProjeto(orcamento.projetoId))!
        useSimulacaoStore.getState().carregarCenario(cenario.parametros)
        set({ aberto: { cenario, projeto, orcamento }, mensagem: null })
      } catch (e) {
        erro(e)
      }
    },

    duplicarCenario: async (id, nome) => {
      try {
        await repositorio.duplicarCenario(id, nome)
        await recarregarCenarios()
      } catch (e) {
        erro(e)
      }
    },

    renomearCenario: async (id, nome) => {
      try {
        const cenario = await repositorio.atualizarCenario(id, { nome })
        const { aberto } = get()
        if (aberto?.cenario.id === id) set({ aberto: { ...aberto, cenario } })
        await recarregarCenarios()
      } catch (e) {
        erro(e)
      }
    },

    excluirCenario: async (id) => {
      try {
        await repositorio.excluirCenario(id)
        if (get().aberto?.cenario.id === id) set({ aberto: null })
        await recarregarCenarios()
      } catch (e) {
        erro(e)
      }
    },

    desvincular: () => set({ aberto: null }),

    exportarProjeto: (id) => repositorio.exportarProjeto(id),

    importarTexto: async (texto) => {
      try {
        let bruto: unknown
        try {
          bruto = JSON.parse(texto)
        } catch {
          throw new ErroDeImportacao('O arquivo não é um JSON válido.')
        }
        const projeto = await repositorio.importarProjeto(bruto)
        await get().carregarProjetos('')
        await get().selecionarProjeto(projeto.id)
        set({ mensagem: { tipo: 'ok', texto: `Projeto "${projeto.cliente} — ${projeto.obra}" importado (como cópia).` } })
      } catch (e) {
        erro(e)
      }
    },

    limparMensagem: () => set({ mensagem: null }),
  }
})
