/**
 * Busca reversa (RF05/RF15 · RT-MC07 · Task 3.5): dado um peso a içar,
 * varre a frota inteira e devolve, para cada guindaste capaz de içar esse
 * peso, a configuração mais econômica (lança mais curta / menor ângulo de
 * giro necessário) — inspirado no Liebherr Crane Finder citado em
 * nota 🗳️ Decisões e Configuração. A lista final é ordenada por **menor guindaste primeiro**
 * (`capacidadeNominalKg`), nunca pelo maior — regra de negócio RF15.
 */
import type {
  ConfiguracaoViavel,
  Guindaste,
  PontoTabelaVarianteA,
  PontoTabelaVarianteB,
  Quadrante,
  TabelaCargaVarianteA,
  TabelaCargaVarianteB,
  TabelaCargaZonaRaio,
  ZonaDeGiro,
} from '../types/guindaste'

/**
 * Maior raio de trabalho, dentro de uma linha da tabela (comprimento +
 * quadrante fixos), em que a capacidade ainda atende `pesoKg` — assume que
 * a capacidade é não-crescente com o raio (verdade nas tabelas reais do
 * MD-300L: capacidade só cai ou se mantém conforme o raio aumenta).
 */
function raioMaximoParaPeso(
  pontos: ReadonlyArray<PontoTabelaVarianteA>,
  pesoKg: number,
): { raioM: number; capacidadeKg: number } | null {
  const ordenados = [...pontos].sort((a, b) => a.raioM - b.raioM)
  if (ordenados.length === 0 || ordenados[0].capacidadeKgf < pesoKg) {
    return null // nem no menor raio disponível a capacidade alcança o peso
  }

  const ultimo = ordenados[ordenados.length - 1]
  if (ultimo.capacidadeKgf >= pesoKg) {
    return { raioM: ultimo.raioM, capacidadeKg: ultimo.capacidadeKgf }
  }

  for (let i = 0; i < ordenados.length - 1; i++) {
    const a = ordenados[i]
    const b = ordenados[i + 1]
    if (a.capacidadeKgf >= pesoKg && b.capacidadeKgf < pesoKg) {
      const t = (pesoKg - a.capacidadeKgf) / (b.capacidadeKgf - a.capacidadeKgf)
      return { raioM: a.raioM + t * (b.raioM - a.raioM), capacidadeKg: pesoKg }
    }
  }

  return null // não deveria chegar aqui dados os checks acima
}

/**
 * Menor ângulo de lança, dentro de uma zona de giro, em que a capacidade já
 * atende `pesoKg` — assume que a capacidade é não-decrescente com o ângulo
 * (verdade na tabela real do TM-130: lança mais vertical = raio menor =
 * mais capacidade).
 */
function anguloMinimoParaPeso(
  pontos: ReadonlyArray<PontoTabelaVarianteB>,
  pesoKg: number,
): { anguloGraus: number; capacidadeKg: number } | null {
  const ordenados = [...pontos].sort((a, b) => a.anguloGraus - b.anguloGraus)
  if (ordenados.length === 0) return null

  const ultimo = ordenados[ordenados.length - 1]
  if (ultimo.capacidadeKg < pesoKg) {
    return null // nem no ângulo mais vertical a capacidade alcança o peso
  }

  const primeiro = ordenados[0]
  if (primeiro.capacidadeKg >= pesoKg) {
    return { anguloGraus: primeiro.anguloGraus, capacidadeKg: primeiro.capacidadeKg }
  }

  for (let i = 0; i < ordenados.length - 1; i++) {
    const a = ordenados[i]
    const b = ordenados[i + 1]
    if (a.capacidadeKg < pesoKg && b.capacidadeKg >= pesoKg) {
      const t = (pesoKg - a.capacidadeKg) / (b.capacidadeKg - a.capacidadeKg)
      return { anguloGraus: a.anguloGraus + t * (b.anguloGraus - a.anguloGraus), capacidadeKg: pesoKg }
    }
  }

  return null
}

function melhorConfiguracaoVarianteA(
  guindaste: Guindaste,
  linhas: ReadonlyArray<TabelaCargaVarianteA>,
  pesoKg: number,
): ConfiguracaoViavel | null {
  const doGuindaste = linhas.filter((l) => l.guindasteId === guindaste.id)

  let melhor: (ConfiguracaoViavel & { comprimentoLancaM: number; quadranteOuZona: Quadrante }) | null = null
  for (const linha of doGuindaste) {
    const resultado = raioMaximoParaPeso(linha.pontos, pesoKg)
    if (!resultado) continue

    // Mais econômico = menor comprimento de lança; empate desempatado pelo
    // quadrante frontal (área de operação mais comum).
    const candidato = {
      guindasteId: guindaste.id,
      comprimentoLancaM: linha.comprimentoLancaM,
      quadranteOuZona: linha.quadrante,
      raioMaximoM: resultado.raioM,
      capacidadeNaConfiguracaoKg: resultado.capacidadeKg,
    }
    if (
      !melhor ||
      candidato.comprimentoLancaM < melhor.comprimentoLancaM ||
      (candidato.comprimentoLancaM === melhor.comprimentoLancaM &&
        candidato.quadranteOuZona === 'frontal' &&
        melhor.quadranteOuZona !== 'frontal')
    ) {
      melhor = candidato
    }
  }
  return melhor
}

