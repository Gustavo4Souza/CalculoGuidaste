/**
 * Estado da simulação (Épico 11 — fonte única de estado, RF16).
 *
 * `cenario` (ParametrosDoCenario) é o ÚNICO estado editável: campos
 * numéricos, arrastos na cena 3D e (no Épico 15) cenários reabertos escrevem
 * todos aqui. `avaliacao` é sempre DERIVADA dele pelo motor
 * (engine/avaliarCenario.ts) a cada mudança — nunca editada à parte. Assim
 * painel, cena, cotas e resultado não têm como divergir.
 *
 * As ações limitam (clamp) cada parâmetro aos limites MECÂNICOS da ficha;
 * a cobertura da tabela (o que tem ou não capacidade validada) é decidida
 * só pelo motor.
 */
import { create } from 'zustand'
import { CATALOGO } from '../data/catalogo'
import type { ContextoDoGuindaste } from '../engine/avaliarCenario'
import { avaliarCenario, pernasPrevistasPelaTabela } from '../engine/avaliarCenario'
import { buscarConfiguracoesViaveis } from '../engine/buscaReversa'
import { normalizarGiro } from '../engine/classificarGiro'
import { calcularPonta, resolverAnguloParaRaio } from '../engine/geometriaLanca'
import type { AvaliacaoDoCenario, ParametrosDoCenario, PosicaoSapata } from '../types/cenario'
import type { ConfiguracaoViavel, Guindaste, TabelaCargaVarianteA } from '../types/guindaste'
import { parametrosIniciais } from './parametrosIniciais'

const GUINDASTE_INICIAL = 'MD-300L'

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor))
}

function contexto(cenario: ParametrosDoCenario): ContextoDoGuindaste {
  return CATALOGO[cenario.guindasteId]
}

/** Comprimentos de lança reais (colunas da tabela principal) — marcas de encaixe na cena. */
export function comprimentosReaisDaTabela(ctx: ContextoDoGuindaste): number[] {
  const linhas = ctx.tabelas.principalVarianteA ?? []
  return [...new Set(linhas.map((l) => l.comprimentoLancaM))].sort((a, b) => a - b)
}

/**
 * Guindastes que entram na busca reversa (RF15): só os que têm a tabela da
 * lança principal disponível (a zona×ângulo do TM-130 é a do JIB, não da
 * lança principal — nunca a usar aqui). Desde a Task 10.1 os dois têm.
 */
function temTabelaPrincipal(c: ContextoDoGuindaste): boolean {
  return c.tabelas.principalVarianteA !== undefined || c.tabelas.principalZonaRaio !== undefined
}

function frotaComTabelaPrincipal(): Guindaste[] {
  return Object.values(CATALOGO)
    .filter(temTabelaPrincipal)
    .map((c) => c.guindaste)
}

export const GUINDASTES_FORA_DA_BUSCA = Object.values(CATALOGO)
  .filter((c) => !temTabelaPrincipal(c))
  .map((c) => c.guindaste.nome)

interface SimulacaoState {
  guindastes: Guindaste[]
  cenario: ParametrosDoCenario
  /** Derivada de `cenario` — nunca editar diretamente. */
  avaliacao: AvaliacaoDoCenario

  buscaPesoKg: number
  configuracoesViaveis: ConfiguracaoViavel[]

  selecionarGuindaste: (id: string) => void
  /** Substitui o cenário inteiro (ex.: reabrir um cenário salvo, Épico 15). */
  carregarCenario: (cenario: ParametrosDoCenario) => void
  /** Escrita genérica para campos sem regra de limite própria (carga, acessórios, ambiente...). */
  atualizarCenario: (alterar: (rascunho: ParametrosDoCenario) => void) => void

  definirComprimentoLancaM: (comprimentoM: number) => void
  definirAnguloGraus: (anguloGraus: number) => void
  /** Ajusta o ângulo da lança para pôr o gancho no raio pedido (mantendo comprimentos). */
  definirRaioM: (raioM: number) => void
  definirGiroGraus: (giroGraus: number) => void
  definirJIB: (parcial: Partial<ParametrosDoCenario['jib']>) => void
  definirSapata: (posicao: PosicaoSapata, extensaoM: number) => void

  buscarPorPeso: (pesoKg: number) => void
}

function comAvaliacao(cenario: ParametrosDoCenario): Pick<SimulacaoState, 'cenario' | 'avaliacao'> {
  return { cenario, avaliacao: avaliarCenario(cenario, contexto(cenario)) }
}

const cenarioInicial = parametrosIniciais(CATALOGO[GUINDASTE_INICIAL])

