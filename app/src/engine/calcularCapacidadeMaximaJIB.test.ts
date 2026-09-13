import { describe, expect, it } from 'vitest'
import guindastes from '../data/guindastes.json'
import tabelaJIB from '../data/tabelas/md-300l-jib.json'
import type { ConfiguracaoDeIcamento, Guindaste, TabelaJIB } from '../types/guindaste'
import { calcularCapacidadeMaxima } from './calcularCapacidadeMaxima'

const md300l = (guindastes as Guindaste[]).find((g) => g.id === 'MD-300L')!
const tm130 = (guindastes as Guindaste[]).find((g) => g.id === 'TM-130')!
const tabelaJib = tabelaJIB as TabelaJIB[]

function configuracaoBase(overrides: Partial<ConfiguracaoDeIcamento>): ConfiguracaoDeIcamento {
  return {
    guindasteId: md300l.id,
    quadranteOuZona: 'frontal',
    usaJIB: true,
    cargaIcadaKg: 0,
    massaLingadaKg: 0,
    massaCaboDeAcoKg: 0,
    usaBalancim: false,
    ...overrides,
  }
}

describe('calcularCapacidadeMaxima — JIB opcional (RF12)', () => {
  it('retorna exatamente o valor tabelado (JIB 9,0m a 10°, raio 6,00m, frontal → 3000 kg)', () => {
    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({ jib: { comprimentoJibM: 9, anguloJibGraus: 10 }, raioM: 6 }),
      { jib: tabelaJib },
    )

    expect(resultado.capacidadeMaximaKg).toBe(3000)
  })

  it('retorna exatamente o valor tabelado na lateral/traseira (JIB 15,5m a 40°, raio 16,00m → 600 kg)', () => {
    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({
        quadranteOuZona: 'lateral_traseira',
        jib: { comprimentoJibM: 15.5, anguloJibGraus: 40 },
        raioM: 16,
      }),
      { jib: tabelaJib },
    )

    expect(resultado.capacidadeMaximaKg).toBe(600)
  })

  it('sinaliza fora_da_faixa para uma combinação de comprimento/ângulo de JIB que não existe na tabela', () => {
    const resultado = calcularCapacidadeMaxima(
      md300l,
      configuracaoBase({ jib: { comprimentoJibM: 9, anguloJibGraus: 99 }, raioM: 6 }),
      { jib: tabelaJib },
    )

    expect(resultado.status).toBe('fora_da_faixa')
  })

  it('lança erro ao tentar usar JIB num guindaste que não possui (TM-130)', () => {
    expect(() =>
      calcularCapacidadeMaxima(
        tm130,
        configuracaoBase({ guindasteId: tm130.id, jib: { comprimentoJibM: 9, anguloJibGraus: 10 }, raioM: 6 }),
        { jib: tabelaJib },
      ),
    ).toThrow()
  })

  it('lança erro quando usaJIB = true mas faltam os parâmetros do JIB', () => {
    expect(() =>
      calcularCapacidadeMaxima(md300l, configuracaoBase({ jib: undefined, raioM: 6 }), { jib: tabelaJib }),
    ).toThrow()
  })
})