function melhorConfiguracaoVarianteB(
  guindaste: Guindaste,
  linhas: ReadonlyArray<TabelaCargaVarianteB>,
  pesoKg: number,
): ConfiguracaoViavel | null {
  const doGuindaste = linhas.filter((l) => l.guindasteId === guindaste.id)

  let melhor: (ConfiguracaoViavel & { anguloLancaGraus: number; quadranteOuZona: ZonaDeGiro }) | null = null
  for (const linha of doGuindaste) {
    const resultado = anguloMinimoParaPeso(linha.pontos, pesoKg)
    if (!resultado) continue

    const candidato = {
      guindasteId: guindaste.id,
      anguloLancaGraus: resultado.anguloGraus,
      quadranteOuZona: linha.zona,
      capacidadeNaConfiguracaoKg: resultado.capacidadeKg,
    }
    if (
      !melhor ||
      candidato.anguloLancaGraus < melhor.anguloLancaGraus ||
      (candidato.anguloLancaGraus === melhor.anguloLancaGraus &&
        candidato.quadranteOuZona === 'I' &&
        melhor.quadranteOuZona !== 'I')
    ) {
      melhor = candidato
    }
  }
  return melhor
}

/**
 * Zona + raio (lança principal do TM-130, Task 10.7): em cada zona, o maior
 * raio em que a capacidade ainda atende o peso; fica a zona de maior alcance.
 */
function melhorConfiguracaoZonaRaio(
  guindaste: Guindaste,
  linhas: ReadonlyArray<TabelaCargaZonaRaio>,
  pesoKg: number,
): ConfiguracaoViavel | null {
  let melhor: (ConfiguracaoViavel & { raioMaximoM: number }) | null = null
  for (const linha of linhas.filter((l) => l.guindasteId === guindaste.id)) {
    const resultado = raioMaximoParaPeso(
      linha.pontos.map((p) => ({ raioM: p.raioM, capacidadeKgf: p.capacidadeKg })),
      pesoKg,
    )
    if (!resultado) continue
    if (!melhor || resultado.raioM > melhor.raioMaximoM) {
      melhor = {
        guindasteId: guindaste.id,
        quadranteOuZona: linha.zona,
        raioMaximoM: resultado.raioM,
        capacidadeNaConfiguracaoKg: resultado.capacidadeKg,
      }
    }
  }
  return melhor
}

/**
 * RT-MC07 — varre a frota e devolve a configuração mais econômica de cada
 * guindaste capaz de içar `pesoTotalKg`, ordenada por menor guindaste
 * primeiro (RF15). Guindastes que não conseguem içar o peso em nenhuma
 * configuração (nem no melhor caso da tabela) não aparecem na lista.
 */
export function buscarConfiguracoesViaveis(
  guindastes: ReadonlyArray<Guindaste>,
  tabelas: {
    varianteA: ReadonlyArray<TabelaCargaVarianteA>
    varianteB: ReadonlyArray<TabelaCargaVarianteB>
    /** Lança principal "zona + raio" (TM-130). Quando há linhas para o guindaste, têm prioridade sobre a variante B. */
    zonaRaio?: ReadonlyArray<TabelaCargaZonaRaio>
  },
  pesoTotalKg: number,
): ConfiguracaoViavel[] {
  if (pesoTotalKg <= 0) return []

  const candidatos: { guindaste: Guindaste; config: ConfiguracaoViavel }[] = []
  for (const guindaste of guindastes) {
    const temZonaRaio = (tabelas.zonaRaio ?? []).some((l) => l.guindasteId === guindaste.id)
    const config = temZonaRaio
      ? melhorConfiguracaoZonaRaio(guindaste, tabelas.zonaRaio!, pesoTotalKg)
      : guindaste.tipoTabela === 'comprimento_raio_quadrante'
        ? melhorConfiguracaoVarianteA(guindaste, tabelas.varianteA, pesoTotalKg)
        : melhorConfiguracaoVarianteB(guindaste, tabelas.varianteB, pesoTotalKg)
    if (config) candidatos.push({ guindaste, config })
  }

  return candidatos
    .sort((a, b) => a.guindaste.capacidadeNominalKg - b.guindaste.capacidadeNominalKg)
    .map((c) => c.config)
}
