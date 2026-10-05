/**
 * Formatadores reaproveitados: criar um Intl.NumberFormat a cada chamada é
 * caro, e o mapa de área de operação (Épico 14) chama o motor milhares de
 * vezes por atualização.
 */
const formatadores = new Map<number, Intl.NumberFormat>()

/** Formata um número no padrão brasileiro (vírgula decimal) para mensagens do motor. */
export function formatarNumero(valor: number, casas = 2): string {
  let f = formatadores.get(casas)
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
    formatadores.set(casas, f)
  }
  return f.format(valor)
}
