import type { StatusDoCenario } from '../../types/cenario'

/** Nome curto do status para tabelas (Épico 17: os mesmos termos do veredito). */
export const ROTULO_STATUS_CURTO: Record<StatusDoCenario, string> = {
  ok: 'Aprovada',
  atencao: 'Atenção',
  nok: 'Reprovada',
  sem_dado: 'Não validada',
}
