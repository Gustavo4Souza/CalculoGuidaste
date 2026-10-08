import { describe, expect, it } from 'vitest'
import { CATALOGO, VERSAO_TABELAS } from '../data/catalogo'
import { resolverAnguloParaRaio } from '../engine/geometriaLanca'
import { montarDadosCenario } from '../persistencia/montarCenario'
import { parametrosIniciais } from '../store/parametrosIniciais'
import type { ParametrosDoCenario } from '../types/cenario'
import type { CenarioSalvo, Orcamento, Projeto } from '../types/projeto'
import { AVISO_VALIDACAO, montarRelatorioCenario, montarRelatorioOrcamento } from './modeloRelatorio'

const MD = CATALOGO['MD-300L']
const AGORA = new Date(2026, 9, 6, 14, 30)
const projeto: Projeto = {
  id: 'p1',
  cliente: 'Indústria Alfa',
  obra: 'Troca do transformador',
  local: 'Caxias do Sul/RS',
  responsavel: 'Eng. Fulano',
  criadoEm: '',
  atualizadoEm: '',
}
const orcamento: Orcamento = { id: 'o1', projetoId: 'p1', nome: 'Orçamento A', descricao: '', criadoEm: '', atualizadoEm: '' }

/** MD-300L 17,70 m, raio 8 m, frontal (7.500 kg na tabela), 6.000 kg, cabo informado à mão (0 kg). */
function parametros(alterar?: (p: ParametrosDoCenario) => void): ParametrosDoCenario {
  const p = parametrosIniciais(MD)
  p.carga.pesoKg = 6000
  p.cabo.massaSobrescritaKg = 0
  alterar?.(p)
  return p
}

function salvo(nome: string, p: ParametrosDoCenario, extra: Partial<CenarioSalvo> = {}): CenarioSalvo {
  return { ...montarDadosCenario('o1', nome, p), id: nome, criadoEm: '', atualizadoEm: '', ...extra }
}

