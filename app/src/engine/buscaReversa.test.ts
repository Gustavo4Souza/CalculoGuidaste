import { describe, expect, it } from 'vitest'
import guindastesData from '../data/guindastes.json'
import tabelaMD300L from '../data/tabelas/md-300l.json'
import tabelaTM130 from '../data/tabelas/tm-130.json'
import type { Guindaste, TabelaCargaVarianteA, TabelaCargaVarianteB } from '../types/guindaste'
import { buscarConfiguracoesViaveis } from './buscaReversa'

const guindastes = guindastesData as Guindaste[]
const tabelas = {
  varianteA: tabelaMD300L as TabelaCargaVarianteA[],
  varianteB: tabelaTM130 as TabelaCargaVarianteB[],
}

describe('buscarConfiguracoesViaveis (RF05/RF15 · RT-MC07)', () => {
  it('lista as duas frotas para um peso leve, com o TM-130 (menor capacidade nominal) primeiro', () => {
    const resultado = buscarConfiguracoesViaveis(guindastes, tabelas, 2000)

    expect(resultado.map((r) => r.guindasteId)).toEqual(['TM-130', 'MD-300L'])
  })

  it('MD-300L: escolhe a lança mais curta (mais econômica) que atende o peso', () => {
    // A 30.000 kgf só é atingido no comprimento 10,50m/raio 3,00m — nenhuma
    // lança maior chega perto disso no menor raio (20.000 kgf no máximo).
    const resultado = buscarConfiguracoesViaveis(guindastes, tabelas, 25000)

    const md300l = resultado.find((r) => r.guindasteId === 'MD-300L')
    expect(md300l).toBeDefined()
    expect(md300l!.comprimentoLancaM).toBe(10.5)
    expect(md300l!.quadranteOuZona).toBe('frontal')
    // capacidade real no raio máximo alcançável (interpolado) deve ser >= peso
    expect(md300l!.capacidadeNaConfiguracaoKg).toBeGreaterThanOrEqual(25000)
  })

  it('TM-130: escolhe o menor ângulo (mais raio) que já atende o peso, dentro da Zona I', () => {
    // Zona I a 30° = 3.300 kg exatos (ponto tabelado)
    const resultado = buscarConfiguracoesViaveis(guindastes, tabelas, 3300)

    const tm130 = resultado.find((r) => r.guindasteId === 'TM-130')
    expect(tm130).toBeDefined()
    expect(tm130!.quadranteOuZona).toBe('I')
    expect(tm130!.anguloLancaGraus).toBeCloseTo(30, 9)
    expect(tm130!.capacidadeNaConfiguracaoKg).toBe(3300)
  })

  it('omite um guindaste que não consegue içar o peso em nenhuma configuração', () => {
    // TM-130 nunca passa de 3.800 kg (seu ponto de maior capacidade)
    const resultado = buscarConfiguracoesViaveis(guindastes, tabelas, 10000)

    expect(resultado.map((r) => r.guindasteId)).toEqual(['MD-300L'])
  })

  it('retorna lista vazia quando nenhum guindaste da frota atende o peso', () => {
    const resultado = buscarConfiguracoesViaveis(guindastes, tabelas, 999999)

    expect(resultado).toEqual([])
  })

  it('retorna lista vazia para peso zero ou negativo', () => {
    expect(buscarConfiguracoesViaveis(guindastes, tabelas, 0)).toEqual([])
    expect(buscarConfiguracoesViaveis(guindastes, tabelas, -100)).toEqual([])
  })
})
