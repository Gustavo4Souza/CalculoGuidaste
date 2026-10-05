/**
 * Especificação técnica de um guindaste (Épico 10, Task 10.3) — limites
 * mecânicos, dimensões e dados de cabo/moitão lidos das fichas técnicas em
 * docs/. Cada valor numérico carrega a própria fonte, para que a interface e
 * o relatório consigam mostrar o selo "≈" em tudo o que NÃO veio das fontes
 * (regra de ouro: nenhuma dimensão é inventada sem ficar marcada).
 *
 * Os dados vivem em ../data/especificacoes/*.json.
 */

/** "aproximado" = não consta nas fontes; qualquer outro texto cita a fonte (ex.: "ficha p.2"). */
export interface ValorComFonte {
  valor: number
  fonte: string
}

export function ehAproximado(v: ValorComFonte): boolean {
  return v.fonte === 'aproximado'
}

/** Nº de pernas (passadas) do cabo que a tabela do fabricante assume para um comprimento de lança. */
export interface PernasPorComprimento {
  comprimentoLancaM: number
  pernas: number
}

/** Extensão de um par de sapatas, medida do eixo longitudinal do caminhão até o centro da sapata. */
export interface ExtensaoSapata {
  /** Única extensão com capacidade validada pelo fabricante. */
  estendidaM: ValorComFonte
  recolhidaM: ValorComFonte
}

export type TipoTabelaPrincipal = 'comprimento_raio_quadrante' | 'zona_raio_faixas'

export interface EspecificacaoGuindaste {
  guindasteId: string
  documentoFonte: string
  tipoTabelaPrincipal: TipoTabelaPrincipal

  lanca: {
    comprimentoMinM: ValorComFonte
    comprimentoMaxM: ValorComFonte
    numeroDeSecoes: ValorComFonte
    anguloMinGraus: ValorComFonte
    anguloMaxGraus: ValorComFonte
    alturaPeM: ValorComFonte
    recuoPeM: ValorComFonte
    /** Vazio quando a ficha não informa a passagem de cabo (TM-130). */
    pernasPorComprimento: PernasPorComprimento[]
  }

  jib: {
    /** Existe tabela de JIB nos dados, mas o uso pode estar desligado (TM-130). */
    habilitado: boolean
    comprimentosM: number[]
    anguloMinGraus: number
    anguloMaxGraus: number
    /** Comprimento da lança principal exigido pela tabela de JIB (null = a tabela não depende disso). */
    comprimentoLancaExigidoM: number | null
    pernas: number | null
    /** Massa do gancho do JIB já descontada pela tabela (null = a ficha não diz). */
    massaGanchoIncluidaNaTabelaKg: number | null
  }

  giro: {
    /** Meia-amplitude mecânica a partir do eixo de referência (null = giro livre de 360°). */
    limiteMecanicoGraus: number | null
  }

  sapatas: {
    dianteiras: ExtensaoSapata
    traseiras: ExtensaoSapata
  }

  cabo: {
    bitola: string
    /** Carga máxima que uma perna do cabo pode sustentar, em kg (tração do guincho / capacidade por cabo). */
    cargaMaximaPorPernaKg: ValorComFonte
  }

  moitao: {
    /** Massa do gancho principal já descontada pela tabela (null = a ficha não diz → soma-se a massa inteira). */
    massaGanchoIncluidaNaTabelaKg: number | null
    /** Distância mínima vertical entre a ponta da lança e o gancho (bloco do moitão + folga). */
    distanciaMinimaPontaAoGanchoM: ValorComFonte
  }

  /** Dimensões gerais para o desenho 3D (Épico 13). Chaves livres, sempre em metros. */
  dimensoes: Record<string, ValorComFonte>

  /** Notas da ficha que vão para o relatório. */
  notas: string[]
}
