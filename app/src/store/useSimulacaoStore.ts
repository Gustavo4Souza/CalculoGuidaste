import { create } from 'zustand'
import guindastesData from '../data/guindastes.json'
import tabelaMD300L from '../data/tabelas/md-300l.json'
import tabelaTM130 from '../data/tabelas/tm-130.json'
import { calcularCapacidadeMaxima } from '../engine/calcularCapacidadeMaxima'
import type {
  ConfiguracaoDeIcamento,
  Guindaste,
  ResultadoDoCalculo,
  TabelaCargaVarianteA,
  TabelaCargaVarianteB,
} from '../types/guindaste'

const guindastes = guindastesData as Guindaste[]
const tabelas = {
  varianteA: tabelaMD300L as TabelaCargaVarianteA[],
  varianteB: tabelaTM130 as TabelaCargaVarianteB[],
}

function configuracaoInicial(guindaste: Guindaste): ConfiguracaoDeIcamento {
  return {
    guindasteId: guindaste.id,
    quadranteOuZona: guindaste.tipoTabela === 'comprimento_raio_quadrante' ? 'frontal' : 'I',
    usaJIB: false,
    cargaIcadaKg: 0,
    massaLingadaKg: 0,
    massaCaboDeAcoKg: 0,
    usaBalancim: false,
  }
}

interface SimulacaoState {
  guindastes: Guindaste[]
  guindasteSelecionado: Guindaste
  configuracao: ConfiguracaoDeIcamento
  resultado: ResultadoDoCalculo | null

  selecionarGuindaste: (id: string) => void
  atualizarConfiguracao: (parcial: Partial<ConfiguracaoDeIcamento>) => void
  recalcular: () => void
}

export const useSimulacaoStore = create<SimulacaoState>((set, get) => ({
  guindastes,
  guindasteSelecionado: guindastes[0],
  configuracao: configuracaoInicial(guindastes[0]),
  resultado: null,

  selecionarGuindaste: (id) => {
    const guindaste = get().guindastes.find((g) => g.id === id)
    if (!guindaste) return
    set({ guindasteSelecionado: guindaste, configuracao: configuracaoInicial(guindaste), resultado: null })
  },

  atualizarConfiguracao: (parcial) => {
    set((state) => ({ configuracao: { ...state.configuracao, ...parcial } }))
    get().recalcular()
  },

  recalcular: () => {
    const { guindasteSelecionado, configuracao } = get()
    try {
      const resultado = calcularCapacidadeMaxima(guindasteSelecionado, configuracao, tabelas)
      set({ resultado })
    } catch {
      // Configuração ainda incompleta (ex.: raioM/anguloLancaGraus não definidos) — sem resultado ainda.
      set({ resultado: null })
    }
  },
}))
