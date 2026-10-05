/** Formata um número no padrão brasileiro (vírgula decimal) para mensagens do motor. */
export function formatarNumero(valor: number, casas = 2): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
