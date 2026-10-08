/**
 * Preferências de interface (Épico 12) — NÃO fazem parte do cenário de
 * operação (não vão para o relatório nem para o cenário salvo): unidade de
 * exibição de massa (RF14), vista de câmera pedida, diálogos abertos e,
 * desde o Épico 17, o estado da área de trabalho estilo SolidWorks
 * (aba do CommandManager, nó em edição no PropertyManager, cotas).
 */
import { create } from 'zustand'
import type { IdNo } from '../components/gerenciador/nos'
import type { ParametrosDoCenario } from '../types/cenario'
import { useSimulacaoStore } from './useSimulacaoStore'

export type UnidadeMassa = 'kg' | 't'
export type VistaPadrao = 'isometrica' | 'frontal' | 'lateral' | 'superior'
/** Diálogos modais da barra de comandos (Épicos 12, 15 e 16). */
export type Dialogo = 'busca' | 'projetos' | 'salvar' | 'comparar' | 'pdf'
/** Abas do CommandManager (Épico 17). */
export type AbaComandos = 'guindaste' | 'avaliar'

/**
 * Edição de um nó no PropertyManager (Épico 17): como no SolidWorks, a
 * edição é ao vivo (a cena e o resultado acompanham), ✔ confirma e ✖
 * desfaz tudo o que mudou desde que o nó foi aberto — `antes` é o cenário
 * nesse momento.
 */
export interface EdicaoDeNo {
  no: IdNo
  antes: ParametrosDoCenario
}

interface InterfaceState {
  unidadeMassa: UnidadeMassa
  /** Última vista pedida + contador, para pedir de novo a mesma vista depois de orbitar. */
  vista: { nome: VistaPadrao; pedido: number }
  dialogo: Dialogo | null
  /** Épico 15 — IDs dos cenários escolhidos para comparar lado a lado. */
  comparacaoIds: string[]
  /** Épico 14 — mapa da área de operação no chão (RF22). */
  mostrarMapa: boolean
  /** Épico 17 — cotas e rótulos técnicos na cena. */
  mostrarCotas: boolean
  abaComandos: AbaComandos
  /** null = FeatureManager (árvore) visível; senão, o PropertyManager do nó. */
  edicao: EdicaoDeNo | null

  definirUnidadeMassa: (u: UnidadeMassa) => void
  pedirVista: (nome: VistaPadrao) => void
  abrirDialogo: (dialogo: Dialogo | null) => void
  definirComparacao: (ids: string[]) => void
  alternarMapa: () => void
  alternarCotas: () => void
  definirAbaComandos: (aba: AbaComandos) => void
  /** Abre o PropertyManager do nó. Se outro nó estava em edição, ele é confirmado. */
  editarNo: (no: IdNo) => void
  /** ✔ — mantém as alterações e volta para a árvore. */
  confirmarEdicao: () => void
  /** ✖ — desfaz as alterações feitas desde que o nó foi aberto e volta para a árvore. */
  cancelarEdicao: () => void
}

export const useInterfaceStore = create<InterfaceState>((set, get) => ({
  unidadeMassa: 'kg',
  vista: { nome: 'isometrica', pedido: 0 },
  dialogo: null,
  comparacaoIds: [],
  mostrarMapa: true,
  mostrarCotas: true,
  abaComandos: 'guindaste',
  edicao: null,

  definirUnidadeMassa: (unidadeMassa) => set({ unidadeMassa }),
  pedirVista: (nome) => set((s) => ({ vista: { nome, pedido: s.vista.pedido + 1 } })),
  abrirDialogo: (dialogo) => set({ dialogo }),
  definirComparacao: (comparacaoIds) => set({ comparacaoIds }),
  alternarMapa: () => set((s) => ({ mostrarMapa: !s.mostrarMapa })),
  alternarCotas: () => set((s) => ({ mostrarCotas: !s.mostrarCotas })),
  definirAbaComandos: (abaComandos) => set({ abaComandos }),
  editarNo: (no) => {
    const atual = get().edicao
    if (atual?.no === no) return
    set({ edicao: { no, antes: structuredClone(useSimulacaoStore.getState().cenario) } })
  },
  confirmarEdicao: () => set({ edicao: null }),
  cancelarEdicao: () => {
    const atual = get().edicao
    if (atual) useSimulacaoStore.getState().carregarCenario(atual.antes)
    set({ edicao: null })
  },
}))

/** RF14 — conversão só de exibição; o cálculo interno é sempre em kg. */
export function formatarMassa(kg: number, unidade: UnidadeMassa): string {
  if (unidade === 't') {
    return `${(kg / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} t`
  }
  return `${Math.round(kg).toLocaleString('pt-BR')} kg`
}

/** Percentual com vírgula decimal (pt-BR), como todo número da interface. */
export function formatarPercentual(valor: number, casas = 1): string {
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
}
