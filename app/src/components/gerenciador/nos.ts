/**
 * Nós do FeatureManager (Épico 17) — a árvore de parâmetros no estilo do
 * SolidWorks. Módulo puro (sem React): diz quais nós existem, a que nó cada
 * motivo de "sem dado" e cada verificação reprovada pertencem, e o estado
 * de cada nó (✔ completo · ? falta dado · ! atenção · ✖ reprovado).
 *
 * Não recalcula nada: lê a avaliação que o motor já devolveu.
 */
import type { AvaliacaoDoCenario, ParametrosDoCenario, Verificacao } from '../../types/cenario'

export type IdNo =
  | 'guindaste'
  | 'lanca'
  | 'giro'
  | 'jib'
  | 'sapatas'
  | 'cabo'
  | 'carga'
  | 'acessorios'
  | 'limites'
  | 'ambiente'

export const TITULO_NO: Record<IdNo, string> = {
  guindaste: 'Guindaste',
  lanca: 'Lança',
  giro: 'Giro',
  jib: 'JIB',
  sapatas: 'Sapatas',
  cabo: 'Cabo e moitão',
  carga: 'Carga',
  acessorios: 'Acessórios',
  limites: 'Limites e operação',
  ambiente: 'Ambiente (informativo)',
}

/** Ordem dos nós na árvore (o JIB só aparece com ele ligado). */
export function nosDaArvore(cenario: ParametrosDoCenario): IdNo[] {
  return [
    'lanca',
    'giro',
    ...(cenario.jib.ativo ? (['jib'] as IdNo[]) : []),
    'sapatas',
    'cabo',
    'carga',
    'acessorios',
    'limites',
    'ambiente',
  ]
}

/**
 * Nó onde o engenheiro corrige um motivo de "sem dado". Os textos vêm de
 * engine/avaliarCenario.ts e engine/capacidadeDetalhada.ts; o que não casa
 * com nenhum prefixo é da capacidade na tabela (raio sem célula, ângulo
 * fora da tabela...), que se ajusta pela lança — ou pelo JIB, se ligado.
 */
export function noDoMotivo(motivo: string, jibAtivo: boolean): IdNo {
  if (/^(Comprimento de lança|Ângulo da lança .* fora do limite mecânico)/.test(motivo)) return 'lanca'
  if (/^Giro /.test(motivo)) return 'giro'
  if (/^Sapata /.test(motivo)) return 'sapatas'
  if (/JIB/.test(motivo)) return 'jib'
  if (/^(Cabo com|Nº de pernas|Massa linear|Massa do moitão)/.test(motivo)) return 'cabo'
  return jibAtivo ? 'jib' : 'lanca'
}

/** Nó responsável por uma verificação reprovada. */
export function noDaVerificacao(id: Verificacao['id']): IdNo {
  switch (id) {
    case 'capacidade':
      return 'carga'
    case 'carga_por_perna':
      return 'cabo'
    case 'altura_icamento':
    case 'limite_engenheiro':
      return 'limites'
  }
}

export type EstadoDoNo = 'ok' | 'falta' | 'atencao' | 'reprovado'

const GRAVIDADE: Record<EstadoDoNo, number> = { ok: 0, atencao: 1, falta: 2, reprovado: 3 }

/** Estado de cada nó, a partir da avaliação do motor (o pior problema do nó vence). */
export function estadoDosNos(cenario: ParametrosDoCenario, avaliacao: AvaliacaoDoCenario): Record<IdNo, EstadoDoNo> {
  const estados = Object.fromEntries(Object.keys(TITULO_NO).map((n) => [n, 'ok'])) as Record<IdNo, EstadoDoNo>
  const piorar = (no: IdNo, estado: EstadoDoNo) => {
    if (GRAVIDADE[estado] > GRAVIDADE[estados[no]]) estados[no] = estado
  }
  for (const motivo of avaliacao.motivosSemDado) piorar(noDoMotivo(motivo, cenario.jib.ativo), 'falta')
  for (const v of avaliacao.verificacoes) {
    if (v.aprovada) continue
    piorar(noDaVerificacao(v.id), v.id === 'limite_engenheiro' ? 'atencao' : 'reprovado')
  }
  // O nó raiz resume a árvore inteira.
  for (const no of Object.keys(estados) as IdNo[]) if (no !== 'guindaste') piorar('guindaste', estados[no])
  return estados
}

/** Texto curto que orienta o engenheiro (a caixa "Mensagem" do PropertyManager). */
export function mensagemDoNo(no: IdNo): string {
  switch (no) {
    case 'guindaste':
      return 'Escolha o guindaste da frota. As tabelas e os limites mecânicos vêm da ficha do fabricante.'
    case 'lanca':
      return 'Digite os valores ou arraste na cena: o corpo da lança muda o comprimento e o gancho muda o ângulo.'
    case 'giro':
      return 'A área da tabela (frontal, lateral/traseira ou zona) é derivada do giro. Arraste o anel no chão ou digite.'
    case 'jib':
      return 'A tabela de JIB exige a lança principal no comprimento máximo. Entre os ângulos tabelados, interpola para baixo.'
    case 'sapatas':
      return 'Só a extensão máxima tem capacidade na ficha. Qualquer outra extensão resulta em "sem dado do fabricante".'
    case 'cabo':
      return 'O cabo pendurado entra no somatório. Sem a massa linear (ou um valor manual), a operação não é validada.'
    case 'carga':
      return 'Peso e dimensões da peça a içar. O centro de gravidade é medido a partir do centro geométrico da carga.'
    case 'acessorios':
      return 'Lingada e balancim entram no somatório de cargas, que é o valor comparado com a tabela.'
    case 'limites':
      return 'Limite de utilização definido pelo engenheiro: acima dele o resultado vira "Atenção".'
    case 'ambiente':
      return 'Informativo: as fichas não trazem dados de vento nem de solo. Os valores vão só para o relatório.'
  }
}
