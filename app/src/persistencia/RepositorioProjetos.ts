/**
 * Camada de persistência (Épico 15, RF25) — a ÚNICA coisa que a interface
 * conhece. Hoje a implementação é `RepositorioIndexedDB` (navegador); um
 * backend futuro só precisa implementar esta mesma interface, sem mexer na
 * UI nem nas stores.
 *
 * Todos os métodos são assíncronos (como seriam numa API remota) e devolvem
 * cópias: alterar um objeto devolvido não altera o que está salvo.
 */
import type {
  ArquivoDeProjeto,
  CenarioSalvo,
  DadosCenario,
  DadosOrcamento,
  DadosProjeto,
  Orcamento,
  Projeto,
} from '../types/projeto'

export interface RepositorioProjetos {
  /** Projetos, do atualizado mais recente para o mais antigo; `busca` filtra cliente/obra/local/responsável. */
  listarProjetos(busca?: string): Promise<Projeto[]>
  obterProjeto(id: string): Promise<Projeto | null>
  criarProjeto(dados: DadosProjeto): Promise<Projeto>
  atualizarProjeto(id: string, dados: DadosProjeto): Promise<Projeto>
  /** Exclui o projeto e, em cascata, seus orçamentos e cenários. */
  excluirProjeto(id: string): Promise<void>

  listarOrcamentos(projetoId: string): Promise<Orcamento[]>
  obterOrcamento(id: string): Promise<Orcamento | null>
  criarOrcamento(dados: DadosOrcamento): Promise<Orcamento>
  atualizarOrcamento(id: string, dados: Omit<DadosOrcamento, 'projetoId'>): Promise<Orcamento>
  /** Exclui o orçamento e, em cascata, seus cenários. */
  excluirOrcamento(id: string): Promise<void>

  listarCenarios(orcamentoId: string): Promise<CenarioSalvo[]>
  obterCenario(id: string): Promise<CenarioSalvo | null>
  criarCenario(dados: DadosCenario): Promise<CenarioSalvo>
  /** Sobrescreve parâmetros/resultado/versões de um cenário existente ("Salvar"). */
  atualizarCenario(id: string, dados: Partial<DadosCenario>): Promise<CenarioSalvo>
  /** "Salvar como novo cenário" a partir de um existente, no mesmo orçamento. */
  duplicarCenario(id: string, novoNome: string): Promise<CenarioSalvo>
  excluirCenario(id: string): Promise<void>

  exportarProjeto(id: string): Promise<ArquivoDeProjeto>
  /** Importa um arquivo de projeto SEMPRE como cópia (IDs novos) — nunca sobrescreve um projeto existente. */
  importarProjeto(arquivo: unknown): Promise<Projeto>
}
