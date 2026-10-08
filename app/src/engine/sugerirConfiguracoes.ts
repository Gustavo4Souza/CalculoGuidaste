/**
 * Sugestão de configurações para um pedido de içamento (Épico 18, RF05/RF15).
 *
 * Para cada guindaste da frota e cada configuração candidata (comprimento de
 * lança × área de giro), põe o gancho no RAIO NECESSÁRIO e chama a própria
 * `avaliarCenario` com a carga do pedido. Não existe regra de capacidade
 * aqui: o resultado de cada sugestão é exatamente o que o motor responde
 * para aquele cenário (inclusive "sem dado", com o motivo — regra de ouro).
 *
 * Ordem (RF15): MENOR guindaste primeiro (capacidade nominal). Dentro do
 * guindaste: aprovada, atenção, não validada, reprovada; depois a lança mais
 * curta; depois a ordem das áreas no critério de giro.
 *
 * Só a lança principal: o JIB continua disponível na simulação.
 */
import type { AvaliacaoDoCenario, ParametrosDoCenario, RegiaoDeGiro, StatusDoCenario } from '../types/cenario'
import { avaliarCenario, pernasPrevistasPelaTabela, type ContextoDoGuindaste } from './avaliarCenario'
import { resolverAnguloParaRaio } from './geometriaLanca'

export interface CandidatoDaFrota {
  ctx: ContextoDoGuindaste
  /** Cenário-base do guindaste com a carga, os acessórios e os limites do pedido. */
  base: ParametrosDoCenario
}

export interface SugestaoDeConfiguracao {
  guindasteId: string
  comprimentoLancaM: number
  regiao: RegiaoDeGiro
  /** Giro representativo da área (0° na primeira; o meio do setor nas demais). */
  giroGraus: number
  parametros: ParametrosDoCenario
  avaliacao: AvaliacaoDoCenario
}

export interface ResultadoDaSugestao {
  sugestoes: SugestaoDeConfiguracao[]
  /** Lanças que não alcançam o raio pedido (nenhum ângulo dentro do limite mecânico chega lá). */
  foraDeAlcance: { guindasteId: string; comprimentoLancaM: number }[]
}

const ORDEM_STATUS: Record<StatusDoCenario, number> = { ok: 0, atencao: 1, sem_dado: 2, nok: 3 }

/** Comprimentos candidatos: as colunas reais da tabela (MD-300L) ou o comprimento máximo (TM-130, sem eixo de comprimento). */
function comprimentosCandidatos(ctx: ContextoDoGuindaste): number[] {
  const colunas = ctx.tabelas.principalVarianteA
  if (colunas && colunas.length > 0) return [...new Set(colunas.map((l) => l.comprimentoLancaM))].sort((a, b) => a - b)
  return [ctx.especificacao.lanca.comprimentoMaxM.valor]
}

/** Uma área por setor do critério de giro, com um giro que cai dentro dela (e dentro do limite mecânico). */
function areasCandidatas(ctx: ContextoDoGuindaste): { regiao: RegiaoDeGiro; giroGraus: number }[] {
  const { setores } = ctx.criterioDeGiro
  const limite = ctx.especificacao.giro.limiteMecanicoGraus ?? 180
  return setores.map((s, i) => ({
    regiao: s.regiao,
    giroGraus: i === 0 ? 0 : Math.min((setores[i - 1].ateGraus + s.ateGraus) / 2, limite),
  }))
}

export function sugerirConfiguracoes(candidatos: CandidatoDaFrota[], raioNecessarioM: number): ResultadoDaSugestao {
  const sugestoes: (SugestaoDeConfiguracao & { nominalKg: number; ordemArea: number })[] = []
  const foraDeAlcance: ResultadoDaSugestao['foraDeAlcance'] = []

  for (const { ctx, base } of candidatos) {
    const esp = ctx.especificacao
    for (const comprimentoLancaM of comprimentosCandidatos(ctx)) {
      const angulo = resolverAnguloParaRaio(
        { alturaPeDaLancaM: esp.lanca.alturaPeM.valor, recuoPeDaLancaM: esp.lanca.recuoPeM.valor },
        { comprimentoLancaM },
        raioNecessarioM,
        esp.lanca.anguloMinGraus.valor,
        esp.lanca.anguloMaxGraus.valor,
      )
      if (angulo === null) {
        foraDeAlcance.push({ guindasteId: ctx.guindaste.id, comprimentoLancaM })
        continue
      }
      areasCandidatas(ctx).forEach(({ regiao, giroGraus }, ordemArea) => {
        const p = structuredClone(base)
        p.guindasteId = ctx.guindaste.id
        p.lanca = { comprimentoM: comprimentoLancaM, anguloGraus: angulo }
        p.giroGraus = giroGraus
        p.jib.ativo = false
        // A passagem de cabo que a tabela prevê para este comprimento (MD-300L); sem previsão (TM-130), fica a do pedido.
        const pernas = pernasPrevistasPelaTabela(esp, comprimentoLancaM)
        if (pernas.length > 0) p.cabo.numeroDePernas = pernas[0]
        sugestoes.push({
          guindasteId: ctx.guindaste.id,
          comprimentoLancaM,
          regiao,
          giroGraus,
          parametros: p,
          avaliacao: avaliarCenario(p, ctx),
          nominalKg: ctx.guindaste.capacidadeNominalKg,
          ordemArea,
        })
      })
    }
  }

  sugestoes.sort(
    (a, b) =>
      a.nominalKg - b.nominalKg ||
      a.guindasteId.localeCompare(b.guindasteId) ||
      ORDEM_STATUS[a.avaliacao.status] - ORDEM_STATUS[b.avaliacao.status] ||
      a.comprimentoLancaM - b.comprimentoLancaM ||
      a.ordemArea - b.ordemArea,
  )
  return {
    sugestoes: sugestoes.map(({ nominalKg: _n, ordemArea: _o, ...s }) => s),
    foraDeAlcance,
  }
}
