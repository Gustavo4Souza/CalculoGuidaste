import { describe, expect, it } from 'vitest'
import guindastes from '../data/guindastes.json'
import tabelaMD300L from '../data/tabelas/md-300l.json'
import type { ConfiguracaoDeIcamento, Guindaste, TabelaCargaVarianteA } from '../types/guindaste'
import { calcularCapacidadeMaxima } from './calcularCapacidadeMaxima'

const md300l = (guindastes as Guindaste[]).find((g) => g.id === 'MD-300L')!
const tabelaA = tabelaMD300L as TabelaCargaVarianteA[]

function configuracaoBase(overrides: Partial<ConfiguracaoDeIcamento>): ConfiguracaoDeIcamento {
  return {
    guindasteId: md300l.id,
    quadranteOuZona: 'frontal',
    usaJIB: false,
    cargaIcadaKg: 0,
    massaLingadaKg: 0,
    massaCaboDeAcoKg: 0,
    usaBalancim: false,
    ...overrides,
  }
}

describe('calcularCapacidadeMaxima — MD-300L (variante A)', () => {
  it('retorna exatamente o valor tabelado na área frontal (comprimento 14.10m, raio 4.00m → 20000 kgf)', () => {
    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({ comprimentoLancaM: 14.1, raioM: 4.0, quadranteOuZona: 'frontal', cargaIcadaKg: 15000 }),
      { varianteA: tabelaA },
    )

    expect(resultado.capacidadeMaximaKg).toBe(20000)
    expect(resultado.status).toBe('dentro_do_limite')
  })

  it('retorna exatamente o valor tabelado na área lateral/traseira (mesma configuração)', () => {
    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({ comprimentoLancaM: 14.1, raioM: 4.0, quadranteOuZona: 'lateral_traseira' }),
      { varianteA: tabelaA },
    )

    expect(resultado.capacidadeMaximaKg).toBe(20000)
  })

  it('aplica o somatório de cargas (RF10), não só a carga isolada', () => {
    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({
        comprimentoLancaM: 14.1,
        raioM: 4.0,
        quadranteOuZona: 'frontal',
        cargaIcadaKg: 18000,
        massaLingadaKg: 1500,
        massaCaboDeAcoKg: 300,
        usaBalancim: true,
        massaBalancimKg: 400,
      }),
      { varianteA: tabelaA },
    )

    // 18000 + 1500 + 300 + 400 = 20200 > 20000 (capacidade frontal)
    expect(resultado.somatorioDeCargasKg).toBe(20200)
    expect(resultado.status).toBe('excede_capacidade')
  })

  it('sinaliza fora_da_faixa para um raio fora da tabela disponível', () => {
    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({ comprimentoLancaM: 14.1, raioM: 999, quadranteOuZona: 'frontal' }),
      { varianteA: tabelaA },
    )

    expect(resultado.status).toBe('fora_da_faixa')
  })

  it('deriva o raio a partir do ângulo de elevação (RF11 / Task 2.2) quando raioM não é informado', () => {
    // Ângulo que, para lança de 14,10m com recuo do MD-300L (1,4m), resulta
    // exatamente no raio tabelado (4,00m): comprimento·cos(ângulo) - recuo = 4,00
    const anguloGraus = (Math.acos((4.0 + md300l.recuoPeDaLancaM) / 14.1) * 180) / Math.PI

    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({ comprimentoLancaM: 14.1, anguloLancaGraus: anguloGraus, quadranteOuZona: 'frontal' }),
      { varianteA: tabelaA },
    )

    expect(resultado.capacidadeMaximaKg).toBe(20000)
  })

  it('lança erro quando nem raioM nem anguloLancaGraus são informados', () => {
    expect(() =>
      calcularCapacidadeMaxima(
        md300l,
        configuracaoBase({ comprimentoLancaM: 14.1, quadranteOuZona: 'frontal' }),
        { varianteA: tabelaA },
      ),
    ).toThrow()
  })

  // Mais pontos exatos da tabela completa (Task 1.1, digitalizada a partir de
  // docs/Tabelas_Extraidas_Guindaste.xlsx) — cobre o critério de aceite do
  // BACKLOG.md ("validadas manualmente contra pelo menos 3 pontos de cada
  // tabela impressa"), além dos 2 já testados acima (14,10m/6,00m).
  it.each([
    { comprimentoLancaM: 10.5, raioM: 3, quadrante: 'frontal' as const, esperadoKgf: 30000 },
    { comprimentoLancaM: 21.3, raioM: 18, quadrante: 'frontal' as const, esperadoKgf: 300 },
    { comprimentoLancaM: 32.1, raioM: 22, quadrante: 'frontal' as const, esperadoKgf: 300 },
    { comprimentoLancaM: 17.7, raioM: 5, quadrante: 'lateral_traseira' as const, esperadoKgf: 16000 },
    { comprimentoLancaM: 28.5, raioM: 24, quadrante: 'lateral_traseira' as const, esperadoKgf: 1100 },
  ])(
    'ponto exato $quadrante — comprimento $comprimentoLancaM m, raio $raioM m → $esperadoKgf kgf',
    ({ comprimentoLancaM, raioM, quadrante, esperadoKgf }) => {
      const resultado = calcularCapacidadeMaxima(
        md300l,
        configuracaoBase({ comprimentoLancaM, raioM, quadranteOuZona: quadrante }),
        { varianteA: tabelaA },
      )

      expect(resultado.capacidadeMaximaKg).toBe(esperadoKgf)
    },
  )
})
