import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { CATALOGO, VERSAO_TABELAS } from '../data/catalogo'
import { VERSAO_CRITERIO_GIRO } from '../config/criteriosDeGiro'
import { parametrosIniciais } from '../store/parametrosIniciais'
import { ErroDeImportacao, SCHEMA_VERSION } from './arquivoDeProjeto'
import { montarDadosCenario, versoesDiferentes } from './montarCenario'
import { RepositorioIndexedDB } from './RepositorioIndexedDB'

const FROTA = Object.keys(CATALOGO)
let repo: RepositorioIndexedDB
let contador = 0

beforeEach(() => {
  // Um banco novo por teste (o fake-indexeddb vive na memória do processo).
  repo = new RepositorioIndexedDB(FROTA, `teste-${++contador}`)
})

const dadosProjeto = { cliente: 'Indústria Alfa', obra: 'Troca do transformador', local: 'Caxias do Sul/RS', responsavel: 'Eng. Fulano' }

async function projetoComCenario() {
  const projeto = await repo.criarProjeto(dadosProjeto)
  const orcamento = await repo.criarOrcamento({ projetoId: projeto.id, nome: 'Orçamento 1', descricao: '' })
  const parametros = parametrosIniciais(CATALOGO['MD-300L'])
  parametros.carga.pesoKg = 5000
  parametros.cabo.massaLinearKgM = 1.1
  const cenario = await repo.criarCenario(montarDadosCenario(orcamento.id, 'MD-300L 17,70 m frontal', parametros))
  return { projeto, orcamento, cenario, parametros }
}

describe('RepositorioIndexedDB — projetos, orçamentos e cenários (Épico 15)', () => {
  it('cria, lista, busca (sem acento e sem maiúsculas) e atualiza projetos', async () => {
    const p = await repo.criarProjeto(dadosProjeto)
    await repo.criarProjeto({ cliente: 'Beta Ltda.', obra: 'Montagem de silo', local: 'Bento', responsavel: 'Eng. Ciclano' })
    expect(await repo.listarProjetos()).toHaveLength(2)
    expect((await repo.listarProjetos('TRANSFORMADOR')).map((x) => x.id)).toEqual([p.id])
    expect((await repo.listarProjetos('caxias')).map((x) => x.id)).toEqual([p.id])
    expect((await repo.listarProjetos('industria')).map((x) => x.id)).toEqual([p.id]) // "Indústria" sem acento

    const editado = await repo.atualizarProjeto(p.id, { ...dadosProjeto, responsavel: 'Eng. Beltrano' })
    expect(editado.responsavel).toBe('Eng. Beltrano')
    expect((await repo.obterProjeto(p.id))?.responsavel).toBe('Eng. Beltrano')
  })

  it('o cenário salvo guarda os parâmetros completos, o resultado e as versões usadas no cálculo', async () => {
    const { cenario, parametros } = await projetoComCenario()
    const lido = await repo.obterCenario(cenario.id)
    expect(lido?.parametros).toEqual(parametros) // reabrir restaura exatamente o mesmo estado
    expect(lido?.resultado.capacidade.capacidadeKg).toBe(7500) // 17,70 m, raio 8 m, frontal (tabela real)
    expect(lido?.resultado.status).toBe('ok')
    expect(lido?.versaoTabelas).toBe(VERSAO_TABELAS)
    expect(lido?.versaoCriterioGiro).toBe(VERSAO_CRITERIO_GIRO)
    expect(lido?.criterioGiroProvisorio).toBe(true)
    expect(versoesDiferentes(lido!)).toEqual({ tabelas: false, criterioGiro: false })
  })

  it('devolve cópias: alterar o objeto devolvido não altera o que está salvo', async () => {
    const { cenario } = await projetoComCenario()
    cenario.parametros.carga.pesoKg = 1
    expect((await repo.obterCenario(cenario.id))?.parametros.carga.pesoKg).toBe(5000)
  })

  it('"Salvar" sobrescreve; "Salvar como novo cenário" duplica no mesmo orçamento', async () => {
    const { orcamento, cenario, parametros } = await projetoComCenario()
    parametros.giroGraus = 90
    await repo.atualizarCenario(cenario.id, montarDadosCenario(orcamento.id, cenario.nome, parametros))
    expect((await repo.obterCenario(cenario.id))?.resultado.capacidade.capacidadeKg).toBe(10500) // lateral

    const copia = await repo.duplicarCenario(cenario.id, 'Cópia lateral')
    expect(copia.id).not.toBe(cenario.id)
    expect(copia.parametros.giroGraus).toBe(90)
    expect((await repo.listarCenarios(orcamento.id)).map((c) => c.nome)).toEqual([cenario.nome, 'Cópia lateral'])
  })

  it('exclui em cascata: projeto → orçamentos → cenários', async () => {
    const { projeto, orcamento, cenario } = await projetoComCenario()
    await repo.excluirProjeto(projeto.id)
    expect(await repo.obterProjeto(projeto.id)).toBeNull()
    expect(await repo.obterOrcamento(orcamento.id)).toBeNull()
    expect(await repo.obterCenario(cenario.id)).toBeNull()
  })

  it('excluir um orçamento leva os cenários dele junto, mas não os de outro orçamento', async () => {
    const { projeto, orcamento, cenario, parametros } = await projetoComCenario()
    const outro = await repo.criarOrcamento({ projetoId: projeto.id, nome: 'Orçamento 2', descricao: '' })
    const outroCenario = await repo.criarCenario(montarDadosCenario(outro.id, 'Outro', parametros))
    await repo.excluirOrcamento(orcamento.id)
    expect(await repo.obterCenario(cenario.id)).toBeNull()
    expect(await repo.obterCenario(outroCenario.id)).not.toBeNull()
  })
})

