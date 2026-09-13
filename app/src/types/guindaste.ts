/**
 * Modelo de dados do simulador — espelha a seção 7 ("Modelo de dados") da
 * documentação no Notion (fonte de verdade):
 * https://app.notion.com/p/3da034f53a1280df8666fc97c0590e38
 *
 * Ver também: ../../REQUISITOS_TECNICOS.md (raiz do repo) para o detalhamento
 * de cada campo e os exemplos em JSON.
 */

/** Como a tabela de carga deste guindaste é estruturada. */
export type TipoTabela = 'comprimento_raio_quadrante' | 'zona_angulo'

export interface Guindaste {
  id: string
  nome: string
  fabricante: string
  /** Peso total do equipamento, em kg. */
  pesoTotalKg: number
  /** Altura do pé da lança, em metros — usada na correção geométrica (RF11). */
  alturaPeDaLancaM: number
  /** Recuo do pé da lança, em metros — usada na correção geométrica (RF11). */
  recuoPeDaLancaM: number
  possuiJIB: boolean
  tipoTabela: TipoTabela
}

/** Quadrante de operação — só se aplica a guindastes com tipoTabela = 'comprimento_raio_quadrante'. */
export type Quadrante = 'frontal' | 'lateral_traseira'

/** Zona de giro — só se aplica a guindastes com tipoTabela = 'zona_angulo'. */
export type ZonaDeGiro = 'I' | 'II'

/** Um ponto da tabela de carga, variante A (usada pelo MD-300L). */
export interface PontoTabelaVarianteA {
  raioM: number
  capacidadeKgf: number
}

/** Tabela de carga · variante A (comprimento + raio + quadrante) — MD-300L. */
export interface TabelaCargaVarianteA {
  guindasteId: string
  comprimentoLancaM: number
  quadrante: Quadrante
  pontos: PontoTabelaVarianteA[]
}

/** Um ponto da tabela de carga, variante B (usada pelo TM-130). */
export interface PontoTabelaVarianteB {
  anguloGraus: number
  capacidadeKg: number
}

/** Tabela de carga · variante B (zona + ângulo) — TM-130. */
export interface TabelaCargaVarianteB {
  guindasteId: string
  zona: ZonaDeGiro
  pontos: PontoTabelaVarianteB[]
}

/** Tabela de carga do JIB — opcional, só para guindastes com possuiJIB = true. */
export interface TabelaJIB {
  guindasteId: string
  comprimentoJibM: number
  anguloJibGraus: number
  quadrante: Quadrante
  pontos: PontoTabelaVarianteA[]
}

/** Entrada do usuário / estado atual da simulação. */
export interface ConfiguracaoDeIcamento {
  guindasteId: string
  /** Só para guindastes tipoTabela = 'comprimento_raio_quadrante' (ex.: MD-300L). */
  comprimentoLancaM?: number
  /**
   * Raio real de trabalho, em metros, já pronto para a tabela — opcional.
   * Só para guindastes tipoTabela = 'comprimento_raio_quadrante'. Se
   * omitido, o motor deriva esse raio a partir de `anguloLancaGraus` +
   * `comprimentoLancaM`, aplicando a correção geométrica (RF11 / Task 2.2).
   */
  raioM?: number
  /**
   * Ângulo de elevação da lança em relação à horizontal (0° = horizontal,
   * 90° = vertical) — posição visual manipulada no canvas (Épico 3).
   * Para guindastes tipoTabela = 'zona_angulo' (TM-130), é o próprio valor
   * usado na tabela. Para tipoTabela = 'comprimento_raio_quadrante'
   * (MD-300L), é opcional: se `raioM` não for informado diretamente, o
   * motor deriva o raio real a partir deste ângulo (RF11 / Task 2.2, ver
   * calcularRaioReal em engine/geometriaLanca.ts).
   */
  anguloLancaGraus?: number
  quadranteOuZona: Quadrante | ZonaDeGiro
  usaJIB: boolean
  jib?: {
    comprimentoJibM: number
    anguloJibGraus: number
  }
  cargaIcadaKg: number
  massaLingadaKg: number
  massaCaboDeAcoKg: number
  usaBalancim: boolean
  massaBalancimKg?: number
}

export type StatusCalculo = 'dentro_do_limite' | 'excede_capacidade' | 'fora_da_faixa'

/** Saída do motor de cálculo. */
export interface ResultadoDoCalculo {
  /** Capacidade máxima interpolada, já arredondada para baixo (piso de segurança) — RNF Confiabilidade. */
  capacidadeMaximaKg: number
  /** Somatório: carga içada + lingada + cabo de aço + balancim (opcional) — RF10. */
  somatorioDeCargasKg: number
  status: StatusCalculo
  /** Margem (se dentro do limite) ou excedente (se excede a capacidade), em %. */
  margemPercentual: number
}

/** Uma entrada da lista de configurações viáveis do RF15 (busca reversa por peso). */
export interface ConfiguracaoViavel {
  guindasteId: string
  comprimentoLancaM?: number
  anguloLancaGraus?: number
  quadranteOuZona: Quadrante | ZonaDeGiro
  raioMaximoM: number
  capacidadeNaConfiguracaoKg: number
}
