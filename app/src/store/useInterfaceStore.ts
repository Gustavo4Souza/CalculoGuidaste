/**
 * Preferências de interface (Épico 12) — NÃO fazem parte do cenário de
 * operação (não vão para o relatório nem para o cenário salvo): unidade de
 * exibição de massa (RF14), vista de câmera pedida e diálogos abertos.
 */
import { create } from 'zustand'

export type UnidadeMassa = 'kg' | 't'
export type VistaPadrao = 'isometrica' | 'frontal' | 'lateral' | 'superior'
/** Diálogos modais da barra de comandos (Épicos 12, 15 e 16). */
export type Dialogo = 'busca' | 'projetos' | 'salvar' | 'comparar' | 'pdf'

interface InterfaceState {
  unidadeMassa: UnidadeMassa
  /** Última vista pedida + contador, para pedir de novo a mesma vista depois de orbitar. */
  vista: { nome: VistaPadrao; pedido: number }
  dialogo: Dialogo | null
  /** Épico 15 — IDs dos cenários escolhidos para comparar lado a lado. */
  comparacaoIds: string[]
  /** Épico 14 — mapa da área de operação no chão (RF22). */
  mostrarMapa: boolean

  definirUnidadeMassa: (u: UnidadeMassa) => void
  pedirVista: (nome: VistaPadrao) => void
  abrirDialogo: (dialogo: Dialogo | null) => void
  definirComparacao: (ids: string[]) => void
  alternarMapa: () => void
}

export const useInterfaceStore = create<InterfaceState>((set) => ({
  unidadeMassa: 'kg',
  vista: { nome: 'isometrica', pedido: 0 },
  dialogo: null,
  comparacaoIds: [],
  mostrarMapa: true,

  definirUnidadeMassa: (unidadeMassa) => set({ unidadeMassa }),
  pedirVista: (nome) => set((s) => ({ vista: { nome, pedido: s.vista.pedido + 1 } })),
  abrirDialogo: (dialogo) => set({ dialogo }),
  definirComparacao: (comparacaoIds) => set({ comparacaoIds }),
  alternarMapa: () => set((s) => ({ mostrarMapa: !s.mostrarMapa })),
}))

/** RF14 — conversão só de exibição; o cálculo interno é sempre em kg. */
export function formatarMassa(kg: number, unidade: UnidadeMassa): string {
  if (unidade === 't') {
    return `${(kg / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} t`
  }
  return `${Math.round(kg).toLocaleString('pt-BR')} kg`
}
