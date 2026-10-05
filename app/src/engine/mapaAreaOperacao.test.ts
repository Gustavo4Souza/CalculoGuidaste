import { describe, expect, it } from 'vitest'
import { CATALOGO } from '../data/catalogo'
import { parametrosIniciais } from '../store/parametrosIniciais'
import type { ParametrosDoCenario } from '../types/cenario'
import { avaliarCenario } from './avaliarCenario'
import { calcularMapaAreaOperacao, statusNoPonto } from './mapaAreaOperacao'

const MD = CATALOGO['MD-300L']
const TM = CATALOGO['TM-130']

/**
 * MD-300L, lança 17,70 m, carga de 9.000 kg com cabo informado à mão (0 kg)
 * e o gancho de referência da tabela (235 kg) — somatório = 9.000 kg.
 * Tabela real (md-300l.json), coluna 17,70 m:
 *   frontal  7 m = 10.800 · 8 m = 7.500
 *   lateral  7 m = 11.900 · 8 m = 10.500
 */
function cenarioMD(alterar?: (p: ParametrosDoCenario) => void): ParametrosDoCenario {
  const p = parametrosIniciais(MD)
  p.carga.pesoKg = 9000
  p.cabo.massaSobrescritaKg = 0
  alterar?.(p)
  return p
}

describe('calcularMapaAreaOperacao — mesma função do motor, valores reais (RF22)', () => {
  const mapa = calcularMapaAreaOperacao(cenarioMD(), MD)

  it('frontal: 9.000 kg passa a 7 m (10.800 kg) e reprova a 8 m (7.500 kg)', () => {
    expect(statusNoPonto(mapa, 0, 7)).toBe('ok')
    expect(statusNoPonto(mapa, 0, 8)).toBe('nok')
  })

  it('lateral/traseira (giro 90°): 9.000 kg passa a 8 m (10.500 kg)', () => {
    expect(statusNoPonto(mapa, 90, 8)).toBe('ok')
    expect(statusNoPonto(mapa, -90, 8)).toBe('ok')
    expect(statusNoPonto(mapa, 180, 8)).toBe('ok')
  })

  it('a fronteira do setor de 110° muda a cor: a 8 m, 55° (fronteira → menor capacidade) reprova e 60° passa', () => {
    expect(statusNoPonto(mapa, 55, 8)).toBe('nok')
    expect(statusNoPonto(mapa, 60, 8)).toBe('ok')
  })

  it('cada nó é exatamente o que avaliarCenario responde naquele giro e raio (sem lógica duplicada)', () => {
    const giro = 90
    const raio = 8
    const i = mapa.giros.indexOf(giro)
    const j = mapa.raios.indexOf(raio)
    const p = cenarioMD()
    p.giroGraus = giro
    // ângulo que põe o gancho a 8 m na lança de 17,70 m: o mesmo que o cenário inicial já usa
    expect(avaliarCenario(p, MD).geometria.raioM).toBeCloseTo(raio, 6)
    expect(mapa.nos[i][j]).toBe(avaliarCenario(p, MD).status)
  })

  it('raio abaixo do primeiro ponto da tabela (3 m) é "sem dado"; além do alcance da lança é "fora de alcance"', () => {
    expect(statusNoPonto(mapa, 0, 2)).toBe('sem_dado')
    expect(mapa.raios[mapa.raios.length - 1]).toBeCloseTo(17.7 - 1.4, 6) // alcance máximo: lança deitada − recuo
    // raio mínimo com 17,70 m a 85° (máximo ≈): 17,70 × cos 85° − 1,4 ≈ 0,14 m → o centro (0 m) é inalcançável
    expect(statusNoPonto(mapa, 0, 0)).toBe('fora_de_alcance')
    expect(statusNoPonto(mapa, 0, 0.5)).toBe('sem_dado')
  })

  it('célula fica com o pior dos 4 cantos: entre 7 m (ok) e 7,5 m a 0°, a célula 7–7,5 m é ok; a 7,5–8 m é nok', () => {
    const i = mapa.giros.indexOf(0)
    const j7 = mapa.raios.indexOf(7)
    const j75 = mapa.raios.indexOf(7.5)
    // 7,5 m frontal: interpolado entre 10.800 e 7.500 → 9.150 kg ≥ 9.000 → ok
    expect(mapa.nos[i][j75]).toBe('ok')
    expect(mapa.celulas[i][j7]).toBe('ok')
    expect(mapa.celulas[i][j75]).toBe('nok')
  })

  it('sapata em extensão parcial → toda a área alcançável vira "sem dado" (regra de ouro)', () => {
    const parcial = calcularMapaAreaOperacao(
      cenarioMD((p) => {
        p.sapatas.traseira_esquerda = 2
      }),
      MD,
    )
    expect(parcial.contagem.ok + parcial.contagem.nok + parcial.contagem.atencao).toBe(0)
    expect(parcial.contagem.sem_dado).toBeGreaterThan(0)
  })

  it('TM-130: a grade cobre só o giro mecânico (±60°)', () => {
    const tm = calcularMapaAreaOperacao(parametrosIniciais(TM), TM)
    expect(tm.giros[0]).toBe(-60)
    expect(tm.giros[tm.giros.length - 1]).toBe(60)
  })

  it('desempenho: a grade padrão (5° × 0,5 m) roda rápido o bastante para recalcular ao vivo', () => {
    const t0 = performance.now()
    const m = calcularMapaAreaOperacao(cenarioMD((p) => (p.lanca.comprimentoM = 32.1)), MD)
    const ms = performance.now() - t0
    expect(m.nos.length * m.raios.length).toBeGreaterThan(4000)
    expect(ms).toBeLessThan(1500)
  })
})
