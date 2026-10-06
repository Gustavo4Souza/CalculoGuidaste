/**
 * Capacidade da tabela do fabricante com rastreabilidade (Épico 10, RF17):
 * além do valor, devolve se ele é exato ou interpolado, QUAIS pontos reais
 * da tabela foram usados (vão para o relatório) e, quando a combinação não
 * é coberta pela tabela, o motivo — nunca um valor inventado.
 *
 * Regras de segurança mantidas: interpolação linear só entre pontos reais e
 * arredondamento para baixo (RT-MC05) aplicado UMA vez, no valor final.
 */
import type { OrigemCapacidade, PontoUsado } from '../types/cenario'
import type {
  Quadrante,
  TabelaCargaVarianteA,
  TabelaCargaVarianteB,
  TabelaCargaZonaRaio,
  TabelaJIB,
  ZonaDeGiro,
} from '../types/guindaste'
import {
  arredondarParaBaixo,
  interpolarComDetalhe,
  TOLERANCIA_PONTO_EXATO,
  type ResultadoInterpolacaoDetalhado,
} from './interpolacao'
import { formatarNumero } from './texto'

export interface CapacidadeDetalhada {
  capacidadeKg: number | null
  origem: OrigemCapacidade | null
  pontosUsados: PontoUsado[]
  /** Preenchido quando capacidadeKg = null: por que a tabela não cobre esta combinação. */
  motivoSemDado: string | null
}

function semDado(motivo: string): CapacidadeDetalhada {
  return { capacidadeKg: null, origem: null, pontosUsados: [], motivoSemDado: motivo }
}

function iguais(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCIA_PONTO_EXATO
}

/** Acha os dois valores da lista (ordenada) que cercam `alvo`, ou o exato. */
function cercar(valores: readonly number[], alvo: number): { exato: number } | { lo: number; hi: number; t: number } | null {
  const exato = valores.find((v) => iguais(v, alvo))
  if (exato !== undefined) return { exato }
  for (let i = 0; i < valores.length - 1; i++) {
    if (alvo > valores[i] && alvo < valores[i + 1]) {
      return { lo: valores[i], hi: valores[i + 1], t: (alvo - valores[i]) / (valores[i + 1] - valores[i]) }
    }
  }
  return null
}

function combinar(
  partes: { interp: ResultadoInterpolacaoDetalhado; peso: number; chavesFixas: Record<string, number | string>; chaveRaio: string }[],
  tabela: string,
): CapacidadeDetalhada {
  let valor = 0
  let exato = true
  const pontosUsados: PontoUsado[] = []
  for (const p of partes) {
    valor += p.peso * (p.interp.valor as number)
    exato = exato && p.interp.exato
    for (const v of p.interp.vizinhos) {
      pontosUsados.push({ tabela, chaves: { ...p.chavesFixas, [p.chaveRaio]: v.chave }, capacidadeKg: v.valor })
    }
  }
  const origem: OrigemCapacidade = exato && partes.length === 1 ? 'exato' : 'interpolado'
  return { capacidadeKg: arredondarParaBaixo(valor), origem, pontosUsados, motivoSemDado: null }
}

/**
 * Variante A (comprimento de lança + raio + quadrante) — MD-300L.
 * Comprimento entre duas colunas → interpolação bilinear (decisão do Épico 8).
 */