describe('montarRelatorioCenario (Épico 16, RF26) — valores reais', () => {
  it('cabeçalho com projeto, data, versões e o aviso de validação pelo engenheiro', () => {
    const r = montarRelatorioCenario({ parametros: parametros(), nome: 'Frontal', projeto, orcamento, agora: AGORA, salvo: salvo('Frontal', parametros()) })
    expect(r.cabecalho).toEqual({
      cliente: 'Indústria Alfa',
      obra: 'Troca do transformador',
      local: 'Caxias do Sul/RS',
      responsavel: 'Eng. Fulano',
      orcamento: 'Orçamento A',
      geradoEm: '06/10/2026 14:30',
      versaoTabelas: VERSAO_TABELAS,
      versaoCriterioGiro: expect.any(String),
    })
    expect(r.avisoValidacao).toBe(AVISO_VALIDACAO)
    expect(r.criterioGiroProvisorio).toBe(false) // MD-300L: ±55° confirmado em 06/10/2026 → sem selo
  })

  it('ponto exato: 7.500 kg, origem "ponto exato", status OK, somatório item a item', () => {
    const [c] = montarRelatorioCenario({ parametros: parametros(), nome: 'Frontal', agora: AGORA }).cenarios
    expect(c.capacidade.valor).toBe('7.500 kg')
    expect(c.capacidade.origem).toContain('Ponto exato da tabela')
    expect(c.status.codigo).toBe('ok')
    expect(c.somatorio.total).toBe('6.000 kg')
    expect(c.somatorio.itens[0]).toEqual(['Carga içada', '6.000 kg'])
    expect(c.resumo).toContainEqual(['Utilização', '80,0%'])
    expect(c.avisos).toContain('Cenário não salvo em um orçamento no momento da emissão.')
  })

  it('interpolado: diz entre quais pontos reais (17,70 m: 7 m = 10.800 kg e 8 m = 7.500 kg → 9.975 kg a 7,25 m)', () => {
    const p = parametros((x) => {
      x.lanca.anguloGraus = resolverAnguloParaRaio(
        { alturaPeDaLancaM: 3.0, recuoPeDaLancaM: 1.4 },
        { comprimentoLancaM: 17.7 },
        7.25,
        0,
        85,
      )!
    })
    const [c] = montarRelatorioCenario({ parametros: p, nome: 'Interpolado', agora: AGORA }).cenarios
    expect(c.capacidade.valor).toBe('9.975 kg')
    expect(c.capacidade.origem).toContain('Interpolado')
    expect(c.capacidade.pontosUsados).toEqual([
      'Lança principal — área frontal: lança 17,70 m, raio 7,00 m → 10.800 kg',
      'Lança principal — área frontal: lança 17,70 m, raio 8,00 m → 7.500 kg',
    ])
  })

  it('sem dado do fabricante: sem capacidade inventada, com os motivos', () => {
    const [c] = montarRelatorioCenario({
      parametros: parametros((p) => {
        p.sapatas.traseira_esquerda = 2
      }),
      nome: 'Sapata parcial',
      agora: AGORA,
    }).cenarios
    expect(c.status.codigo).toBe('sem_dado')
    expect(c.capacidade.valor).toBe('Sem dado do fabricante — operação não validada')
    expect(c.motivosSemDado.join(' ')).toContain('Sapata traseira esquerda')
    expect(c.parametros).toContainEqual({ grupo: 'Sapatas', rotulo: 'Sapata traseira esquerda', valor: '2,00 m (extensão parcial)', aproximado: false })
  })

  it('marca com ≈ os parâmetros cujo limite vem de valor aproximado (comprimento máximo do TM-130)', () => {
    const [md] = montarRelatorioCenario({ parametros: parametros(), nome: 'x', agora: AGORA }).cenarios
    // 85° do MD-300L passou a vir da ficha (p.4) em 06/10/2026 → sem ≈
    expect(md.parametros.find((p) => p.rotulo.startsWith('Ângulo da lança'))?.aproximado).toBe(false)
    const [c] = montarRelatorioCenario({ parametros: parametrosIniciais(CATALOGO['TM-130']), nome: 'x', agora: AGORA }).cenarios
    expect(c.parametros.find((p) => p.rotulo === 'Comprimento da lança')?.aproximado).toBe(true)
    expect(c.parametros.find((p) => p.rotulo === 'Nº de pernas do cabo')?.valor).toBe('não informado')
    expect(c.avisos.join(' ')).toContain('a ficha não indica para que lado do caminhão')
    expect(c.parametros.find((p) => p.rotulo === 'Peso da carga')?.aproximado).toBe(false)
  })

  it('Épico 18 — cenário sem dado leva a tarja OPERAÇÃO NÃO VALIDADA; aprovado não', () => {
    const [semDado] = montarRelatorioCenario({
      parametros: parametros((p) => void (p.sapatas.traseira_esquerda = 2)),
      nome: 'x',
      agora: AGORA,
    }).cenarios
    expect(semDado.tarja).toContain('OPERAÇÃO NÃO VALIDADA')
    const [ok] = montarRelatorioCenario({ parametros: parametros(), nome: 'x', agora: AGORA }).cenarios
    expect(ok.status.codigo).toBe('ok')
    expect(ok.tarja).toBeNull()
  })

  it('avisa quando o cenário foi salvo com outra versão das tabelas', () => {
    const p = parametros()
    const [c] = montarRelatorioCenario({
      parametros: p,
      nome: 'Antigo',
      agora: AGORA,
      salvo: salvo('Antigo', p, { versaoTabelas: 'tabelas-00000000' }),
    }).cenarios
    expect(c.avisos[0]).toContain('salvo com outra versão das tabelas (tabelas-00000000)')
  })
})

describe('montarRelatorioOrcamento — comparativo dos cenários', () => {
  it('compara frontal × lateral recalculando com as tabelas atuais (7.500 × 10.500 kg)', () => {
    const frontal = salvo('Frontal', parametros())
    const lateral = salvo('Lateral', parametros((p) => (p.giroGraus = 90)))
    const r = montarRelatorioOrcamento({ projeto, orcamento, cenarios: [frontal, lateral], agora: AGORA })
    expect(r.tipo).toBe('orcamento')
    expect(r.cenarios).toHaveLength(2)
    expect(r.comparativo?.colunas).toEqual(['Frontal', 'Lateral'])
    expect(r.comparativo?.linhas.find((l) => l.rotulo === 'Capacidade da tabela')?.valores).toEqual(['7.500 kg', '10.500 kg'])
    expect(r.comparativo?.linhas.find((l) => l.rotulo === 'Status')?.valores).toEqual(['OPERAÇÃO APROVADA', 'OPERAÇÃO APROVADA'])
  })

  it('com um único cenário não há comparativo', () => {
    const r = montarRelatorioOrcamento({ projeto, orcamento, cenarios: [salvo('Só', parametros())], agora: AGORA })
    expect(r.comparativo).toBeNull()
  })
})
