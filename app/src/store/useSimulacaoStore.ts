import { create } from 'zustand'
import { buscarConfiguracoesViaveis } from '../engine/buscaReversa'
import { calcularCapacidadeMaxima } from '../engine/calcularCapacidadeMaxima'
import { calcularRaioReal } from '../engine/geometriaLanca'
import guindastesData from '../data/guindastes.json'
import tabelaJIBData from '../data/tabelas/md-300l-jib.json'
import tabelaMD300L from '../data/tabelas/md-300l.json'
import tabelaTM130 from '../data/tabelas/tm-130.json'
import type {
  ConfiguracaoDeIcamento,
  ConfiguracaoViavel,
  Guindaste,
  ResultadoDoCalculo,
  TabelaCargaVarianteA,
  TabelaCargaVarianteB,
  TabelaJIB,
} from '../types/guindaste'

const guindastes = guindastesData as Guindaste[]
const tabelas = {
  varianteA: tabelaMD300L as TabelaCargaVarianteA[],
  varianteB: tabelaTM130 as TabelaCargaVarianteB[],
  jib: tabelaJIBData as TabelaJIB[],
}

/** Comprimentos de lança reais do MD-300L (colunas da tabela) — Task 3.4. */
export const COMPRIMENTOS_LANCA_MD300L = [10.5, 14.1, 17.7, 21.3, 24.9, 28.5, 32.1]

/** Combinações reais de JIB do MD-300L (RF12) — só comprimento×ângulo tabelados. */
export const COMPRIMENTOS_JIB_MD300L = [9, 15.5, 20]
export const ANGULOS_JIB_MD300L = [10, 25, 40]

/**
 * O TM-130 não tem um eixo de "comprimento de lança" na própria tabela
 * (é indexada só por zona+ângulo) — este valor é só a referência visual do
 * canvas (Task 3.1), não entra no motor de cálculo.
 */
const COMPRIMENTO_VISUAL_TM130 = 12

function anguloInicialParaRaio(guindaste: Guindaste, comprimentoLancaM: number, raioAlvoM: number): number {
  const cosAngulo = (raioAlvoM + guindaste.recuoPeDaLancaM) / comprimentoLancaM
  const anguloRad = Math.acos(Math.min(1, Math.max(-1, cosAngulo)))
  return (anguloRad * 180) / Math.PI
}

