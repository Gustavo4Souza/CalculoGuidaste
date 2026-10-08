import { useInterfaceStore } from '../../store/useInterfaceStore'
import { useProjetosStore } from '../../store/useProjetosStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { baixarArquivoDeProjeto } from '../projetos/arquivos'
import { useAlteracoesNaoSalvas } from '../projetos/CenarioAberto'

/** Um comando da interface: o que faz, se está disponível e, se não estiver, por quê. */
export interface Comando {
  rotulo: string
  dica: string
  executar: () => void
  desabilitadoPorque?: string
}

/**
 * Comandos de arquivo e de avaliação (Épicos 15/16 → Épico 17), num lugar
 * só: o menu Arquivo, a barra de acesso rápido e o CommandManager chamam os
 * mesmos comandos, com o mesmo rótulo e a mesma regra de disponibilidade.
 */
export function useComandos(abrirSeletorDeArquivo: () => void) {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const abrirDialogo = useInterfaceStore((s) => s.abrirDialogo)
  const confirmarEdicao = useInterfaceStore((s) => s.confirmarEdicao)
  const aberto = useProjetosStore((s) => s.aberto)
  const salvar = useProjetosStore((s) => s.salvar)
  const desvincular = useProjetosStore((s) => s.desvincular)
  const exportarProjeto = useProjetosStore((s) => s.exportarProjeto)
  const projetoSelecionadoId = useProjetosStore((s) => s.projetoId)
  const alterado = useAlteracoesNaoSalvas()
  const projetoParaExportar = aberto?.projeto.id ?? projetoSelecionadoId

  const novo: Comando = {
    rotulo: 'Novo',
    dica: 'Recomeça o cenário do guindaste atual com os valores iniciais (sem vínculo com cenário salvo)',
    executar: () => {
      if (alterado && !window.confirm('Há alterações não salvas no cenário aberto. Descartar?')) return
      confirmarEdicao()
      desvincular()
      selecionarGuindaste(cenario.guindasteId)
    },
  }
  const abrir: Comando = {
    rotulo: 'Abrir',
    dica: 'Projetos, orçamentos e cenários salvos',
    executar: () => abrirDialogo('projetos'),
  }
  const salvarCmd: Comando = {
    rotulo: 'Salvar',
    dica: aberto ? `Sobrescreve o cenário "${aberto.cenario.nome}"` : 'Salva a simulação como um cenário novo',
    executar: () => (aberto ? void salvar() : abrirDialogo('salvar')),
  }
  const salvarComo: Comando = {
    rotulo: 'Salvar como cenário',
    dica: 'Grava a simulação atual como um cenário novo num orçamento',
    executar: () => abrirDialogo('salvar'),
  }
  const importar: Comando = {
    rotulo: 'Importar JSON',
    dica: 'Importa um projeto exportado (sempre como cópia)',
    executar: abrirSeletorDeArquivo,
  }
  const exportarJson: Comando = {
    rotulo: 'Exportar JSON',
    dica: 'Exporta o projeto (todos os orçamentos e cenários) em JSON',
    executar: async () => {
      if (projetoParaExportar) baixarArquivoDeProjeto(await exportarProjeto(projetoParaExportar))
    },
    desabilitadoPorque: projetoParaExportar ? undefined : 'Abra ou selecione um projeto para exportar',
  }
  const exportarPdf: Comando = {
    rotulo: 'Exportar PDF',
    dica: 'Relatório PDF do cenário atual ou do orçamento',
    executar: () => abrirDialogo('pdf'),
  }
  const buscarPorPeso: Comando = {
    rotulo: 'Buscar por peso',
    dica: 'Configurações viáveis da frota para um peso, menor guindaste primeiro (RF15)',
    executar: () => abrirDialogo('busca'),
  }
  const comparar: Comando = {
    rotulo: 'Comparar cenários',
    dica: 'Em Abrir, marque 2 ou mais cenários e clique em "Comparar selecionados"',
    executar: () => abrirDialogo('projetos'),
  }

  return { novo, abrir, salvar: salvarCmd, salvarComo, importar, exportarJson, exportarPdf, buscarPorPeso, comparar, alterado }
}