describe('Exportar / importar projeto em JSON (RF25)', () => {
  it('ida e volta: o projeto importado é uma CÓPIA (IDs novos) com os mesmos dados', async () => {
    const { projeto, cenario } = await projetoComCenario()
    const arquivo = await repo.exportarProjeto(projeto.id)
    expect(arquivo.formato).toBe('guindastes-ribas/projeto')
    expect(arquivo.schemaVersion).toBe(SCHEMA_VERSION)

    // passa por texto, como um arquivo de verdade
    const importado = await repo.importarProjeto(JSON.parse(JSON.stringify(arquivo)))
    expect(importado.id).not.toBe(projeto.id)
    expect(importado.cliente).toBe(projeto.cliente)
    const [orcamentoImportado] = await repo.listarOrcamentos(importado.id)
    const [cenarioImportado] = await repo.listarCenarios(orcamentoImportado.id)
    expect(cenarioImportado.id).not.toBe(cenario.id)
    expect(cenarioImportado.parametros).toEqual(cenario.parametros)
    expect(await repo.listarProjetos()).toHaveLength(2) // o original continua lá
  })

  it('rejeita arquivos inválidos com mensagem clara, sem gravar nada', async () => {
    const { projeto } = await projetoComCenario()
    const arquivo = await repo.exportarProjeto(projeto.id)
    const casos: [unknown, RegExp][] = [
      ['não é json de projeto', /não é um projeto/],
      [{ ...arquivo, formato: 'outro' }, /não é um projeto do simulador/],
      [{ ...arquivo, schemaVersion: SCHEMA_VERSION + 1 }, /versão mais nova/],
      [
        { ...arquivo, cenarios: [{ ...arquivo.cenarios[0], parametros: { ...arquivo.cenarios[0].parametros, guindasteId: 'XYZ-1' } }] },
        /não faz parte da frota/,
      ],
      [
        {
          ...arquivo,
          cenarios: [
            { ...arquivo.cenarios[0], parametros: { ...arquivo.cenarios[0].parametros, lanca: { comprimentoM: '17,7', anguloGraus: 30 } } },
          ],
        },
        /lanca\.comprimentoM" deveria ser um número/,
      ],
      [{ ...arquivo, cenarios: [{ ...arquivo.cenarios[0], orcamentoId: 'nao-existe' }] }, /orçamento que não está no arquivo/],
    ]
    for (const [bruto, mensagem] of casos) {
      await expect(repo.importarProjeto(bruto)).rejects.toThrow(ErroDeImportacao)
      await expect(repo.importarProjeto(bruto)).rejects.toThrow(mensagem)
    }
    expect(await repo.listarProjetos()).toHaveLength(1)
  })
})
