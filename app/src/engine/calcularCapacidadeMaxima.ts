import type {
  ConfiguracaoDeIcamento,
  Guindaste,
  Quadrante,
  ResultadoDoCalculo,
  TabelaCargaVarianteA,
  TabelaCargaVarianteB,
  ZonaDeGiro,
} from '../types/guindaste'
import { calcularRaioReal } from './geometriaLanca'
import { arredondarParaBaixo, interpolarLinear } from './interpolacao'

export interface CapacidadeInterpolada {
  capacidadeKg: number | null
  foraDaFaixa: boolean
}

/**
 * Variante A (comprimento + raio + quadrante) — usada pelo MD-300L.
 *
 * Interpola por raio dentro de um comprimento de lança; se o comprimento
 * alvo não bate exatamente com nenhuma linha da tabela, faz uma segunda
 * interpolação (bilinear) entre os dois comprimentos mais próximos.
 *
 * Ponto de atenção (corrigido a partir de um bug encontrado no POC): em
 * t≈0 ou t≈1 (comprimento exato de um dos dois lados), só o "foraDaFaixa"
 * do lado relevante deve invalidar o resultado — não o dos dois lados.
 */
export function calcularCapacidadeMaximaVarianteA(
  linhas: ReadonlyArray<TabelaCargaVarianteA>,
  comprimentoLancaM: number,
  raioM: number,
  quadrante: Quadrante,
): CapacidadeInterpolada {
  const doQuadrante = linhas.filter((l) => l.quadrante === quadrante)
  if (doQuadrante.length === 0) {
    return { capacidadeKg: null, foraDaFaixa: true }
  }

  const comprimentos = [...new Set(doQuadrante.map((l) => l.comprimentoLancaM))].sort(
    (a, b) => a - b,
  )

  if (comprimentoLancaM < comprimentos[0] || comprimentoLancaM > comprimentos[comprimentos.length - 1]) {
    return { capacidadeKg: null, foraDaFaixa: true }
  }

  const interpolarRaioNoComprimento = (comprimento: number): ResultadoInterpolacaoLocal => {
    const linha = doQuadrante.find((l) => l.comprimentoLancaM === comprimento)!
    const pontos = linha.pontos.map((p) => ({ chave: p.raioM, valor: p.capacidadeKgf }))
    return interpolarLinear(pontos, raioM)
  }

  const comprimentoExato = comprimentos.find((c) => Math.abs(c - comprimentoLancaM) < 1e-9)
  if (comprimentoExato !== undefined) {
    const r = interpolarRaioNoComprimento(comprimentoExato)
    return { capacidadeKg: r.valor === null ? null : arredondarParaBaixo(r.valor), foraDaFaixa: r.foraDaFaixa }
  }

  let lo = comprimentos[0]
  let hi = comprimentos[comprimentos.length - 1]
  for (let i = 0; i < comprimentos.length - 1; i++) {
    if (comprimentoLancaM >= comprimentos[i] && comprimentoLancaM <= comprimentos[i + 1]) {
      lo = comprimentos[i]
      hi = comprimentos[i + 1]
      break
    }
  }

  const t = (comprimentoLancaM - lo) / (hi - lo)
  const rLo = interpolarRaioNoComprimento(lo)
  const rHi = interpolarRaioNoComprimento(hi)

  if (t <= 1e-9) {
    return { capacidadeKg: rLo.valor === null ? null : arredondarParaBaixo(rLo.valor), foraDaFaixa: rLo.foraDaFaixa }
  }
  if (t >= 1 - 1e-9) {
    return { capacidadeKg: rHi.valor === null ? null : arredondarParaBaixo(rHi.valor), foraDaFaixa: rHi.foraDaFaixa }
  }
  if (rLo.foraDaFaixa || rHi.foraDaFaixa || rLo.valor === null || rHi.valor === null) {
    return { capacidadeKg: null, foraDaFaixa: true }
  }

  const valor = rLo.valor + t * (rHi.valor - rLo.valor)
  return { capacidadeKg: arredondarParaBaixo(valor), foraDaFaixa: false }
}

/**
 * Variante B (zona + ângulo) — usada pelo TM-130.
 *
 * As zonas (I / II) são regiões discretas de operação, não um contínuo —
 * não se interpola "entre zonas". Só o ângulo da lança é interpolado,
 * dentro da zona escolhida.
 */