export function capacidadeVarianteADetalhada(
  linhas: ReadonlyArray<TabelaCargaVarianteA>,
  comprimentoLancaM: number,
  raioM: number,
  quadrante: Quadrante,
): CapacidadeDetalhada {
  const doQuadrante = linhas.filter((l) => l.quadrante === quadrante)
  const tabela = `Lança principal — ${rotuloRegiao(quadrante)}`
  if (doQuadrante.length === 0) return semDado(`Não há tabela para a área ${rotuloRegiao(quadrante)}.`)

  const comprimentos = [...new Set(doQuadrante.map((l) => l.comprimentoLancaM))].sort((a, b) => a - b)
  const posicao = cercar(comprimentos, comprimentoLancaM)
  if (!posicao) {
    return semDado(
      `Comprimento de lança ${formatarNumero(comprimentoLancaM)} m fora das colunas da tabela ` +
        `(${formatarNumero(comprimentos[0])}–${formatarNumero(comprimentos[comprimentos.length - 1])} m).`,
    )
  }

  const noComprimento = (comprimento: number) => {
    const linha = doQuadrante.find((l) => iguais(l.comprimentoLancaM, comprimento))!
    return interpolarComDetalhe(
      linha.pontos.map((p) => ({ chave: p.raioM, valor: p.capacidadeKgf })),
      raioM,
    )
  }
  const semCelula = (comprimento: number) =>
    `Raio ${formatarNumero(raioM)} m sem célula na coluna ${formatarNumero(comprimento)} m (${rotuloRegiao(quadrante)}).`

  if ('exato' in posicao) {
    const r = noComprimento(posicao.exato)
    if (r.foraDaFaixa) return semDado(semCelula(posicao.exato))
    return combinar([{ interp: r, peso: 1, chavesFixas: { comprimentoLancaM: posicao.exato }, chaveRaio: 'raioM' }], tabela)
  }

  const rLo = noComprimento(posicao.lo)
  const rHi = noComprimento(posicao.hi)
  if (rLo.foraDaFaixa) return semDado(semCelula(posicao.lo))
  if (rHi.foraDaFaixa) return semDado(semCelula(posicao.hi))
  return combinar(
    [
      { interp: rLo, peso: 1 - posicao.t, chavesFixas: { comprimentoLancaM: posicao.lo }, chaveRaio: 'raioM' },
      { interp: rHi, peso: posicao.t, chavesFixas: { comprimentoLancaM: posicao.hi }, chaveRaio: 'raioM' },
    ],
    tabela,
  )
}

/**
 * JIB (RF12) — comprimento do JIB é discreto (seções montadas: só os valores
 * tabelados); o ângulo (offset) entre dois valores tabelados é interpolado
 * entre as duas tabelas vizinhas, no mesmo raio (decisão do Gustavo,
 * 05/10/2026). Fora do intervalo de offsets tabelados → sem dado.
 */
export function capacidadeJIBDetalhada(
  linhas: ReadonlyArray<TabelaJIB>,
  comprimentoJibM: number,
  anguloJibGraus: number,
  raioM: number,
  quadrante: Quadrante,
): CapacidadeDetalhada {
  const doQuadrante = linhas.filter((l) => l.quadrante === quadrante)
  const comprimentosJib = [...new Set(doQuadrante.map((l) => l.comprimentoJibM))].sort((a, b) => a - b)
  const doComprimento = doQuadrante.filter((l) => iguais(l.comprimentoJibM, comprimentoJibM))
  if (doComprimento.length === 0) {
    return semDado(
      `JIB de ${formatarNumero(comprimentoJibM)} m não existe na tabela ` +
        `(${comprimentosJib.map((c) => formatarNumero(c, 1)).join(' / ')} m).`,
    )
  }

  const angulos = [...new Set(doComprimento.map((l) => l.anguloJibGraus))].sort((a, b) => a - b)
  const posicao = cercar(angulos, anguloJibGraus)
  if (!posicao) {
    return semDado(
      `Ângulo do JIB ${formatarNumero(anguloJibGraus, 1)}° fora dos ângulos tabelados ` +
        `(${angulos[0]}°–${angulos[angulos.length - 1]}°).`,
    )
  }

  const tabela = `JIB ${formatarNumero(comprimentoJibM, 1)} m — ${rotuloRegiao(quadrante)}`
  const noAngulo = (angulo: number) => {
    const linha = doComprimento.find((l) => iguais(l.anguloJibGraus, angulo))!
    return interpolarComDetalhe(
      linha.pontos.map((p) => ({ chave: p.raioM, valor: p.capacidadeKgf })),
      raioM,
    )
  }
  const semCelula = (angulo: number) =>
    `Raio ${formatarNumero(raioM)} m sem célula na tabela do JIB ${formatarNumero(comprimentoJibM, 1)} m a ${angulo}° (${rotuloRegiao(quadrante)}).`

  if ('exato' in posicao) {
    const r = noAngulo(posicao.exato)
    if (r.foraDaFaixa) return semDado(semCelula(posicao.exato))
    return combinar([{ interp: r, peso: 1, chavesFixas: { anguloJibGraus: posicao.exato }, chaveRaio: 'raioM' }], tabela)
  }

  const rLo = noAngulo(posicao.lo)
  const rHi = noAngulo(posicao.hi)
  if (rLo.foraDaFaixa) return semDado(semCelula(posicao.lo))
  if (rHi.foraDaFaixa) return semDado(semCelula(posicao.hi))
  return combinar(
    [
      { interp: rLo, peso: 1 - posicao.t, chavesFixas: { anguloJibGraus: posicao.lo }, chaveRaio: 'raioM' },
      { interp: rHi, peso: posicao.t, chavesFixas: { anguloJibGraus: posicao.hi }, chaveRaio: 'raioM' },
    ],
    tabela,
  )
}

