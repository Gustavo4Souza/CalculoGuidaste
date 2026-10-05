import { useMemo } from 'react'
import { CATALOGO } from '../../data/catalogo'
import { calcularMapaAreaOperacao, type MapaAreaOperacao } from '../../engine/mapaAreaOperacao'
import type { ParametrosDoCenario } from '../../types/cenario'

/**
 * Mapa da área de operação para o cenário atual (Épico 14), memoizado SEM o
 * giro e SEM o ângulo da lança: o mapa já varre todos os giros e raios,
 * então girar a superestrutura ou subir a lança não muda nada nele — só
 * comprimento, JIB, sapatas, cabo, carga, acessórios e limites mudam.
 */
export function useMapaAreaOperacao(cenario: ParametrosDoCenario): MapaAreaOperacao {
  const chave = JSON.stringify({ ...cenario, giroGraus: 0, lanca: { ...cenario.lanca, anguloGraus: 0 } })
  return useMemo(
    () => calcularMapaAreaOperacao(cenario, CATALOGO[cenario.guindasteId]),
    // `chave` resume tudo o que importa; `cenario` muda de referência a cada arrasto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chave],
  )
}
