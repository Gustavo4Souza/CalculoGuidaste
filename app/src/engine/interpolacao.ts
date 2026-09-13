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
  if (pontos.length === 0) {
    return { valor: null, foraDaFaixa: true }
  }

  const ordenados = [...pontos].sort((a, b) => a.chave - b.chave)

  if (chaveAlvo < ordenados[0].chave || chaveAlvo > ordenados[ordenados.length - 1].chave) {
    return { valor: null, foraDaFaixa: true }
  }

  // Ponto exato (evita erro de ponto flutuante em comparações de igualdade).
  const exato = ordenados.find((p) => Math.abs(p.chave - chaveAlvo) < 1e-9)
  if (exato) {
    return { valor: exato.valor, foraDaFaixa: false }
  }

  for (let i = 0; i < ordenados.length - 1; i++) {
    const lo = ordenados[i]
    const hi = ordenados[i + 1]
    if (chaveAlvo >= lo.chave && chaveAlvo <= hi.chave) {
      const t = (chaveAlvo - lo.chave) / (hi.chave - lo.chave)
      return { valor: lo.valor + t * (hi.valor - lo.valor), foraDaFaixa: false }
    }
  }

  // Não deveria chegar aqui dado o check de faixa acima.
  return { valor: null, foraDaFaixa: true }
}

/**
 * Arredondamento de segurança (RT-MC05 / RNF Confiabilidade): a capacidade
 * calculada NUNCA é otimista. Só arredonda para baixo valores realmente
 * interpolados — pontos exatos da tabela do fabricante já são inteiros.
 */
export function arredondarParaBaixo(valorKg: number): number {
  return Math.floor(valorKg)
}
