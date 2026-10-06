/**
 * Catálogo da frota (Épico 10): junta, para cada guindaste, a especificação
 * técnica, o critério de giro e as tabelas de carga reais — o contexto que o
 * motor (engine/avaliarCenario.ts) recebe por argumento.
 *
 * Também calcula VERSAO_TABELAS: um hash do conteúdo de todos os JSON de
 * dados, gravado em cada cenário salvo e no relatório (RF24). Qualquer
 * correção numa tabela muda a versão automaticamente.
 */
import { CRITERIOS_DE_GIRO } from '../config/criteriosDeGiro'
import type { ContextoDoGuindaste } from '../engine/avaliarCenario'
import type { EspecificacaoGuindaste } from '../types/especificacao'
import type { Guindaste, TabelaCargaVarianteA, TabelaCargaVarianteB, TabelaCargaZonaRaio, TabelaJIB } from '../types/guindaste'
import especMD300L from './especificacoes/md-300l.json'
import especTM130 from './especificacoes/tm-130.json'
import guindastesData from './guindastes.json'
import tabelaJibMD300L from './tabelas/md-300l-jib.json'
import tabelaMD300L from './tabelas/md-300l.json'
import tabelaJibTM130 from './tabelas/tm-130-jib.json'
import tabelaTM130 from './tabelas/tm-130-principal.json'
import { validarEspecificacao } from './validarEspecificacao'

const guindastes = guindastesData as Guindaste[]

function guindastePorId(id: string): Guindaste {
  const g = guindastes.find((x) => x.id === id)
  if (!g) throw new Error(`Guindaste ${id} não está em guindastes.json`)
  return g
}

export const CATALOGO: Record<string, ContextoDoGuindaste> = {
  'MD-300L': {
    guindaste: guindastePorId('MD-300L'),
    especificacao: especMD300L as EspecificacaoGuindaste,
    criterioDeGiro: CRITERIOS_DE_GIRO['MD-300L'],
    tabelas: {
      principalVarianteA: tabelaMD300L as TabelaCargaVarianteA[],
      jibVarianteA: tabelaJibMD300L as TabelaJIB[],
    },
  },
  'TM-130': {
    guindaste: guindastePorId('TM-130'),
    especificacao: especTM130 as EspecificacaoGuindaste,
    criterioDeGiro: CRITERIOS_DE_GIRO['TM-130'],
    tabelas: {
      // Lança principal: diagrama polar "Com sapata para lança principal" (Task 10.1,
      // extraído de docs/dados_guindaste_TM-130.xlsx e conferido contra docs/TM_130.pdf).
      principalZonaRaio: tabelaTM130 as TabelaCargaZonaRaio[],
      jibVarianteB: tabelaJibTM130 as TabelaCargaVarianteB[],
    },
  },
}

/** FNV-1a de 32 bits — hash curto e determinístico, suficiente para identificar uma versão de dados. */
function fnv1a(texto: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export const VERSAO_TABELAS = `tabelas-${fnv1a(
  JSON.stringify([guindastesData, tabelaMD300L, tabelaJibMD300L, tabelaTM130, tabelaJibTM130, especMD300L, especTM130]),
)}`

/**
 * Problemas encontrados nos dados (especificações incompletas ou
 * desatualizadas). Vazio = tudo certo. A aplicação mostra esta lista na tela
 * em vez de quebrar lá dentro da cena 3D (ver validarEspecificacao.ts).
 */
export const PROBLEMAS_DE_DADOS: string[] = [
  ...validarEspecificacao(especMD300L, 'MD-300L'),
  ...validarEspecificacao(especTM130, 'TM-130'),
]