export const useSimulacaoStore = create<SimulacaoState>((set, get) => {
  /** Aplica uma alteração num clone do cenário e recalcula a avaliação. */
  const alterar = (fn: (rascunho: ParametrosDoCenario, ctx: ContextoDoGuindaste) => void) => {
    const rascunho = structuredClone(get().cenario)
    fn(rascunho, contexto(rascunho))
    set(comAvaliacao(rascunho))
  }

  return {
    guindastes: Object.values(CATALOGO).map((c) => c.guindaste),
    ...comAvaliacao(cenarioInicial),
    buscaPesoKg: 0,
    configuracoesViaveis: [],

    selecionarGuindaste: (id) => {
      const ctx = CATALOGO[id]
      if (!ctx) return
      set(comAvaliacao(parametrosIniciais(ctx)))
    },

    carregarCenario: (cenario) => {
      if (!CATALOGO[cenario.guindasteId]) return
      set(comAvaliacao(structuredClone(cenario)))
    },

    atualizarCenario: (fn) => alterar((rascunho) => fn(rascunho)),

    definirComprimentoLancaM: (comprimentoM) =>
      alterar((c, { especificacao: esp }) => {
        const anterior = c.lanca.comprimentoM
        c.lanca.comprimentoM = limitar(comprimentoM, esp.lanca.comprimentoMinM.valor, esp.lanca.comprimentoMaxM.valor)
        // A passagem de cabo acompanha a tabela enquanto o engenheiro não a
        // tiver mudado à mão (pernas = o que a tabela previa antes).
        if (!c.jib.ativo && pernasPrevistasPelaTabela(esp, anterior).includes(c.cabo.numeroDePernas)) {
          const novas = pernasPrevistasPelaTabela(esp, c.lanca.comprimentoM)
          if (novas.length > 0 && !novas.includes(c.cabo.numeroDePernas)) c.cabo.numeroDePernas = novas[0]
        }
      }),

    definirAnguloGraus: (anguloGraus) =>
      alterar((c, { especificacao: esp }) => {
        c.lanca.anguloGraus = limitar(anguloGraus, esp.lanca.anguloMinGraus.valor, esp.lanca.anguloMaxGraus.valor)
      }),

    definirRaioM: (raioM) =>
      alterar((c, { especificacao: esp }) => {
        const min = esp.lanca.anguloMinGraus.valor
        const max = esp.lanca.anguloMaxGraus.valor
        const pe = { alturaPeDaLancaM: esp.lanca.alturaPeM.valor, recuoPeDaLancaM: esp.lanca.recuoPeM.valor }
        const posicao = {
          comprimentoLancaM: c.lanca.comprimentoM,
          jib: c.jib.ativo ? { comprimentoM: c.jib.comprimentoM, anguloGraus: c.jib.anguloGraus } : null,
        }
        const angulo = resolverAnguloParaRaio(pe, posicao, raioM, min, max)
        if (angulo !== null) {
          c.lanca.anguloGraus = angulo
        } else {
          // Raio inalcançável com esta lança: vai para o extremo mais próximo
          // (alcance máximo = ângulo mínimo; raio mínimo = ângulo máximo).
          const alcanceMaximoM = calcularPonta(pe, { ...posicao, anguloLancaGraus: min }).raioM
          c.lanca.anguloGraus = raioM > alcanceMaximoM ? min : max
        }
      }),

    definirGiroGraus: (giroGraus) =>
      alterar((c, { especificacao: esp }) => {
        const limite = esp.giro.limiteMecanicoGraus
        const normalizado = normalizarGiro(giroGraus)
        c.giroGraus = limite === null ? normalizado : limitar(normalizado, -limite, limite)
      }),

    definirJIB: (parcial) =>
      alterar((c, { especificacao: esp }) => {
        const ativando = parcial.ativo === true && !c.jib.ativo
        const desativando = parcial.ativo === false && c.jib.ativo
        Object.assign(c.jib, parcial)
        c.jib.anguloGraus = limitar(c.jib.anguloGraus, esp.jib.anguloMinGraus, esp.jib.anguloMaxGraus)
        if (ativando) {
          // A tabela de JIB exige a lança principal num comprimento fixo e 1 perna de cabo.
          if (esp.jib.comprimentoLancaExigidoM !== null) c.lanca.comprimentoM = esp.jib.comprimentoLancaExigidoM
          if (esp.jib.pernas !== null) c.cabo.numeroDePernas = esp.jib.pernas
          if (esp.jib.massaGanchoIncluidaNaTabelaKg !== null) c.moitao.massaKg = esp.jib.massaGanchoIncluidaNaTabelaKg
        }
        if (desativando) {
          const pernas = pernasPrevistasPelaTabela(esp, c.lanca.comprimentoM)
          if (pernas.length > 0) c.cabo.numeroDePernas = pernas[0]
          c.moitao.massaKg = esp.moitao.massaGanchoIncluidaNaTabelaKg
        }
      }),

    definirSapata: (posicao, extensaoM) =>
      alterar((c, { especificacao: esp }) => {
        const par = posicao.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
        c.sapatas[posicao] = limitar(extensaoM, par.recolhidaM.valor, par.estendidaM.valor)
      }),

    buscarPorPeso: (pesoKg) => {
      const varianteA = Object.values(CATALOGO).flatMap(
        (c) => (c.tabelas.principalVarianteA ?? []) as TabelaCargaVarianteA[],
      )
      const zonaRaio = Object.values(CATALOGO).flatMap((c) => c.tabelas.principalZonaRaio ?? [])
      const configuracoesViaveis = buscarConfiguracoesViaveis(
        frotaComTabelaPrincipal(),
        { varianteA, varianteB: [], zonaRaio },
        pesoKg,
      )
      set({ buscaPesoKg: pesoKg, configuracoesViaveis })
    },
  }
})
