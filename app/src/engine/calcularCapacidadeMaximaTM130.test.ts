import { describe, expect, it } from 'vitest'
import guindastes from '../data/guindastes.json'
import tabelaTM130 from '../data/tabelas/tm-130-jib.json'
import type { ConfiguracaoDeIcamento, Guindaste, TabelaCargaVarianteB } from '../types/guindaste'
import { calcularCapacidadeMaxima } from './calcularCapacidadeMaxima'

const tm130 = (guindastes as Guindaste[]).find((g) => g.id === 'TM-130')!
const tabelaB = tabelaTM130 as TabelaCargaVarianteB[]

function configuracaoBase(overrides: Partial<ConfiguracaoDeIcamento>): ConfiguracaoDeIcamento {
  return {
    guindasteId: tm130.id,
    quadranteOuZona: 'I',
    usaJIB: false,
    cargaIcadaKg: 0,
    massaLingadaKg: 0,
    massaCaboDeAcoKg: 0,
    usaBalancim: false,
    ...overrides,
  }
}

// Pontos exatos digitalizados a partir de docs/Tabelas_Zonas_Giro.xlsx
// (Task 1.2), extraídos mecanicamente do XML da planilha — mesma técnica
// usada para o MD-300L, sem depender de leitura de texto de PDF.
describe('calcularCapacidadeMaxima — TM-130, tabela zona + ângulo ("Com sapata para lança JIB" na ficha — ver data/tabelas/README.md)', () => {
  it.each([
    { zona: 'I' as const, anguloGraus: 0, esperadoKg: 3000 },
    { zona: 'I' as const, anguloGraus: 35, esperadoKg: 3500 },
    { zona: 'I' as const, anguloGraus: 70, esperadoKg: 3800 },
    { zona: 'II' as const, anguloGraus: 0, esperadoKg: 2100 },
    { zona: 'II' as const, anguloGraus: 45, esperadoKg: 2900 },
    { zona: 'II' as const, anguloGraus: 60, esperadoKg: 3700 },
    { zona: 'II' as const, anguloGraus: 70, esperadoKg: 3800 },
  ])('ponto exato Zona $zona — ângulo $anguloGraus° → $esperadoKg kg', ({ zona, anguloGraus, esperadoKg }) => {
    const resultado = calcularCapacidadeMaxima(
      tm130,
      configuracaoBase({ anguloLancaGraus: anguloGraus, quadranteOuZona: zona }),
      { varianteB: tabelaB },
    )

    expect(resultado.capacidadeMaximaKg).toBe(esperadoKg)
  })

  it('interpola entre dois pontos tabelados da mesma zona (25° entre 20°=3200 e 30°=3300, Zona I)', () => {
    const resultado = calcularCapacidadeMaxima(
      tm130,
      configuracaoBase({ anguloLancaGraus: 25, quadranteOuZona: 'I' }),
      { varianteB: tabelaB },
    )

    // interpolação linear: 3200 + 0.5*(3300-3200) = 3250 (arredondado para baixo)
    expect(resultado.capacidadeMaximaKg).toBe(3250)
  })

  it('não interpola entre zonas — Zona I e Zona II têm valores independentes no mesmo ângulo', () => {
    const zonaI = calcularCapacidadeMaxima(
      tm130,
      configuracaoBase({ anguloLancaGraus: 0, quadranteOuZona: 'I' }),
      { varianteB: tabelaB },
    )
    const zonaII = calcularCapacidadeMaxima(
      tm130,
      configuracaoBase({ anguloLancaGraus: 0, quadranteOuZona: 'II' }),
      { varianteB: tabelaB },
    )

    expect(zonaI.capacidadeMaximaKg).toBe(3000)
    expect(zonaII.capacidadeMaximaKg).toBe(2100)
  })

  it('sinaliza fora_da_faixa para um ângulo fora da tabela disponível', () => {
    const resultado = calcularCapacidadeMaxima(
      tm130,
      configuracaoBase({ anguloLancaGraus: 90, quadranteOuZona: 'I' }),
      { varianteB: tabelaB },
    )

    expect(resultado.status).toBe('fora_da_faixa')
  })

  it('aplica o somatório de cargas (RF10) contra a capacidade da Zona II', () => {
    const resultado = calcularCapacidadeMaxima(
      tm130,
      configuracaoBase({
        anguloLancaGraus: 50,
        quadranteOuZona: 'II',
        cargaIcadaKg: 3000,
        massaLingadaKg: 200,
        massaCaboDeAcoKg: 150,
      }),
      { varianteB: tabelaB },
    )

    // 3000 + 200 + 150 = 3350 > 3300 (capacidade Zona II a 50°)
    expect(resultado.somatorioDeCargasKg).toBe(3350)
    expect(resultado.status).toBe('excede_capacidade')
  })
})
