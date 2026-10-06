/**
 * Implementação de `RepositorioProjetos` no IndexedDB do navegador (Épico 15,
 * RF25), via a lib `idb` (~1 kB, só uma camada de Promises sobre a API
 * nativa). Funciona offline, sem servidor e sem login; o contra é que os
 * dados ficam presos àquele navegador — o exportar/importar JSON resolve o
 * backup e a troca entre máquinas.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  ArquivoDeProjeto,
  CenarioSalvo,
  DadosCenario,
  DadosOrcamento,
  DadosProjeto,
  Orcamento,
  Projeto,
} from '../types/projeto'
import { FORMATO_ARQUIVO, SCHEMA_VERSION, validarArquivoDeProjeto } from './arquivoDeProjeto'
import type { RepositorioProjetos } from './RepositorioProjetos'

interface EsquemaBanco extends DBSchema {
  projetos: { key: string; value: Projeto }
  orcamentos: { key: string; value: Orcamento; indexes: { porProjeto: string } }
  cenarios: { key: string; value: CenarioSalvo; indexes: { porOrcamento: string } }
}

export const NOME_BANCO = 'guindastes-ribas'
/** Versão do banco IndexedDB (estrutura das "tabelas"), independente do schemaVersion dos dados. */
const VERSAO_BANCO = 1

function agora(): string {
  return new Date().toISOString()
}

function novoId(): string {
  return crypto.randomUUID()
}

/** Busca sem diferenciar maiúsculas nem acentos. */
function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function maisRecentePrimeiro<T extends { atualizadoEm: string }>(a: T, b: T): number {
  return b.atualizadoEm.localeCompare(a.atualizadoEm)
}

export class RepositorioIndexedDB implements RepositorioProjetos {
  private readonly banco: Promise<IDBPDatabase<EsquemaBanco>>
  private readonly guindastesConhecidos: readonly string[]

  constructor(guindastesConhecidos: readonly string[], nomeBanco = NOME_BANCO) {
    this.guindastesConhecidos = guindastesConhecidos
    this.banco = openDB<EsquemaBanco>(nomeBanco, VERSAO_BANCO, {
      upgrade(db) {
        db.createObjectStore('projetos', { keyPath: 'id' })
        db.createObjectStore('orcamentos', { keyPath: 'id' }).createIndex('porProjeto', 'projetoId')
        db.createObjectStore('cenarios', { keyPath: 'id' }).createIndex('porOrcamento', 'orcamentoId')
      },
    })
  }

  // ------------------------------------------------------------- projetos

  async listarProjetos(busca = ''): Promise<Projeto[]> {
    const todos = await (await this.banco).getAll('projetos')
    const termo = normalizar(busca.trim())
    return todos
      .filter((p) => !termo || normalizar(`${p.cliente} ${p.obra} ${p.local} ${p.responsavel}`).includes(termo))
      .sort(maisRecentePrimeiro)
  }

  async obterProjeto(id: string): Promise<Projeto | null> {
    return (await (await this.banco).get('projetos', id)) ?? null
  }

  async criarProjeto(dados: DadosProjeto): Promise<Projeto> {
    const quando = agora()
    const projeto: Projeto = { ...dados, id: novoId(), criadoEm: quando, atualizadoEm: quando }
    await (await this.banco).add('projetos', projeto)
    return structuredClone(projeto)
  }

  async atualizarProjeto(id: string, dados: DadosProjeto): Promise<Projeto> {
    const db = await this.banco
    const atual = await db.get('projetos', id)
    if (!atual) throw new Error('Projeto não encontrado.')
    const projeto: Projeto = { ...atual, ...dados, atualizadoEm: agora() }
    await db.put('projetos', projeto)
    return structuredClone(projeto)
  }

  async excluirProjeto(id: string): Promise<void> {
    const db = await this.banco
    const tx = db.transaction(['projetos', 'orcamentos', 'cenarios'], 'readwrite')
    const orcamentos = await tx.objectStore('orcamentos').index('porProjeto').getAllKeys(id)
    for (const orcamentoId of orcamentos) {
      const cenarios = await tx.objectStore('cenarios').index('porOrcamento').getAllKeys(orcamentoId)
      for (const cenarioId of cenarios) await tx.objectStore('cenarios').delete(cenarioId)
      await tx.objectStore('orcamentos').delete(orcamentoId)
    }
    await tx.objectStore('projetos').delete(id)
    await tx.done
  }

  // ----------------------------------------------------------- orçamentos

  async listarOrcamentos(projetoId: string): Promise<Orcamento[]> {
    const lista = await (await this.banco).getAllFromIndex('orcamentos', 'porProjeto', projetoId)
    return lista.sort(maisRecentePrimeiro)
  }

  async obterOrcamento(id: string): Promise<Orcamento | null> {
    return (await (await this.banco).get('orcamentos', id)) ?? null
  }

  async criarOrcamento(dados: DadosOrcamento): Promise<Orcamento> {
    const db = await this.banco
    if (!(await db.get('projetos', dados.projetoId))) throw new Error('Projeto não encontrado.')
    const quando = agora()
    const orcamento: Orcamento = { ...dados, id: novoId(), criadoEm: quando, atualizadoEm: quando }
    await db.add('orcamentos', orcamento)
    await this.tocarProjeto(dados.projetoId)
    return structuredClone(orcamento)
  }

