import type {
  ConfiguracaoDeIcamento,
  Guindaste,
  Quadrante,
  ResultadoDoCalculo,
  TabelaCargaVarianteA,
  TabelaCargaVarianteB,
  TabelaJIB,
  ZonaDeGiro,
} from '../types/guindaste'
import { calcularRaioReal } from './geometriaLanca'
import {
  capacidadeJIBDetalhada,
  capacidadeVarianteADetalhada,
  capacidadeVarianteBDetalhada,
  type CapacidadeDetalhada,
} from './capacidadeDetalhada'

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
 * Delega para `capacidadeVarianteADetalhada` (./capacidadeDetalhada.ts),
 * que também devolve os pontos usados e o motivo quando não há dado.
 */
export function calcularCapacidadeMaximaVarianteA(
  linhas: ReadonlyArray<TabelaCargaVarianteA>,
  comprimentoLancaM: number,
  raioM: number,
  quadrante: Quadrante,
): CapacidadeInterpolada {
  return paraInterpolada(capacidadeVarianteADetalhada(linhas, comprimentoLancaM, raioM, quadrante))
}

/**
 * Variante B (zona + ângulo). As zonas (I / II) são regiões discretas de
 * operação, não um contínuo — não se interpola "entre zonas". Só o ângulo
 * da lança é interpolado, dentro da zona escolhida.
 *
 * Atenção (Épico 10): pela legenda da ficha do TM-130, a tabela zona×ângulo
 * é a "Com sapata para lança JIB" — ver data/tabelas/README.md.
 */
export function calcularCapacidadeMaximaVarianteB(
  linhas: ReadonlyArray<TabelaCargaVarianteB>,
  anguloGraus: number,
  zona: ZonaDeGiro,
): CapacidadeInterpolada {
  return paraInterpolada(capacidadeVarianteBDetalhada(linhas, anguloGraus, zona, 'Zona × ângulo'))
}

/**
 * JIB opcional (RF12) — só para guindastes com `possuiJIB = true`.
 * Comprimento do JIB é discreto; o ângulo do JIB entre dois valores
 * tabelados é interpolado (decisão de 05/10/2026, Épico 10) — ver
 * `capacidadeJIBDetalhada`.
 */
export function calcularCapacidadeMaximaJIB(
  linhas: ReadonlyArray<TabelaJIB>,
  comprimentoJibM: number,
  anguloJibGraus: number,
  raioM: number,
  quadrante: Quadrante,
): CapacidadeInterpolada {
  return paraInterpolada(capacidadeJIBDetalhada(linhas, comprimentoJibM, anguloJibGraus, raioM, quadrante))
}

function paraInterpolada(d: CapacidadeDetalhada): CapacidadeInterpolada {
  return { capacidadeKg: d.capacidadeKg, foraDaFaixa: d.capacidadeKg === null }
}

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
 * ver Épicos/Épico 01 na raiz do repo.
 */
export function calcularCapacidadeMaxima(
  guindaste: Guindaste,
  configuracao: ConfiguracaoDeIcamento,
  tabelas: {
    varianteA?: ReadonlyArray<TabelaCargaVarianteA>
    varianteB?: ReadonlyArray<TabelaCargaVarianteB>
    jib?: ReadonlyArray<TabelaJIB>
  },
): ResultadoDoCalculo {
  let interpolado: CapacidadeInterpolada

  if (configuracao.usaJIB) {
    if (!guindaste.possuiJIB) {
      throw new Error(`${guindaste.id} não possui JIB (possuiJIB = false) — RF12.`)
    }
    if (!configuracao.jib || configuracao.raioM === undefined) {
      throw new Error('Com usaJIB = true, é preciso informar configuracao.jib (comprimentoJibM + anguloJibGraus) e configuracao.raioM.')
    }
    interpolado = calcularCapacidadeMaximaJIB(
      tabelas.jib ?? [],
      configuracao.jib.comprimentoJibM,
      configuracao.jib.anguloJibGraus,
      configuracao.raioM,
      configuracao.quadranteOuZona as Quadrante,
    )
  } else if (guindaste.tipoTabela === 'comprimento_raio_quadrante') {
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
