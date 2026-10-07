/**
 * Cenário de operação 100% parametrizável (Épico 10, RF16) — um conjunto
 * completo de parâmetros que reproduz a configuração real em que a operação
 * será executada, e o resultado detalhado que o motor devolve para ele
 * (RF17: estado "sem dado do fabricante" próprio, diferente de OK/NOK).
 */
import type { Quadrante, ZonaDeGiro } from './guindaste'

export type PosicaoSapata =
  | 'dianteira_esquerda'
  | 'dianteira_direita'
  | 'traseira_esquerda'
  | 'traseira_direita'

export const POSICOES_SAPATA: readonly PosicaoSapata[] = [
  'dianteira_esquerda',
  'dianteira_direita',
  'traseira_esquerda',
  'traseira_direita',
]

export interface ParametrosDoCenario {
  guindasteId: string

  lanca: {
    comprimentoM: number
    /** Elevação em relação à horizontal (0° = deitada, 90° = vertical). */
    anguloGraus: number
  }

  /**
   * Giro da superestrutura, em graus, visto de cima, a partir do eixo de
   * referência do guindaste (ver config/criteriosDeGiro.ts). Qualquer valor
   * é aceito pelo motor — é normalizado para (-180°, 180°].
   */
  giroGraus: number

  jib: {
    ativo: boolean
    comprimentoM: number
    /** Ângulo (offset) do JIB em relação à lança principal, para baixo. */
    anguloGraus: number
  }

  /** Extensão de cada sapata: distância do eixo do caminhão ao centro da sapata, em m. */
  sapatas: Record<PosicaoSapata, number>

  cabo: {
    /** null = não informado (a ficha do TM-130 não traz a passagem de cabo) → "sem dado". */
    numeroDePernas: number | null
    /** Massa linear do cabo de içamento, kg/m — não consta nas fichas; null = não informada. */
    massaLinearKgM: number | null
    /** Sobrescrita manual da massa do cabo de içamento (null = usar o cálculo automático). */
    massaSobrescritaKg: number | null
  }

  moitao: {
    /** Massa do moitão/gancho em uso (null = não informada). */
    massaKg: number | null
  }

  carga: {
    descricao: string
    pesoKg: number
    comprimentoM: number
    larguraM: number
    alturaM: number
    /** Posição do centro de gravidade em relação ao centro geométrico da carga, em m. */
    centroDeGravidade: { dx: number; dy: number; dz: number }
  }

  acessorios: {
    massaLingadaKg: number
    /** Distância vertical do gancho até o topo da carga (lingada + balancim), em m. */
    alturaLingadaM: number
    usaBalancim: boolean
    massaBalancimKg: number
  }

  /** Altura (do solo) em que a base da carga precisa chegar; null = não verificar. */
  alturaIcamentoNecessariaM: number | null

  /** Limite de utilização definido pelo engenheiro, em % da capacidade da tabela (ex.: 85). */
  limiteUtilizacaoPercentual: number

  /** Só informativos (não há dado nas fichas para verificação) — vão para o relatório. */
  ambiente: {
    ventoMaximoMS: number | null
    pressaoAdmissivelSoloKgfCm2: number | null
  }
}

export type StatusDoCenario = 'ok' | 'atencao' | 'nok' | 'sem_dado'

export type RegiaoDeGiro = Quadrante | ZonaDeGiro

export type OrigemCapacidade = 'exato' | 'interpolado' | 'faixa'

/** Um ponto real da tabela do fabricante usado no cálculo (para o relatório). */
export interface PontoUsado {
  tabela: string
  chaves: Record<string, number | string>
  capacidadeKg: number
}

export interface ItemDoSomatorio {
  descricao: string
  massaKg: number
  origem: 'informado' | 'calculado' | 'sobrescrito'
}

export interface Verificacao {
  id: 'capacidade' | 'limite_engenheiro' | 'altura_icamento' | 'carga_por_perna'
  descricao: string
  aprovada: boolean
  detalhe: string
}

export interface GeometriaDoCenario {
  /** Raio de trabalho, do centro de giro ao gancho (horizontal), em m. */
  raioM: number
  /** Altura da ponta (lança ou JIB) em relação ao solo, em m. */
  alturaPontaM: number
  /** Altura do gancho com a carga apoiada no solo (pior caso de cabo pendente), em m. */
  alturaGanchoNoSoloM: number
  /** Comprimento de cabo pendurado por perna com a carga no solo, em m. */
  comprimentoCaboPendenteM: number
}

export interface AvaliacaoDoCenario {
  status: StatusDoCenario
  geometria: GeometriaDoCenario
  giro: {
    normalizadoGraus: number
    /** Uma região normalmente; duas na fronteira exata (vale a de menor capacidade). */
    regioes: RegiaoDeGiro[]
    criterioProvisorio: boolean
  }
  capacidade: {
    capacidadeKg: number | null
    origem: OrigemCapacidade | null
    pontosUsados: PontoUsado[]
    /** Região cuja tabela definiu a capacidade (relevante na fronteira). */
    regiao: RegiaoDeGiro | null
  }
  somatorio: {
    itens: ItemDoSomatorio[]
    totalKg: number
  }
  /** Somatório ÷ capacidade × 100 (null quando não há capacidade validada). */
  percentualUtilizacao: number | null
  verificacoes: Verificacao[]
  /** Por que a capacidade não pode ser validada (RF17) — vazio quando há dado. */
  motivosSemDado: string[]
}
