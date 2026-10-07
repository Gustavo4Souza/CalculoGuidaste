import { describe, expect, it } from 'vitest'
import { parametrosIniciais } from '../store/parametrosIniciais'
import { CATALOGO, VERSAO_TABELAS } from '../data/catalogo'
import type { ParametrosDoCenario } from '../types/cenario'
import { avaliarCenario, calcularMassaCaboIcamento, pernasPrevistasPelaTabela } from './avaliarCenario'
import { capacidadeJIBDetalhada } from './capacidadeDetalhada'
import { classificarGiro, normalizarGiro } from './classificarGiro'
import { calcularPonta, resolverAnguloParaRaio } from './geometriaLanca'

const MD = CATALOGO['MD-300L']
const TM = CATALOGO['TM-130']
const peMD = { alturaPeDaLancaM: 3.0, recuoPeDaLancaM: 1.4 }

/** Ângulo da lança principal que põe a ponta exatamente em `raioM` (MD-300L). */
function anguloMD(comprimentoM: number, raioM: number, jib?: { comprimentoM: number; anguloGraus: number }): number {
  const a = resolverAnguloParaRaio(peMD, { comprimentoLancaM: comprimentoM, jib }, raioM, 0, 85)
  if (a === null) throw new Error('raio inalcançável no teste')
  return a
}

function parametrosMD(overrides: Partial<ParametrosDoCenario> = {}): ParametrosDoCenario {
  return {
    guindasteId: 'MD-300L',
    lanca: { comprimentoM: 17.7, anguloGraus: anguloMD(17.7, 8) },
    giroGraus: 0,
    jib: { ativo: false, comprimentoM: 9, anguloGraus: 10 },
    sapatas: { dianteira_esquerda: 3.25, dianteira_direita: 3.25, traseira_esquerda: 3.25, traseira_direita: 3.25 },
    cabo: { numeroDePernas: 6, massaLinearKgM: null, massaSobrescritaKg: 0 },
    moitao: { massaKg: 235 },
    carga: {
      descricao: 'Peça de teste',
      pesoKg: 0,
      comprimentoM: 2,
      larguraM: 1,
      alturaM: 2,
      centroDeGravidade: { dx: 0, dy: 0, dz: 0 },
    },
    acessorios: { massaLingadaKg: 0, alturaLingadaM: 3, usaBalancim: false, massaBalancimKg: 0 },
    alturaIcamentoNecessariaM: null,
    limiteUtilizacaoPercentual: 100,
    ambiente: { ventoMaximoMS: null, pressaoAdmissivelSoloKgfCm2: null },
    ...overrides,
  }
}

function parametrosJIB(comprimentoJibM: number, anguloJibGraus: number, raioM: number, giroGraus = 0): ParametrosDoCenario {
  const jib = { comprimentoM: comprimentoJibM, anguloGraus: anguloJibGraus }
  return parametrosMD({
    lanca: { comprimentoM: 32.1, anguloGraus: anguloMD(32.1, raioM, jib) },
    jib: { ativo: true, ...jib },
    cabo: { numeroDePernas: 1, massaLinearKgM: null, massaSobrescritaKg: 0 },
    moitao: { massaKg: 67 },
    giroGraus,
  })
}

