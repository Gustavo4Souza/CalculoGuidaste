/**
 * Emissão do relatório PDF (Épico 16, RF26): monta o modelo, captura as
 * vistas de cada cenário na cena 3D, gera o PDF e baixa o arquivo.
 *
 * Para capturar um cenário de orçamento, ele é carregado TEMPORARIAMENTE na
 * simulação (com o mapa da área de operação ligado); ao final, o cenário e a
 * preferência de mapa que estavam na tela são restaurados exatamente.
 */
import { repositorio } from '../persistencia/repositorio'
import { useInterfaceStore } from '../store/useInterfaceStore'
import { useProjetosStore } from '../store/useProjetosStore'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import type { ParametrosDoCenario } from '../types/cenario'
import { capturarVista, esperarCenaAtualizar } from './capturas'
import type { ImagensDoCenario } from './gerarPdf'
import { montarRelatorioCenario, montarRelatorioOrcamento, type ModeloRelatorio } from './modeloRelatorio'

/** Nome de arquivo seguro: relatorio-<nome>-<aaaa-mm-dd>.pdf */
export function nomeDoArquivoPdf(nome: string, agora = new Date()): string {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  const p = (n: number) => String(n).padStart(2, '0')
  return `relatorio-${base || 'cenario'}-${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}.pdf`
}

/** Captura lateral + superior de cada conjunto de parâmetros, restaurando a tela no final. */
async function capturarCenarios(lista: ParametrosDoCenario[]): Promise<(ImagensDoCenario | null)[]> {
  const simulacao = useSimulacaoStore.getState()
  const interfaceInicial = useInterfaceStore.getState()
  const cenarioOriginal = structuredClone(simulacao.cenario)
  const mapaEstavaLigado = interfaceInicial.mostrarMapa
  if (!mapaEstavaLigado) interfaceInicial.alternarMapa()
  const imagens: (ImagensDoCenario | null)[] = []
  try {
    for (const parametros of lista) {
      useSimulacaoStore.getState().carregarCenario(parametros)
      await esperarCenaAtualizar()
      const lateral = capturarVista('lateral')
      const superior = capturarVista('superior')
      imagens.push(lateral || superior ? { lateral, superior } : null)
    }
  } finally {
    useSimulacaoStore.getState().carregarCenario(cenarioOriginal)
    if (!mapaEstavaLigado) useInterfaceStore.getState().alternarMapa()
    await esperarCenaAtualizar()
  }
  return imagens
}

async function gerarEBaixar(modelo: ModeloRelatorio, imagens: (ImagensDoCenario | null)[], nome: string): Promise<void> {
  const { gerarPdf } = await import('./gerarPdf')
  const blob = await gerarPdf(modelo, imagens)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeDoArquivoPdf(nome)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Relatório do cenário que está na tela (salvo ou não). */
export async function emitirRelatorioDoCenarioAtual(): Promise<void> {
  const { cenario } = useSimulacaoStore.getState()
  const aberto = useProjetosStore.getState().aberto
  const parametros = structuredClone(cenario)
  const nome = aberto?.cenario.nome ?? `${parametros.guindasteId} (cenário não salvo)`
  const modelo = montarRelatorioCenario({
    parametros,
    nome,
    salvo: aberto?.cenario,
    projeto: aberto?.projeto,
    orcamento: aberto?.orcamento,
  })
  const imagens = await capturarCenarios([parametros])
  await gerarEBaixar(modelo, imagens, nome)
}

/** Relatório de um orçamento inteiro: capa, comparativo e um capítulo por cenário. */
export async function emitirRelatorioDoOrcamento(orcamentoId: string): Promise<void> {
  const orcamento = await repositorio.obterOrcamento(orcamentoId)
  if (!orcamento) throw new Error('Orçamento não encontrado.')
  const projeto = await repositorio.obterProjeto(orcamento.projetoId)
  if (!projeto) throw new Error('Projeto do orçamento não encontrado.')
  const cenarios = await repositorio.listarCenarios(orcamentoId)
  if (cenarios.length === 0) throw new Error('O orçamento não tem cenários salvos.')
  const modelo = montarRelatorioOrcamento({ projeto, orcamento, cenarios })
  const imagens = await capturarCenarios(cenarios.map((c) => c.parametros))
  await gerarEBaixar(modelo, imagens, `${projeto.cliente}-${orcamento.nome}`)
}
