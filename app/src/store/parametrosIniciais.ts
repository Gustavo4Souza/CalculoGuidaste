/**
 * Cenário inicial de cada guindaste (Épico 11) — só valores que vêm das
 * especificações (data/especificacoes/*.json) ou que são neutros para a
 * operação. O que não consta nas fichas (massa linear do cabo, massa do
 * moitão do TM-130) começa VAZIO, de propósito: o motor responde "sem dado"
 * até o engenheiro informar (regra de ouro).
 */
import type { ContextoDoGuindaste } from '../engine/avaliarCenario'
import { pernasPrevistasPelaTabela } from '../engine/avaliarCenario'
import { resolverAnguloParaRaio } from '../engine/geometriaLanca'
import type { ParametrosDoCenario } from '../types/cenario'

/** Comprimento e raio iniciais do MD-300L: coluna do meio da tabela (17,70 m), raio 8 m. */
const MD300L_COMPRIMENTO_INICIAL_M = 17.7
const MD300L_RAIO_INICIAL_M = 8

export function parametrosIniciais(ctx: ContextoDoGuindaste): ParametrosDoCenario {
  const { especificacao: esp } = ctx
  const ehMD300L = esp.tipoTabelaPrincipal === 'comprimento_raio_quadrante'

  const comprimentoM = ehMD300L ? MD300L_COMPRIMENTO_INICIAL_M : esp.lanca.comprimentoMaxM.valor
  const anguloGraus = ehMD300L
    ? (resolverAnguloParaRaio(
        { alturaPeDaLancaM: esp.lanca.alturaPeM.valor, recuoPeDaLancaM: esp.lanca.recuoPeM.valor },
        { comprimentoLancaM: comprimentoM },
        MD300L_RAIO_INICIAL_M,
        esp.lanca.anguloMinGraus.valor,
        esp.lanca.anguloMaxGraus.valor,
      ) ?? 45)
    : 30

  const pernas = pernasPrevistasPelaTabela(esp, comprimentoM)

  return {
    guindasteId: ctx.guindaste.id,
    lanca: { comprimentoM, anguloGraus },
    giroGraus: 0,
    jib: {
      ativo: false,
      comprimentoM: esp.jib.comprimentosM[0],
      anguloGraus: esp.jib.anguloMinGraus,
    },
    sapatas: {
      dianteira_esquerda: esp.sapatas.dianteiras.estendidaM.valor,
      dianteira_direita: esp.sapatas.dianteiras.estendidaM.valor,
      traseira_esquerda: esp.sapatas.traseiras.estendidaM.valor,
      traseira_direita: esp.sapatas.traseiras.estendidaM.valor,
    },
    cabo: {
      // MD-300L: a passagem que a tabela prevê para o comprimento. TM-130: a ficha não informa
      // (e o nº de roldanas NÃO vale como nº de pernas) → vazio, "sem dado" até o engenheiro informar.
      numeroDePernas: pernas[0] ?? null,
      massaLinearKgM: null,
      massaSobrescritaKg: null,
    },
    moitao: { massaKg: esp.moitao.massaGanchoIncluidaNaTabelaKg },
    carga: {
      descricao: '',
      pesoKg: 0,
      comprimentoM: 1,
      larguraM: 1,
      alturaM: 1,
      centroDeGravidade: { dx: 0, dy: 0, dz: 0 },
    },
    acessorios: { massaLingadaKg: 0, alturaLingadaM: 1, usaBalancim: false, massaBalancimKg: 0 },
    alturaIcamentoNecessariaM: null,
    limiteUtilizacaoPercentual: 100,
    ambiente: { ventoMaximoMS: null, pressaoAdmissivelSoloKgfCm2: null },
  }
}