function configuracaoInicial(guindaste: Guindaste): ConfiguracaoDeIcamento {
  if (guindaste.tipoTabela === 'comprimento_raio_quadrante') {
    const comprimentoLancaM = COMPRIMENTOS_LANCA_MD300L[2] // 17,70m — meio da frota
    return {
      guindasteId: guindaste.id,
      comprimentoLancaM,
      anguloLancaGraus: anguloInicialParaRaio(guindaste, comprimentoLancaM, 8),
      quadranteOuZona: 'frontal',
      usaJIB: false,
      cargaIcadaKg: 0,
      massaLingadaKg: 0,
      massaCaboDeAcoKg: 0,
      usaBalancim: false,
    }
  }
  return {
    guindasteId: guindaste.id,
    anguloLancaGraus: 30,
    quadranteOuZona: 'I',
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

  /** Raio real de trabalho — só para exibição/canvas (Task 3.4); o motor deriva o dele mesmo do ângulo. */
  raioAtualM: number
  /** Comprimento visual usado só para desenhar o canvas do TM-130 (não existe na tabela real). */
  comprimentoVisualM: number

  buscaPesoKg: number
  configuracoesViaveis: ConfiguracaoViavel[]

  selecionarGuindaste: (id: string) => void
  atualizarConfiguracao: (parcial: Partial<ConfiguracaoDeIcamento>) => void
  definirAnguloGraus: (anguloGraus: number) => void
  definirRaioM: (raioM: number) => void
  definirComprimentoLancaM: (comprimentoLancaM: number) => void
  alternarUsoJIB: (ativo: boolean) => void
  definirJIB: (parcial: { comprimentoJibM?: number; anguloJibGraus?: number; raioM?: number }) => void
  buscarPorPeso: (pesoKg: number) => void
  recalcular: () => void
}

export const useSimulacaoStore = create<SimulacaoState>((set, get) => ({
  guindastes,
  guindasteSelecionado: guindastes[0],
  configuracao: configuracaoInicial(guindastes[0]),
  resultado: null,
  raioAtualM: 0,
  comprimentoVisualM: COMPRIMENTO_VISUAL_TM130,
  buscaPesoKg: 0,
  configuracoesViaveis: [],

  selecionarGuindaste: (id) => {
    const guindaste = get().guindastes.find((g) => g.id === id)
    if (!guindaste) return
    set({ guindasteSelecionado: guindaste, configuracao: configuracaoInicial(guindaste), resultado: null })
    get().recalcular()
  },

  atualizarConfiguracao: (parcial) => {
    set((state) => ({ configuracao: { ...state.configuracao, ...parcial } }))
    get().recalcular()
  },

  definirAnguloGraus: (anguloGraus) => {
    get().atualizarConfiguracao({ anguloLancaGraus: anguloGraus })
  },

  definirRaioM: (raioM) => {
    const { guindasteSelecionado, configuracao } = get()
    if (guindasteSelecionado.tipoTabela !== 'comprimento_raio_quadrante' || configuracao.comprimentoLancaM === undefined) {
      return
    }
    const anguloGraus = anguloInicialParaRaio(guindasteSelecionado, configuracao.comprimentoLancaM, raioM)
    get().atualizarConfiguracao({ anguloLancaGraus: anguloGraus })
  },

  definirComprimentoLancaM: (comprimentoLancaM) => {
    // Task 8.2 — comprimento contínuo (arrasto da própria lança na cena 3D),
    // além do seletor discreto (Task 3.4). Decisão de UX documentada no
    // ROADMAP.md (Épico 8, Task 8.2): valor livre/contínuo, não "magnetizado"
    // aos 7 pontos reais — o motor de cálculo já interpola com segurança
    // (arredondando sempre para baixo) em qualquer ponto dentro do domínio
    // real da tabela (10,50 m–32,10 m). Fora desse domínio seria
    // extrapolação, não interpolação — por isso o valor é sempre limitado
    // (clamp) aos extremos reais, nunca solto além deles.
    const min = COMPRIMENTOS_LANCA_MD300L[0]
    const max = COMPRIMENTOS_LANCA_MD300L[COMPRIMENTOS_LANCA_MD300L.length - 1]
    const limitado = Math.min(max, Math.max(min, comprimentoLancaM))
    get().atualizarConfiguracao({ comprimentoLancaM: limitado })
  },

  alternarUsoJIB: (ativo) => {
    if (ativo) {
      get().atualizarConfiguracao({
        usaJIB: true,
        jib: { comprimentoJibM: COMPRIMENTOS_JIB_MD300L[0], anguloJibGraus: ANGULOS_JIB_MD300L[0] },
        raioM: 6,
      })
    } else {
      get().atualizarConfiguracao({ usaJIB: false, jib: undefined, raioM: undefined })
    }
  },

  definirJIB: (parcial) => {
    const { configuracao } = get()
    get().atualizarConfiguracao({
      jib: {
        comprimentoJibM: parcial.comprimentoJibM ?? configuracao.jib?.comprimentoJibM ?? COMPRIMENTOS_JIB_MD300L[0],
        anguloJibGraus: parcial.anguloJibGraus ?? configuracao.jib?.anguloJibGraus ?? ANGULOS_JIB_MD300L[0],
      },
      raioM: parcial.raioM ?? configuracao.raioM,
    })
  },

  buscarPorPeso: (pesoKg) => {
    const configuracoesViaveis = buscarConfiguracoesViaveis(guindastes, tabelas, pesoKg)
    set({ buscaPesoKg: pesoKg, configuracoesViaveis })
  },

  recalcular: () => {
    const { guindasteSelecionado, configuracao } = get()

    // Raio real de trabalho, só para exibição/canvas — RF11/Task 2.2.
    let raioAtualM = 0
    if (guindasteSelecionado.tipoTabela === 'comprimento_raio_quadrante' && !configuracao.usaJIB) {
      if (configuracao.comprimentoLancaM !== undefined && configuracao.anguloLancaGraus !== undefined) {
        raioAtualM = calcularRaioReal(guindasteSelecionado, configuracao.comprimentoLancaM, configuracao.anguloLancaGraus)
      }
    } else if (configuracao.usaJIB) {
      raioAtualM = configuracao.raioM ?? 0
    }

    try {
      const resultado = calcularCapacidadeMaxima(guindasteSelecionado, configuracao, tabelas)
      set({ resultado, raioAtualM })
    } catch {
      // Configuração ainda incompleta — sem resultado ainda.
      set({ resultado: null, raioAtualM })
    }
  },
}))

// Calcula o resultado inicial (guindaste padrão) assim que a store é criada,
// em vez de esperar a primeira interação do usuário.
useSimulacaoStore.getState().recalcular()