/**
 * Zona de giro + raio — lança principal do TM-130 (diagrama polar da ficha).
 * Um valor por raio; entre dois raios, interpolação arredondada para baixo;
 * fora dos raios da zona → sem dado. Não se interpola entre zonas.
 */
export function capacidadeZonaRaioDetalhada(
  linhas: ReadonlyArray<TabelaCargaZonaRaio>,
  raioM: number,
  zona: ZonaDeGiro,
): CapacidadeDetalhada {
  const linha = linhas.find((l) => l.zona === zona)
  if (!linha) return semDado(`Não há tabela para a ${rotuloRegiao(zona)}.`)
  const r = interpolarComDetalhe(
    linha.pontos.map((p) => ({ chave: p.raioM, valor: p.capacidadeKg })),
    raioM,
  )
  if (r.foraDaFaixa) {
    const raios = linha.pontos.map((p) => p.raioM)
    return semDado(
      `Raio ${formatarNumero(raioM)} m fora da tabela da ${rotuloRegiao(zona)} ` +
        `(${formatarNumero(Math.min(...raios))}–${formatarNumero(Math.max(...raios))} m).`,
    )
  }
  return combinar([{ interp: r, peso: 1, chavesFixas: { zona }, chaveRaio: 'raioM' }], `Lança principal — ${rotuloRegiao(zona)}`)
}

/** Variante B (zona + ângulo da lança) — hoje só a tabela de JIB do TM-130. */
export function capacidadeVarianteBDetalhada(
  linhas: ReadonlyArray<TabelaCargaVarianteB>,
  anguloLancaGraus: number,
  zona: ZonaDeGiro,
  nomeTabela: string,
): CapacidadeDetalhada {
  const linha = linhas.find((l) => l.zona === zona)
  if (!linha) return semDado(`Não há tabela para a ${rotuloRegiao(zona)}.`)
  const r = interpolarComDetalhe(
    linha.pontos.map((p) => ({ chave: p.anguloGraus, valor: p.capacidadeKg })),
    anguloLancaGraus,
  )
  if (r.foraDaFaixa) {
    return semDado(`Ângulo da lança ${formatarNumero(anguloLancaGraus, 1)}° fora da tabela (${rotuloRegiao(zona)}).`)
  }
  return combinar(
    [{ interp: r, peso: 1, chavesFixas: { zona }, chaveRaio: 'anguloLancaGraus' }],
    `${nomeTabela} — ${rotuloRegiao(zona)}`,
  )
}

export function rotuloRegiao(regiao: Quadrante | ZonaDeGiro): string {
  switch (regiao) {
    case 'frontal':
      return 'área frontal'
    case 'lateral_traseira':
      return 'áreas lateral e traseira'
    case 'I':
      return 'Zona I'
    case 'II':
      return 'Zona II'
  }
}
