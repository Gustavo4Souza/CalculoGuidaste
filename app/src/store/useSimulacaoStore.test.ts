import { beforeEach, describe, expect, it } from 'vitest'
import { useSimulacaoStore } from './useSimulacaoStore'

const estado = () => useSimulacaoStore.getState()

describe('useSimulacaoStore — fonte única de estado (Épico 11)', () => {
  beforeEach(() => estado().selecionarGuindaste('MD-300L'))

  it('começa no MD-300L em 17,70 m, raio 8 m, giro 0° → 7.500 kg (ponto exato), sem dado só pela massa linear do cabo', () => {
    const { cenario, avaliacao } = estado()
    expect(cenario.lanca.comprimentoM).toBe(17.7)
    expect(avaliacao.geometria.raioM).toBeCloseTo(8, 6)
    expect(avaliacao.capacidade.capacidadeKg).toBe(7500)
    expect(cenario.cabo.numeroDePernas).toBe(6)
    expect(avaliacao.status).toBe('sem_dado')
    expect(avaliacao.motivosSemDado).toHaveLength(1)
    expect(avaliacao.motivosSemDado[0]).toContain('Massa linear do cabo')
  })

  it('a avaliação é sempre derivada do cenário: informar a massa linear leva a OK', () => {
    estado().atualizarCenario((c) => {
      c.cabo.massaLinearKgM = 1.1
    })
    expect(estado().avaliacao.status).toBe('ok')
  })

  it('definirRaioM ajusta o ângulo para o raio pedido; definirGiroGraus troca a área derivada', () => {
    estado().definirRaioM(4)
    expect(estado().avaliacao.geometria.raioM).toBeCloseTo(4, 6)
    expect(estado().avaliacao.capacidade.capacidadeKg).toBe(16000) // 17,70 m, raio 4,00 m, frontal
    estado().definirGiroGraus(90)
    expect(estado().avaliacao.giro.regioes).toEqual(['lateral_traseira'])
  })

  it('raio inalcançável vai para o extremo (alcance máximo = ângulo mínimo)', () => {
    estado().definirRaioM(999)
    expect(estado().cenario.lanca.anguloGraus).toBe(0)
  })

  it('a passagem de cabo acompanha a tabela ao mudar o comprimento (17,70 m: 6 → 14,10 m: 8 → 32,10 m: 4)', () => {
    estado().definirComprimentoLancaM(14.1)
    expect(estado().cenario.cabo.numeroDePernas).toBe(8)
    estado().definirComprimentoLancaM(32.1)
    expect(estado().cenario.cabo.numeroDePernas).toBe(4)
  })

  it('comprimento é limitado aos limites mecânicos da ficha (10,50–32,10 m)', () => {
    estado().definirComprimentoLancaM(50)
    expect(estado().cenario.lanca.comprimentoM).toBe(32.1)
    estado().definirComprimentoLancaM(1)
    expect(estado().cenario.lanca.comprimentoM).toBe(10.5)
  })

  it('ligar o JIB leva a lança a 32,10 m, 1 perna e o gancho de 67 kg; desligar volta à passagem da tabela', () => {
    estado().definirJIB({ ativo: true })
    const { cenario } = estado()
    expect(cenario.lanca.comprimentoM).toBe(32.1)
    expect(cenario.cabo.numeroDePernas).toBe(1)
    expect(cenario.moitao.massaKg).toBe(67)
    estado().definirJIB({ ativo: false })
    expect(estado().cenario.cabo.numeroDePernas).toBe(4)
    expect(estado().cenario.moitao.massaKg).toBe(235)
  })

  it('JIB 9,0 m a 10°, raio 6,00 m frontal → 3.000 kg (tabela real)', () => {
    estado().definirJIB({ ativo: true, comprimentoM: 9, anguloGraus: 10 })
    estado().definirRaioM(6)
    expect(estado().avaliacao.capacidade.capacidadeKg).toBe(3000)
  })

  it('sapata limitada entre recolhida e estendida; recolher → sem dado', () => {
    estado().definirSapata('traseira_direita', 10)
    expect(estado().cenario.sapatas.traseira_direita).toBe(3.25)
    estado().definirSapata('traseira_direita', 2)
    expect(estado().avaliacao.status).toBe('sem_dado')
    expect(estado().avaliacao.capacidade.capacidadeKg).toBeNull()
  })

  it('TM-130: giro limitado a ±60° (giro total de 120° da ficha)', () => {
    estado().selecionarGuindaste('TM-130')
    estado().definirGiroGraus(90)
    expect(estado().cenario.giroGraus).toBe(60)
    expect(estado().avaliacao.giro.regioes).toEqual(['II'])
  })

  it('carregarCenario restaura exatamente o mesmo estado', () => {
    estado().definirGiroGraus(123)
    estado().atualizarCenario((c) => {
      c.carga.pesoKg = 4321
    })
    const salvo = structuredClone(estado().cenario)
    estado().selecionarGuindaste('TM-130')
    estado().carregarCenario(salvo)
    expect(estado().cenario).toEqual(salvo)
  })

  it('busca reversa (RF15) não sugere o TM-130 enquanto a tabela da lança principal não existe', () => {
    estado().buscarPorPeso(2000)
    const lista = estado().configuracoesViaveis
    expect(lista.map((c) => c.guindasteId)).toEqual(['MD-300L'])
  })
})
