/**
 * Formato do arquivo de projeto (exportar/importar JSON, RF25) e a validação
 * de um arquivo recebido. Um arquivo vindo de outra máquina pode estar
 * corrompido, editado à mão ou ser de uma versão mais nova do simulador —
 * nada disso pode entrar no banco e quebrar a tela ao reabrir um cenário.
 */
import type { ArquivoDeProjeto } from '../types/projeto'

export const FORMATO_ARQUIVO = 'guindastes-ribas/projeto' as const
/** Versão do schema dos dados salvos. Mudou o formato? Suba aqui e escreva a migração em `migrarArquivo`. */
export const SCHEMA_VERSION = 1

export class ErroDeImportacao extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ErroDeImportacao'
  }
}

type Objeto = Record<string, unknown>

function ehObjeto(v: unknown): v is Objeto {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function exigir(condicao: boolean, mensagem: string): asserts condicao {
  if (!condicao) throw new ErroDeImportacao(mensagem)
}

function texto(o: Objeto, campo: string, onde: string) {
  exigir(typeof o[campo] === 'string', `${onde}: o campo "${campo}" deveria ser texto.`)
}

function numero(valor: unknown, caminho: string) {
  exigir(typeof valor === 'number' && Number.isFinite(valor), `Cenário: "${caminho}" deveria ser um número.`)
}

/** Lê um caminho "a.b.c" num objeto. */
function ler(o: unknown, caminho: string): unknown {
  return caminho.split('.').reduce<unknown>((atual, chave) => (ehObjeto(atual) ? atual[chave] : undefined), o)
}

/** Campos numéricos que todo `ParametrosDoCenario` precisa ter para a tela e o motor funcionarem. */
const CAMPOS_NUMERICOS_DO_CENARIO = [
  'lanca.comprimentoM',
  'lanca.anguloGraus',
  'giroGraus',
  'jib.comprimentoM',
  'jib.anguloGraus',
  'sapatas.dianteira_esquerda',
  'sapatas.dianteira_direita',
  'sapatas.traseira_esquerda',
  'sapatas.traseira_direita',
  'cabo.numeroDePernas',
  'carga.pesoKg',
  'carga.comprimentoM',
  'carga.larguraM',
  'carga.alturaM',
  'carga.centroDeGravidade.dx',
  'carga.centroDeGravidade.dy',
  'carga.centroDeGravidade.dz',
  'acessorios.massaLingadaKg',
  'acessorios.alturaLingadaM',
  'acessorios.massaBalancimKg',
  'limiteUtilizacaoPercentual',
]

/** Migra arquivos de versões anteriores do schema para a atual (hoje só existe a versão 1). */
function migrarArquivo(arquivo: Objeto): Objeto {
  return arquivo
}

/**
 * Valida um arquivo de projeto recebido. Devolve o arquivo tipado, ou lança
 * `ErroDeImportacao` com uma mensagem em português dizendo o que está errado.
 */
export function validarArquivoDeProjeto(bruto: unknown, guindastesConhecidos: readonly string[]): ArquivoDeProjeto {
  exigir(ehObjeto(bruto), 'O arquivo não é um projeto do simulador (JSON inválido).')
  exigir(bruto.formato === FORMATO_ARQUIVO, 'O arquivo não é um projeto do simulador Guindastes Ribas.')
  exigir(typeof bruto.schemaVersion === 'number', 'O arquivo não informa a versão do formato (schemaVersion).')
  exigir(
    bruto.schemaVersion <= SCHEMA_VERSION,
    `O arquivo foi gerado por uma versão mais nova do simulador (formato ${bruto.schemaVersion}; esta versão lê até ${SCHEMA_VERSION}).`,
  )
  const arquivo = migrarArquivo(bruto)

  const projeto = arquivo.projeto
  exigir(ehObjeto(projeto), 'O arquivo não traz os dados do projeto.')
  for (const c of ['id', 'cliente', 'obra', 'local', 'responsavel']) texto(projeto, c, 'Projeto')

  exigir(Array.isArray(arquivo.orcamentos), 'O arquivo não traz a lista de orçamentos.')
  const idsOrcamento = new Set<string>()
  for (const o of arquivo.orcamentos) {
    exigir(ehObjeto(o), 'Orçamento inválido no arquivo.')
    for (const c of ['id', 'projetoId', 'nome']) texto(o, c, 'Orçamento')
    exigir(o.projetoId === projeto.id, `Orçamento "${o.nome}" não pertence ao projeto do arquivo.`)
    idsOrcamento.add(o.id as string)
  }

  exigir(Array.isArray(arquivo.cenarios), 'O arquivo não traz a lista de cenários.')
  for (const c of arquivo.cenarios) {
    exigir(ehObjeto(c), 'Cenário inválido no arquivo.')
    for (const campo of ['id', 'orcamentoId', 'nome', 'versaoTabelas', 'versaoCriterioGiro']) texto(c, campo, 'Cenário')
    exigir(idsOrcamento.has(c.orcamentoId as string), `Cenário "${c.nome}" aponta para um orçamento que não está no arquivo.`)
    exigir(ehObjeto(c.parametros), `Cenário "${c.nome}" não traz os parâmetros.`)
    exigir(ehObjeto(c.resultado), `Cenário "${c.nome}" não traz o resultado salvo.`)
    const guindasteId = (c.parametros as Objeto).guindasteId
    exigir(
      typeof guindasteId === 'string' && guindastesConhecidos.includes(guindasteId),
      `Cenário "${c.nome}": guindaste "${String(guindasteId)}" não faz parte da frota (${guindastesConhecidos.join(', ')}).`,
    )
    for (const caminho of CAMPOS_NUMERICOS_DO_CENARIO) numero(ler(c.parametros, caminho), `${c.nome} → ${caminho}`)
  }

  return arquivo as unknown as ArquivoDeProjeto
}
