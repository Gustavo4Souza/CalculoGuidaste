import { describe, expect, it } from 'vitest'
import { PROBLEMAS_DE_DADOS } from './catalogo'
import especMD300L from './especificacoes/md-300l.json'
import { validarEspecificacao } from './validarEspecificacao'

describe('validarEspecificacao (bug da tela branca, 05/10/2026)', () => {
  it('as especificações reais da frota estão completas', () => {
    expect(PROBLEMAS_DE_DADOS).toEqual([])
  })

  it('uma especificação sem o bloco "caminhao" (versão anterior ao Épico 13) é apontada pelo nome do campo', () => {
    const antiga: Record<string, unknown> = structuredClone(especMD300L)
    delete antiga.caminhao
    const problemas = validarEspecificacao(antiga, 'MD-300L')
    expect(problemas).toContain(
      'Especificação do MD-300L: "caminhao.dianteiraM" ausente ou inválido (esperado { valor, fonte }).',
    )
    expect(problemas.some((p) => p.includes('caminhao.eixosM'))).toBe(true)
  })

  it('valor numérico como texto também é apontado', () => {
    const errada = structuredClone(especMD300L) as unknown as { lanca: { recuoPeM: { valor: unknown } } }
    errada.lanca.recuoPeM.valor = '1,4'
    expect(validarEspecificacao(errada, 'MD-300L')).toEqual([
      'Especificação do MD-300L: "lanca.recuoPeM" ausente ou inválido (esperado { valor, fonte }).',
    ])
  })
})