describe('avaliarCenario — MD-300L, lança principal (valores reais de md-300l.json)', () => {
  it('ponto exato: 17,70 m, raio 8,00 m, giro 0° (frontal) → 7.500 kg exato', () => {
    const r = avaliarCenario(parametrosMD(), MD)
    expect(r.geometria.raioM).toBeCloseTo(8, 6)
    expect(r.capacidade.capacidadeKg).toBe(7500)
    expect(r.capacidade.origem).toBe('exato')
    expect(r.capacidade.regiao).toBe('frontal')
    expect(r.capacidade.pontosUsados).toEqual([
      { tabela: 'Lança principal — área frontal', chaves: { comprimentoLancaM: 17.7, raioM: 8 }, capacidadeKg: 7500 },
    ])
    expect(r.status).toBe('ok')
    expect(r.giro.criterioProvisorio).toBe(false) // ±55° confirmado em 06/10/2026
  })

  it('giro de 90° deriva a área lateral/traseira → 10.500 kg (mesma lança, mesmo raio)', () => {
    const r = avaliarCenario(parametrosMD({ giroGraus: 90 }), MD)
    expect(r.giro.regioes).toEqual(['lateral_traseira'])
    expect(r.capacidade.capacidadeKg).toBe(10500)
  })

  it.each([55, -55, 305])('na fronteira exata (giro %s°) avalia as duas áreas e usa a menor (frontal, 7.500 kg)', (giro) => {
    const r = avaliarCenario(parametrosMD({ giroGraus: giro }), MD)
    expect(r.giro.regioes).toEqual(['frontal', 'lateral_traseira'])
    expect(r.capacidade.capacidadeKg).toBe(7500)
    expect(r.capacidade.regiao).toBe('frontal')
  })

  it('logo depois da fronteira (giro 56°) já é lateral/traseira', () => {
    const r = avaliarCenario(parametrosMD({ giroGraus: 56 }), MD)
    expect(r.giro.regioes).toEqual(['lateral_traseira'])
    expect(r.capacidade.capacidadeKg).toBe(10500)
  })

  it('interpola no raio e arredonda para baixo: 17,70 m, raio 7,25 m → 9.975 kg (entre 10.800 e 7.500)', () => {
    const r = avaliarCenario(parametrosMD({ lanca: { comprimentoM: 17.7, anguloGraus: anguloMD(17.7, 7.25) } }), MD)
    expect(r.capacidade.capacidadeKg).toBe(9975)
    expect(r.capacidade.origem).toBe('interpolado')
    expect(r.capacidade.pontosUsados.map((p) => p.capacidadeKg)).toEqual([10800, 7500])
  })

  it('interpola entre colunas (bilinear): 15,90 m, raio 8,00 m → 7.750 kg (entre 8.000 em 14,10 m e 7.500 em 17,70 m)', () => {
    const r = avaliarCenario(parametrosMD({ lanca: { comprimentoM: 15.9, anguloGraus: anguloMD(15.9, 8) } }), MD)
    expect(r.capacidade.capacidadeKg).toBe(7750)
    expect(r.capacidade.origem).toBe('interpolado')
    expect(r.capacidade.pontosUsados).toHaveLength(2)
  })

  it('raio sem célula na coluna (10,50 m não tem raio 9,00 m na lateral/traseira) → sem dado do fabricante', () => {
    const r = avaliarCenario(
      parametrosMD({ giroGraus: 180, lanca: { comprimentoM: 10.5, anguloGraus: anguloMD(10.5, 9) }, cabo: { numeroDePernas: 8, massaLinearKgM: null, massaSobrescritaKg: 0 } }),
      MD,
    )
    expect(r.status).toBe('sem_dado')
    expect(r.capacidade.capacidadeKg).toBeNull()
    expect(r.motivosSemDado.join(' ')).toContain('sem célula na coluna 10,50 m')
  })
})

