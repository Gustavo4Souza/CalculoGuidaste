/**
 * Interpolação linear genérica entre pontos ordenáveis por uma chave numérica.
 * Usada tanto pela variante A (interpolação por raio) quanto pela variante B
 * (interpolação por ângulo) — ver ../types/guindaste.ts.
 *
 * Reaproveita a lógica já validada no POC apresentado à turma em 20/08/2026
 * (incluindo a correção de um bug de fronteira: casos exatos em t≈0/t≈1 só
 * devem checar o "foraDaFaixa" do lado relevante, não dos dois lados).
 */

export interface ResultadoInterpolacao {
  valor: number | null
  foraDaFaixa: boolean
}

/**
 * Interpola linearmente `valor` para `chaveAlvo`, dado um array de pontos
 * `{ chave, valor }` (não precisa vir ordenado — esta função ordena).
 *
 * Retorna `foraDaFaixa: true` quando `chaveAlvo` está fora do intervalo
 * coberto pelos pontos fornecidos (a tabela real do fabricante não garante
 * segurança fora da faixa testada).
 */
export function interpolarLinear(
  pontos: ReadonlyArray<{ chave: number; valor: number }>,
  chaveAlvo: number,
): ResultadoInterpolacao {
  const r = interpolarComDetalhe(pontos, chaveAlvo)
  return { valor: r.valor, foraDaFaixa: r.foraDaFaixa }
}

/**
 * Tolerância para considerar a chave "exatamente" um ponto da tabela — 1 µm
 * de raio (ou 1 µ° de ângulo): absorve o erro de ponto flutuante de um raio
 * derivado de comprimento + ângulo, sem nunca mudar o valor de forma
 * perceptível.
 */
export const TOLERANCIA_PONTO_EXATO = 1e-6

export interface PontoChaveValor {
  chave: number
  valor: number
}

export interface ResultadoInterpolacaoDetalhado extends ResultadoInterpolacao {
  /** true quando a chave caiu exatamente num ponto da tabela. */
  exato: boolean
  /** Os pontos da tabela usados: 1 (exato) ou 2 (interpolado); vazio se fora da faixa. */
  vizinhos: PontoChaveValor[]
}

/** Igual a `interpolarLinear`, mas devolve também quais pontos da tabela foram usados. */
export function interpolarComDetalhe(
  pontos: ReadonlyArray<PontoChaveValor>,
  chaveAlvo: number,
): ResultadoInterpolacaoDetalhado {
  const fora: ResultadoInterpolacaoDetalhado = { valor: null, foraDaFaixa: true, exato: false, vizinhos: [] }
  if (pontos.length === 0 || !Number.isFinite(chaveAlvo)) {
    return fora
  }

  const ordenados = [...pontos].sort((a, b) => a.chave - b.chave)

  // Ponto exato (evita erro de ponto flutuante em comparações de igualdade).
  const exato = ordenados.find((p) => Math.abs(p.chave - chaveAlvo) <= TOLERANCIA_PONTO_EXATO)
  if (exato) {
    return { valor: exato.valor, foraDaFaixa: false, exato: true, vizinhos: [exato] }
  }

  if (chaveAlvo < ordenados[0].chave || chaveAlvo > ordenados[ordenados.length - 1].chave) {
    return fora
  }

  for (let i = 0; i < ordenados.length - 1; i++) {
    const lo = ordenados[i]
    const hi = ordenados[i + 1]
    if (chaveAlvo >= lo.chave && chaveAlvo <= hi.chave) {
      const t = (chaveAlvo - lo.chave) / (hi.chave - lo.chave)
      return { valor: lo.valor + t * (hi.valor - lo.valor), foraDaFaixa: false, exato: false, vizinhos: [lo, hi] }
    }
  }

  // Não deveria chegar aqui dado o check de faixa acima.
  return fora
}

/**
 * Arredondamento de segurança (RT-MC05 / RNF Confiabilidade): a capacidade
 * calculada NUNCA é otimista. Só arredonda para baixo valores realmente
 * interpolados — pontos exatos da tabela do fabricante já são inteiros.
 */
export function arredondarParaBaixo(valorKg: number): number {
  return Math.floor(valorKg)
}
