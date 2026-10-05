/**
 * Mapa da área de operação no chão (Épico 14, RF22).
 *
 * Para a configuração atual (lança, JIB, sapatas, cabo, carga, acessórios,
 * limites), varre uma grade polar em volta do centro de giro — giro × raio
 * — e, em cada nó, chama A MESMA função do motor (`avaliarCenario`), só
 * trocando o giro e o ângulo da lança que põe o gancho naquele raio. Não há
 * nenhuma regra de capacidade própria aqui: o mapa é exatamente o que o
 * motor responderia se o engenheiro levasse a lança até ali.
 *
 * Cada CÉLULA da grade fica com o pior status dos seus 4 cantos (uma célula
 * só é "ok" se a região inteira for), na ordem nok > sem_dado > atencao > ok.
 * Cantos que a lança atual não alcança são ignorados; a célula só é
 * "fora_de_alcance" se nenhum canto for alcançável.
 */
import type { ParametrosDoCenario, StatusDoCenario } from '../types/cenario'
import { avaliarCenario, type ContextoDoGuindaste } from './avaliarCenario'
import { calcularPonta, resolverAnguloParaRaio } from './geometriaLanca'

export type StatusNoMapa = StatusDoCenario | 'fora_de_alcance'

export interface MapaAreaOperacao {
  /** Ângulos de giro dos nós da grade, em graus (crescentes). */
  giros: number[]
  /** Raios dos nós da grade, em metros (crescentes). */
  raios: number[]
  /** Status em cada nó: [índice do giro][índice do raio]. */
  nos: StatusNoMapa[][]
  /** Status de cada célula entre nós vizinhos: [giro i..i+1][raio j..j+1]. */
  celulas: StatusNoMapa[][]
  /** Quantas células de cada status (resumo para a legenda). */
  contagem: Record<StatusNoMapa, number>
}

export interface OpcoesDoMapa {
  passoGiroGraus?: number
  passoRaioM?: number
}

const GRAVIDADE: Record<StatusNoMapa, number> = {
  fora_de_alcance: 0,
  ok: 1,
  atencao: 2,
  sem_dado: 3,
  nok: 4,
}

function pior(a: StatusNoMapa, b: StatusNoMapa): StatusNoMapa {
  // "fora de alcance" só vence se não houver nada alcançável na célula.
  if (a === 'fora_de_alcance') return b
  if (b === 'fora_de_alcance') return a
  return GRAVIDADE[a] >= GRAVIDADE[b] ? a : b
}

export function calcularMapaAreaOperacao(
  p: ParametrosDoCenario,
  ctx: ContextoDoGuindaste,
  opcoes: OpcoesDoMapa = {},
): MapaAreaOperacao {
  const passoGiro = opcoes.passoGiroGraus ?? 5
  const passoRaio = opcoes.passoRaioM ?? 0.5
  const esp = ctx.especificacao
  const pe = { alturaPeDaLancaM: esp.lanca.alturaPeM.valor, recuoPeDaLancaM: esp.lanca.recuoPeM.valor }
  const posicao = {
    comprimentoLancaM: p.lanca.comprimentoM,
    jib: p.jib.ativo ? { comprimentoM: p.jib.comprimentoM, anguloGraus: p.jib.anguloGraus } : null,
  }
  const anguloMin = esp.lanca.anguloMinGraus.valor
  const anguloMax = esp.lanca.anguloMaxGraus.valor

  // Giro: volta inteira, ou só a faixa mecânica da ficha (TM-130: ±60°).
  const limite = esp.giro.limiteMecanicoGraus
  const giroIni = limite === null ? -180 : -limite
  const giroFim = limite === null ? 180 : limite
  const giros: number[] = []
  for (let g = giroIni; g <= giroFim + 1e-9; g += passoGiro) giros.push(g)

  // Raio: do centro até o alcance máximo da lança atual (ângulo mínimo).
  const alcanceMaximo = calcularPonta(pe, { ...posicao, anguloLancaGraus: anguloMin }).raioM
  const raios: number[] = []
  for (let r = 0; r <= alcanceMaximo + passoRaio - 1e-9; r += passoRaio) raios.push(Math.min(r, alcanceMaximo))

  // O ângulo que põe o gancho em cada raio não depende do giro: resolve uma vez por raio.
  const angulos = raios.map((r) => resolverAnguloParaRaio(pe, posicao, r, anguloMin, anguloMax))

  const rascunho: ParametrosDoCenario = structuredClone(p)
  const nos: StatusNoMapa[][] = giros.map((g) =>
    raios.map((_r, j) => {
      const angulo = angulos[j]
      if (angulo === null) return 'fora_de_alcance'
      rascunho.giroGraus = g
      rascunho.lanca.anguloGraus = angulo
      return avaliarCenario(rascunho, ctx).status
    }),
  )

  const contagem: Record<StatusNoMapa, number> = { ok: 0, atencao: 0, nok: 0, sem_dado: 0, fora_de_alcance: 0 }
  const celulas: StatusNoMapa[][] = []
  for (let i = 0; i < giros.length - 1; i++) {
    const linha: StatusNoMapa[] = []
    for (let j = 0; j < raios.length - 1; j++) {
      const s = [nos[i][j], nos[i][j + 1], nos[i + 1][j], nos[i + 1][j + 1]].reduce(pior)
      linha.push(s)
      contagem[s]++
    }
    celulas.push(linha)
  }

  return { giros, raios, nos, celulas, contagem }
}

/** Status do nó mais próximo de (giro, raio) — para consultas e testes. */
export function statusNoPonto(mapa: MapaAreaOperacao, giroGraus: number, raioM: number): StatusNoMapa {
  const i = mapa.giros.reduce((m, g, k) => (Math.abs(g - giroGraus) < Math.abs(mapa.giros[m] - giroGraus) ? k : m), 0)
  const j = mapa.raios.reduce((m, r, k) => (Math.abs(r - raioM) < Math.abs(mapa.raios[m] - raioM) ? k : m), 0)
  return mapa.nos[i][j]
}
