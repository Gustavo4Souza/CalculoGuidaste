/**
 * Critérios de giro → quadrante (MD-300L) / zona (TM-130) — RF18.
 *
 * ÚNICO lugar onde os limites angulares vivem: para trocar um critério,
 * mude só este arquivo (e a VERSAO_CRITERIO_GIRO, que vai gravada em cada
 * cenário salvo e no relatório).
 *
 * Convenção: giro em graus, visto de cima, a partir do eixo de referência
 * de cada guindaste; o critério é simétrico (vale |giro|). Cada setor vale
 * de onde o anterior termina até `ateGraus` (inclusive). Na fronteira exata
 * entre dois setores o motor avalia os dois e usa a MENOR capacidade.
 */
import type { RegiaoDeGiro } from '../types/cenario'

export interface SetorDeGiro {
  regiao: RegiaoDeGiro
  /** Limite superior de |giro| deste setor, em graus (180 = até o fim). */
  ateGraus: number
}

export interface CriterioDeGiro {
  /** Enquanto true, a interface e o relatório mostram o selo "Critério de giro provisório". */
  provisorio: boolean
  /** O que é o 0° deste guindaste. */
  referencia: string
  setores: SetorDeGiro[]
  justificativa: string
  /** Ressalva que vai para o relatório (ex.: convenção do simulador que a ficha não declara). */
  aviso?: string
}

export const VERSAO_CRITERIO_GIRO = '2026-10-06-1'

export const CRITERIOS_DE_GIRO: Record<string, CriterioDeGiro> = {
  // CONFIRMADO em 06/10/2026 (docs/documento_tecnico_MD300L_TM130.docx, item 1).
  // Base: Figuras A/B de docs/Informações gerais - içamento.xlsx (as células
  // "#VALUE!" são imagens embutidas na célula) e os mesmos desenhos na p.3
  // de docs/Tabela Guindaste MD-300L.pdf: setor FRONTAL de 110° (vértice no
  // centro de giro, simétrico ao eixo do caminhão, voltado para a cabine) e
  // setor LATERAL + TRASEIRO de 250°. 110° / 2 = ±55°.
  'MD-300L': {
    provisorio: false,
    referencia: '0° = frente do caminhão (lado da cabine)',
    setores: [
      { regiao: 'frontal', ateGraus: 55 },
      { regiao: 'lateral_traseira', ateGraus: 180 },
    ],
    justificativa:
      'Setores de 110° (frontal) e 250° (lateral/traseira) desenhados na ficha do MD-300L (p.3) e nas Figuras A/B da planilha da Ribas.',
  },
  // Da ficha (não provisório): diagrama polar da p.2 de docs/TM_130.pdf —
  // Zona I 0°~16° e Zona II 16°~60°, simétricas; giro total de 120° (±60°,
  // limite mecânico em data/especificacoes/tm-130.json). As zonas são medidas
  // a partir do 0° do PRÓPRIO diagrama, então a capacidade não depende da
  // direção do caminhão. "0° = traseira" é CONVENÇÃO DO SIMULADOR para o
  // desenho 3D: a ficha não declara (documento técnico de 06/10/2026, item 2).
  'TM-130': {
    provisorio: false,
    referencia: '0° = eixo do diagrama polar (desenhado para a traseira do caminhão — convenção do simulador)',
    setores: [
      { regiao: 'I', ateGraus: 16 },
      { regiao: 'II', ateGraus: 60 },
    ],
    justificativa: 'Zonas I (0°~16°) e II (16°~60°) do diagrama polar da ficha do TM-130 (p.2).',
    aviso:
      'TM-130: as zonas I/II são medidas a partir do 0° do diagrama polar da ficha; a ficha não indica para que lado do caminhão ' +
      'esse 0° aponta — o desenho 3D usa a traseira por convenção. Confira a orientação no equipamento antes da operação.',
  },
}