export function calcularCapacidadeMaximaVarianteB(
  linhas: ReadonlyArray<TabelaCargaVarianteB>,
  anguloGraus: number,
  zona: ZonaDeGiro,
): CapacidadeInterpolada {
  const linha = linhas.find((l) => l.zona === zona)
  if (!linha) {
    return { capacidadeKg: null, foraDaFaixa: true }
  }

  const pontos = linha.pontos.map((p) => ({ chave: p.anguloGraus, valor: p.capacidadeKg }))
  const r = interpolarLinear(pontos, anguloGraus)
  return { capacidadeKg: r.valor === null ? null : arredondarParaBaixo(r.valor), foraDaFaixa: r.foraDaFaixa }
}

type ResultadoInterpolacaoLocal = ReturnType<typeof interpolarLinear>

/** RF09/RF10 — soma tudo que precisa ser suportado pelo guindaste, nunca só a carga isolada. */
export function calcularSomatorioDeCargas(configuracao: ConfiguracaoDeIcamento): number {
  const balancim = configuracao.usaBalancim ? configuracao.massaBalancimKg ?? 0 : 0
  return (
    configuracao.cargaIcadaKg +
    configuracao.massaLingadaKg +
    configuracao.massaCaboDeAcoKg +
    balancim
  )
}

/**
 * Ponto de entrada único do motor de cálculo (RT-MC01): despacha para a
 * implementação correta conforme `guindaste.tipoTabela`, aplica o somatório
 * de cargas (RF10) e classifica o resultado.
 *
 * `tabelaVarianteA`/`tabelaVarianteB`: passe a tabela já carregada
 * correspondente ao guindaste (ver src/data/tabelas/). Ainda incompletas —
 * ver Épico 1 no ROADMAP.md da raiz do repo.
 */
export function calcularCapacidadeMaxima(
  guindaste: Guindaste,
  configuracao: ConfiguracaoDeIcamento,
  tabelas: {
    varianteA?: ReadonlyArray<TabelaCargaVarianteA>
    varianteB?: ReadonlyArray<TabelaCargaVarianteB>
  },
): ResultadoDoCalculo {
  let interpolado: CapacidadeInterpolada

  if (guindaste.tipoTabela === 'comprimento_raio_quadrante') {
    if (configuracao.comprimentoLancaM === undefined) {
      throw new Error('comprimentoLancaM é obrigatório para guindastes do tipo comprimento_raio_quadrante')
    }
    interpolado = calcularCapacidadeMaximaVarianteA(
      tabelas.varianteA ?? [],
      configuracao.comprimentoLancaM,
      raioDaConfiguracao(guindaste, configuracao),
      configuracao.quadranteOuZona as Quadrante,
    )
  } else {
    if (configuracao.anguloLancaGraus === undefined) {
      throw new Error('anguloLancaGraus é obrigatório para guindastes do tipo zona_angulo')
    }
    interpolado = calcularCapacidadeMaximaVarianteB(
      tabelas.varianteB ?? [],
      configuracao.anguloLancaGraus,
      configuracao.quadranteOuZona as ZonaDeGiro,
    )
  }

  const somatorio = calcularSomatorioDeCargas(configuracao)

  if (interpolado.foraDaFaixa || interpolado.capacidadeKg === null) {
    return {
      capacidadeMaximaKg: 0,
      somatorioDeCargasKg: somatorio,
      status: 'fora_da_faixa',
      margemPercentual: 0,
    }
  }

  const capacidade = interpolado.capacidadeKg
  const margem = capacidade === 0 ? 0 : ((capacidade - somatorio) / capacidade) * 100

  return {
    capacidadeMaximaKg: capacidade,
    somatorioDeCargasKg: somatorio,
    status: somatorio <= capacidade ? 'dentro_do_limite' : 'excede_capacidade',
    margemPercentual: margem,
  }
}

/**
 * RF11 / Task 2.2 — raio real de trabalho para a variante A.
 *
 * Se `configuracao.raioM` já vier pronto (ex.: campo numérico digitado
 * diretamente, ou testes com valores exatos da tabela), usa ele direto.
 * Caso contrário, deriva o raio a partir da posição visual da lança
 * (`comprimentoLancaM` + `anguloLancaGraus`) e da geometria do pé da lança
 * do guindaste (`calcularRaioReal`, ver ./geometriaLanca.ts) — é isso que o
 * canvas arrastável do Épico 3 vai alimentar.
 */
function raioDaConfiguracao(guindaste: Guindaste, configuracao: ConfiguracaoDeIcamento): number {
  if (configuracao.raioM !== undefined) {
    return configuracao.raioM
  }
  if (configuracao.comprimentoLancaM !== undefined && configuracao.anguloLancaGraus !== undefined) {
    return calcularRaioReal(guindaste, configuracao.comprimentoLancaM, configuracao.anguloLancaGraus)
  }
  throw new Error(
    'É preciso informar configuracao.raioM, ou comprimentoLancaM + anguloLancaGraus para aplicar a correção geométrica (RF11).',
  )
}