describe('avaliarCenario — regra de ouro: configurações que o fabricante não tabela (RF17)', () => {
  it('sapata em extensão parcial → sem dado, sem capacidade, com o motivo', () => {
    const p = parametrosMD()
    p.sapatas.dianteira_esquerda = 2.0
    const r = avaliarCenario(p, MD)
    expect(r.status).toBe('sem_dado')
    expect(r.capacidade.capacidadeKg).toBeNull()
    expect(r.motivosSemDado.join(' ')).toContain('Sapata dianteira esquerda')
  })

  it('passagem de cabo diferente da tabela (4 pernas em 17,70 m, a tabela prevê 6) → sem dado', () => {
    const r = avaliarCenario(parametrosMD({ cabo: { numeroDePernas: 4, massaLinearKgM: null, massaSobrescritaKg: 0 } }), MD)
    expect(r.status).toBe('sem_dado')
    expect(r.motivosSemDado.join(' ')).toContain('a tabela prevê 6')
  })

  it('entre colunas com passagens diferentes (14,10 m = 8 pernas, 17,70 m = 6), as duas são aceitas', () => {
    expect(pernasPrevistasPelaTabela(MD.especificacao, 15.9)).toEqual([8, 6])
    expect(pernasPrevistasPelaTabela(MD.especificacao, 32.1)).toEqual([4])
  })

  it('comprimento além do limite mecânico (33 m > 32,10 m) → sem dado', () => {
    const r = avaliarCenario(parametrosMD({ lanca: { comprimentoM: 33, anguloGraus: 60 } }), MD)
    expect(r.status).toBe('sem_dado')
    expect(r.motivosSemDado.join(' ')).toContain('fora do limite mecânico')
  })

  it('massa linear do cabo não informada e sem sobrescrita → sem dado (não consta nas fichas)', () => {
    const r = avaliarCenario(parametrosMD({ cabo: { numeroDePernas: 6, massaLinearKgM: null, massaSobrescritaKg: null } }), MD)
    expect(r.status).toBe('sem_dado')
    expect(r.capacidade.capacidadeKg).toBe(7500) // a tabela cobre o ponto; o somatório é que está incompleto
    expect(r.motivosSemDado.join(' ')).toContain('Massa linear do cabo')
  })
})

describe('avaliarCenario — JIB do MD-300L (valores reais de md-300l-jib.json)', () => {
  it('offset tabelado exato: JIB 9,0 m a 25°, raio 8,00 m, lateral/traseira → 2.250 kg', () => {
    const r = avaliarCenario(parametrosJIB(9, 25, 8, 180), MD)
    expect(r.capacidade.capacidadeKg).toBe(2250)
    expect(r.capacidade.origem).toBe('exato')
    expect(r.status).toBe('ok')
  })

  it('offset intermediário é interpolado entre as tabelas vizinhas: 17,5° no raio 8,00 m frontal → 2.525 kg (3.000 a 10°, 2.050 a 25°)', () => {
    const r = avaliarCenario(parametrosJIB(9, 17.5, 8), MD)
    expect(r.capacidade.capacidadeKg).toBe(2525)
    expect(r.capacidade.origem).toBe('interpolado')
    expect(r.capacidade.pontosUsados).toEqual([
      { tabela: 'JIB 9,0 m — área frontal', chaves: { anguloJibGraus: 10, raioM: 8 }, capacidadeKg: 3000 },
      { tabela: 'JIB 9,0 m — área frontal', chaves: { anguloJibGraus: 25, raioM: 8 }, capacidadeKg: 2050 },
    ])
  })

  it('direto na primitiva, com arredondamento para baixo: JIB 15,5 m, 32,5°, raio 15 m frontal', () => {
    // 25°: 14 m = 900, 16 m = 800 → 850 · 40°: 14 m = 700, 16 m = 600 → 650 · meio do caminho → 750
    const c = capacidadeJIBDetalhada(MD.tabelas.jibVarianteA!, 15.5, 32.5, 15, 'frontal')
    expect(c.capacidadeKg).toBe(750)
    expect(c.pontosUsados).toHaveLength(4)
  })

  it('offset fora dos tabelados (45°) → sem dado', () => {
    const c = capacidadeJIBDetalhada(MD.tabelas.jibVarianteA!, 9, 45, 12, 'frontal')
    expect(c.capacidadeKg).toBeNull()
    expect(c.motivoSemDado).toContain('fora dos ângulos tabelados')
  })

  it('offset intermediário num raio que só uma das tabelas vizinhas cobre (17,5° a 5 m: 25° começa em 6 m) → sem dado', () => {
    const c = capacidadeJIBDetalhada(MD.tabelas.jibVarianteA!, 9, 17.5, 5, 'frontal')
    expect(c.capacidadeKg).toBeNull()
  })

  it('JIB com a lança principal fora dos 32,10 m que a tabela exige → sem dado', () => {
    const p = parametrosJIB(9, 10, 8)
    p.lanca.comprimentoM = 28.5
    const r = avaliarCenario(p, MD)
    expect(r.status).toBe('sem_dado')
    expect(r.motivosSemDado.join(' ')).toContain('exige a lança principal em 32,10 m')
  })
})