  async atualizarOrcamento(id: string, dados: Omit<DadosOrcamento, 'projetoId'>): Promise<Orcamento> {
    const db = await this.banco
    const atual = await db.get('orcamentos', id)
    if (!atual) throw new Error('Orçamento não encontrado.')
    const orcamento: Orcamento = { ...atual, ...dados, atualizadoEm: agora() }
    await db.put('orcamentos', orcamento)
    await this.tocarProjeto(orcamento.projetoId)
    return structuredClone(orcamento)
  }

  async excluirOrcamento(id: string): Promise<void> {
    const db = await this.banco
    const tx = db.transaction(['orcamentos', 'cenarios'], 'readwrite')
    const cenarios = await tx.objectStore('cenarios').index('porOrcamento').getAllKeys(id)
    for (const cenarioId of cenarios) await tx.objectStore('cenarios').delete(cenarioId)
    await tx.objectStore('orcamentos').delete(id)
    await tx.done
  }

  // ------------------------------------------------------------- cenários

  async listarCenarios(orcamentoId: string): Promise<CenarioSalvo[]> {
    const lista = await (await this.banco).getAllFromIndex('cenarios', 'porOrcamento', orcamentoId)
    return lista.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
  }

  async obterCenario(id: string): Promise<CenarioSalvo | null> {
    return (await (await this.banco).get('cenarios', id)) ?? null
  }

  async criarCenario(dados: DadosCenario): Promise<CenarioSalvo> {
    const db = await this.banco
    const orcamento = await db.get('orcamentos', dados.orcamentoId)
    if (!orcamento) throw new Error('Orçamento não encontrado.')
    const quando = agora()
    const cenario: CenarioSalvo = { ...structuredClone(dados), id: novoId(), criadoEm: quando, atualizadoEm: quando }
    await db.add('cenarios', cenario)
    await this.tocarOrcamento(orcamento)
    return structuredClone(cenario)
  }

  async atualizarCenario(id: string, dados: Partial<DadosCenario>): Promise<CenarioSalvo> {
    const db = await this.banco
    const atual = await db.get('cenarios', id)
    if (!atual) throw new Error('Cenário não encontrado.')
    const cenario: CenarioSalvo = { ...atual, ...structuredClone(dados), id, atualizadoEm: agora() }
    await db.put('cenarios', cenario)
    const orcamento = await db.get('orcamentos', cenario.orcamentoId)
    if (orcamento) await this.tocarOrcamento(orcamento)
    return structuredClone(cenario)
  }

  async duplicarCenario(id: string, novoNome: string): Promise<CenarioSalvo> {
    const original = await this.obterCenario(id)
    if (!original) throw new Error('Cenário não encontrado.')
    const { id: _id, criadoEm: _c, atualizadoEm: _a, ...dados } = original
    return this.criarCenario({ ...dados, nome: novoNome })
  }

  async excluirCenario(id: string): Promise<void> {
    await (await this.banco).delete('cenarios', id)
  }

  // ------------------------------------------------- exportar / importar

  async exportarProjeto(id: string): Promise<ArquivoDeProjeto> {
    const projeto = await this.obterProjeto(id)
    if (!projeto) throw new Error('Projeto não encontrado.')
    const orcamentos = await this.listarOrcamentos(id)
    const cenarios = (await Promise.all(orcamentos.map((o) => this.listarCenarios(o.id)))).flat()
    return {
      formato: FORMATO_ARQUIVO,
      schemaVersion: SCHEMA_VERSION,
      exportadoEm: agora(),
      projeto,
      orcamentos,
      cenarios,
    }
  }

  async importarProjeto(bruto: unknown): Promise<Projeto> {
    const arquivo = validarArquivoDeProjeto(bruto, this.guindastesConhecidos)
    const db = await this.banco
    const quando = agora()
    // Sempre como cópia: IDs novos, mapeando os vínculos orçamento → cenário.
    const projeto: Projeto = { ...arquivo.projeto, id: novoId(), atualizadoEm: quando }
    const novoIdOrcamento = new Map(arquivo.orcamentos.map((o) => [o.id, novoId()]))

    const tx = db.transaction(['projetos', 'orcamentos', 'cenarios'], 'readwrite')
    await tx.objectStore('projetos').add(projeto)
    for (const o of arquivo.orcamentos) {
      await tx.objectStore('orcamentos').add({ ...o, id: novoIdOrcamento.get(o.id)!, projetoId: projeto.id })
    }
    for (const c of arquivo.cenarios) {
      await tx.objectStore('cenarios').add({ ...c, id: novoId(), orcamentoId: novoIdOrcamento.get(c.orcamentoId)! })
    }
    await tx.done
    return structuredClone(projeto)
  }

  // ---------------------------------------------------------------- apoio

  /** Atualiza a data do projeto quando algo dentro dele muda (ordem "mais recente primeiro"). */
  private async tocarProjeto(projetoId: string): Promise<void> {
    const db = await this.banco
    const projeto = await db.get('projetos', projetoId)
    if (projeto) await db.put('projetos', { ...projeto, atualizadoEm: agora() })
  }

  private async tocarOrcamento(orcamento: Orcamento): Promise<void> {
    const db = await this.banco
    await db.put('orcamentos', { ...orcamento, atualizadoEm: agora() })
    await this.tocarProjeto(orcamento.projetoId)
  }
}
