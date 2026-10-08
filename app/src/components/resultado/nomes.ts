import type { StatusDoCenario } from '../../types/cenario'

/** Nome de cada status, o mesmo em toda a interface (veredito, barra de status, comparação, PDF). */
export const NOME_STATUS: Record<StatusDoCenario, string> = {
  ok: 'Operação aprovada',
  atencao: 'Aprovada com atenção',
  nok: 'Operação reprovada',
  sem_dado: 'Operação não validada',
}