describe('avaliarCenario — somatório e verificações (RF09/RF10/RF19/RF20/RF21)', () => {
  const comCarga = (overrides: Partial<ParametrosDoCenario> = {}) =>
    parametrosMD({
      carga: { descricao: 'Bomba', pesoKg: 5000, comprimentoM: 2, larguraM: 1, alturaM: 2, centroDeGravidade: { dx: 0, dy: 0, dz: 0 } },
      acessorios: { massaLingadaKg: 150, alturaLingadaM: 3, usaBalancim: true, massaBalancimKg: 300 },
      moitao: { massaKg: 300 },
      cabo: { numeroDePernas: 6, massaLinearKgM: 1, massaSobrescritaKg: null },
      ...overrides,
    })

  it('soma carga + lingada + cabo calculado + balancim + só o excedente do moitão sobre os 235 kg da tabela', () => {
    const r = avaliarCenario(comCarga(), MD)
    const pendente = r.geometria.alturaPontaM - 5 // gancho a 2 m (carga) + 3 m (lingada) do solo
    expect(r.geometria.comprimentoCaboPendenteM).toBeCloseTo(pendente, 9)
    expect(r.somatorio.itens.map((i) => i.massaKg)).toEqual([5000, 150, pendente * 6, 300, 65])
    expect(r.somatorio.totalKg).toBeCloseTo(5515 + pendente * 6, 9)
    expect(r.status).toBe('ok')
  })

  it('sobrescrita manual da massa do cabo substitui o cálculo', () => {
    const r = avaliarCenario(comCarga({ cabo: { numeroDePernas: 6, massaLinearKgM: 1, massaSobrescritaKg: 120 } }), MD)
    expect(r.somatorio.itens[2]).toEqual({ descricao: 'Cabo de içamento (valor manual)', massaKg: 120, origem: 'sobrescrito' })
  })

  it('acima do limite do engenheiro, mas dentro da tabela → atenção', () => {
    const r = avaliarCenario(comCarga({ limiteUtilizacaoPercentual: 70 }), MD)
    expect(r.percentualUtilizacao).toBeGreaterThan(70)
    expect(r.status).toBe('atencao')
  })

  it('somatório acima da capacidade da tabela → NOK', () => {
    const p = comCarga()
    p.carga.pesoKg = 7400
    expect(avaliarCenario(p, MD).status).toBe('nok')
  })

  it('altura de içamento: alcança 5 m, não alcança 20 m (ponta da lança a ~18 m)', () => {
    expect(avaliarCenario(comCarga({ alturaIcamentoNecessariaM: 5 }), MD).status).toBe('ok')
    const r = avaliarCenario(comCarga({ alturaIcamentoNecessariaM: 20 }), MD)
    expect(r.status).toBe('nok')
    expect(r.verificacoes.find((v) => v.id === 'altura_icamento')?.aprovada).toBe(false)
  })

  it('massa do cabo = comprimento pendente × pernas × kg/m', () => {
    expect(calcularMassaCaboIcamento(12.5, 6, 1.1)).toBeCloseTo(82.5, 9)
    expect(calcularMassaCaboIcamento(-1, 6, 1.1)).toBe(0)
  })
})

describe('avaliarCenario — TM-130', () => {
  function parametrosTM(overrides: Partial<ParametrosDoCenario> = {}): ParametrosDoCenario {
    return parametrosMD({
      guindasteId: 'TM-130',
      lanca: { comprimentoM: 9, anguloGraus: 30 },
      sapatas: { dianteira_esquerda: 2.85, dianteira_direita: 2.85, traseira_esquerda: 1.85, traseira_direita: 1.85 },
      cabo: { numeroDePernas: 6, massaLinearKgM: null, massaSobrescritaKg: 0 },
      moitao: { massaKg: 150 },
      ...overrides,
    })
  }

  /** TM-130: pé a 2,8 m, recuo 0 — o ângulo que põe o gancho no raio pedido, com a lança de `comprimentoM`. */
  function noRaio(raioM: number, giroGraus = 0, comprimentoM = 12): ParametrosDoCenario {
    const anguloGraus = resolverAnguloParaRaio({ alturaPeDaLancaM: 2.8, recuoPeDaLancaM: 0 }, { comprimentoLancaM: comprimentoM }, raioM, 0, 70)!
    return parametrosTM({ lanca: { comprimentoM, anguloGraus }, giroGraus })
  }

  // Valores reais: docs/dados_guindaste_TM-130.xlsx (aba "Centro de Giro"), conferidos contra o texto de
  // docs/TM_130.pdf p.2 — Zona I: 5 m = 26.000 … 8 m = 16.000; Zona II: 4 m = 20.400, 7 m = 11.200, 8 m = 7.700.
  it.each([
    { giro: 0, raio: 5, esperadoKg: 26000, zona: 'I' },
    { giro: 0, raio: 6, esperadoKg: 21600, zona: 'I' },
    { giro: 0, raio: 12, esperadoKg: 8100, zona: 'I' },
    { giro: 30, raio: 4, esperadoKg: 20400, zona: 'II', comprimento: 9 }, // com 12 m o raio mínimo é 12·cos70° = 4,10 m
    { giro: 30, raio: 8, esperadoKg: 7700, zona: 'II' },
    { giro: -45, raio: 12, esperadoKg: 4000, zona: 'II' },
  ])('lança principal, ponto exato: giro $giro°, raio $raio m → $esperadoKg kg (Zona $zona)', ({ giro, raio, esperadoKg, zona, comprimento }: { giro: number; raio: number; esperadoKg: number; zona: string; comprimento?: number }) => {
    const r = avaliarCenario(noRaio(raio, giro, comprimento), TM)
    expect(r.capacidade.capacidadeKg).toBe(esperadoKg)
    expect(r.capacidade.origem).toBe('exato')
    expect(r.capacidade.regiao).toBe(zona)
    expect(r.giro.criterioProvisorio).toBe(false)
  })

  it('entre dois raios interpola e arredonda para baixo: Zona II, 7,5 m → 9.450 kg (entre 11.200 e 7.700)', () => {
    const r = avaliarCenario(noRaio(7.5, 30), TM)
    expect(r.capacidade.capacidadeKg).toBe(9450)
    expect(r.capacidade.origem).toBe('interpolado')
    expect(r.capacidade.pontosUsados.map((p) => p.capacidadeKg)).toEqual([11200, 7700])
  })

  it('cada zona só cobre os raios dela: 4,5 m tem dado na Zona II (18.350 kg), mas não na Zona I (começa em 5 m)', () => {
    expect(avaliarCenario(noRaio(4.5, 30), TM).capacidade.capacidadeKg).toBe(18350)
    const zonaI = avaliarCenario(noRaio(4.5, 0), TM)
    expect(zonaI.capacidade.capacidadeKg).toBeNull()
    expect(zonaI.motivosSemDado.join(' ')).toContain('Raio 4,50 m fora da tabela da Zona I (5,00–12,00 m)')
  })

  it('na fronteira das zonas (16°) vale a menor capacidade: 8 m → 7.700 kg (Zona II), não 16.000 kg (Zona I)', () => {
    const r = avaliarCenario(noRaio(8, 16), TM)
    expect(r.giro.regioes).toEqual(['I', 'II'])
    expect(r.capacidade.capacidadeKg).toBe(7700)
    expect(r.capacidade.regiao).toBe('II')
  })

  it('além do último raio da tabela (12 m) → sem dado: lança de 12,4 m deitada alcança 12,4 m', () => {
    const r = avaliarCenario(parametrosTM({ lanca: { comprimentoM: 12.4, anguloGraus: 0 } }), TM)
    expect(r.geometria.raioM).toBeCloseTo(12.4, 9)
    expect(r.capacidade.capacidadeKg).toBeNull()
    expect(r.status).toBe('sem_dado')
  })

  it('zonas derivadas do giro: 10° → I, 16° → I e II (fronteira), -30° → II', () => {
    expect(avaliarCenario(parametrosTM({ giroGraus: 10 }), TM).giro.regioes).toEqual(['I'])
    expect(avaliarCenario(parametrosTM({ giroGraus: 16 }), TM).giro.regioes).toEqual(['I', 'II'])
    expect(avaliarCenario(parametrosTM({ giroGraus: -30 }), TM).giro.regioes).toEqual(['II'])
  })

  it('giro além do limite mecânico (±60°, giro total de 120° da ficha) → sem dado', () => {
    const r = avaliarCenario(parametrosTM({ giroGraus: 70 }), TM)
    expect(r.motivosSemDado.join(' ')).toContain('além do limite mecânico (±60°)')
  })

  it('JIB do TM-130 fica desligado até a confirmação da Ribas', () => {
    const r = avaliarCenario(parametrosTM({ jib: { ativo: true, comprimentoM: 5.1, anguloGraus: 0 } }), TM)
    expect(r.motivosSemDado.join(' ')).toContain('JIB não habilitado para o TM-130')
  })

  it('carga por perna (4,3 t por cabo, ficha) reprova mesmo sem tabela: 1 perna com 5.000 kg → NOK', () => {
    const p = parametrosTM({ cabo: { numeroDePernas: 1, massaLinearKgM: null, massaSobrescritaKg: 0 } })
    p.carga.pesoKg = 5000
    const r = avaliarCenario(p, TM)
    expect(r.status).toBe('nok')
    expect(r.verificacoes.find((v) => v.id === 'carga_por_perna')?.aprovada).toBe(false)
  })

  it('nº de pernas vazio (a ficha não informa a passagem de cabo) → sem dado, sem verificação por perna', () => {
    const p = parametrosIniciais(TM) // a tabela cobre o ponto inicial; o que falta é o nº de pernas
    expect(p.cabo.numeroDePernas).toBeNull()
    p.cabo.massaSobrescritaKg = 0
    p.moitao.massaKg = 150
    const r = avaliarCenario(p, TM)
    expect(r.status).toBe('sem_dado')
    expect(r.motivosSemDado.join(' ')).toContain('Nº de pernas do cabo não informado')
    expect(r.verificacoes.some((v) => v.id === 'carga_por_perna')).toBe(false)
  })

  it('nº de pernas vazio com massa linear informada: o cabo não é calculado (não se inventa a passagem)', () => {
    const p = parametrosTM({ cabo: { numeroDePernas: null, massaLinearKgM: 1, massaSobrescritaKg: null } })
    const r = avaliarCenario(p, TM)
    expect(r.somatorio.itens.some((i) => i.descricao.startsWith('Cabo de içamento'))).toBe(false)
    expect(r.status).toBe('sem_dado')
  })
})

describe('geometria, giro e versão', () => {
  it('normaliza o giro para (-180°, 180°]', () => {
    expect(normalizarGiro(540)).toBe(180)
    expect(normalizarGiro(-190)).toBe(170)
    expect(normalizarGiro(-180)).toBe(180)
  })

  it('classifica além do último setor como sem região', () => {
    expect(classificarGiro(TM.criterioDeGiro, 90).regioes).toEqual([])
  })

  it('ponta da lança com JIB deitado (0°/0°): raio = lança + JIB − recuo, altura = pé', () => {
    const p = calcularPonta(peMD, { comprimentoLancaM: 32.1, anguloLancaGraus: 0, jib: { comprimentoM: 9, anguloGraus: 0 } })
    expect(p.raioM).toBeCloseTo(39.7, 9)
    expect(p.alturaM).toBeCloseTo(3, 9)
  })

  it('raio inalcançável com a lança dada → null', () => {
    expect(resolverAnguloParaRaio(peMD, { comprimentoLancaM: 17.7 }, 40, 0, 85)).toBeNull()
  })

  it('VERSAO_TABELAS é um hash estável do conteúdo dos dados', () => {
    expect(VERSAO_TABELAS).toMatch(/^tabelas-[0-9a-f]{8}$/)
  })
})
