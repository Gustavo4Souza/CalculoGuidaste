/**
 * Ponto de entrada único do motor v3 (Épico 10) — avalia um cenário 100%
 * parametrizável (RF16) aplicando a regra de ouro (RF17):
 *
 * - ponto exato da tabela → valor exato;
 * - entre pontos → interpolação, sempre arredondada para baixo;
 * - fora da cobertura do fabricante (sapata parcial, passagem de cabo
 *   diferente, JIB fora da lança exigida, raio sem célula, giro além do
 *   limite...) → status "sem_dado", com o motivo — nunca um valor inventado.
 *
 * TypeScript puro, sem UI: recebe tudo o que precisa por argumento (tabelas,
 * especificação e critério de giro), montado por data/catalogo.ts.
 */
import type { CriterioDeGiro } from '../config/criteriosDeGiro'
import type {
  AvaliacaoDoCenario,
  ItemDoSomatorio,
  ParametrosDoCenario,
  PosicaoSapata,
  RegiaoDeGiro,
  StatusDoCenario,
  Verificacao,
} from '../types/cenario'
import { POSICOES_SAPATA } from '../types/cenario'
import type { EspecificacaoGuindaste } from '../types/especificacao'
import type {
  Guindaste,
  Quadrante,
  TabelaCargaVarianteA,
  TabelaCargaVarianteB,
  TabelaJIB,
  ZonaDeGiro,
} from '../types/guindaste'
import {
  capacidadeJIBDetalhada,
  capacidadeVarianteADetalhada,
  capacidadeVarianteBDetalhada,
  type CapacidadeDetalhada,
} from './capacidadeDetalhada'
import { classificarGiro } from './classificarGiro'
import { calcularPonta } from './geometriaLanca'
import { formatarNumero } from './texto'

/** Tolerância para comparar uma extensão/comprimento configurado com o valor da ficha, em m. */
const TOLERANCIA_DIMENSAO_M = 1e-3

export interface TabelasDoGuindaste {
  principalVarianteA?: ReadonlyArray<TabelaCargaVarianteA>
  jibVarianteA?: ReadonlyArray<TabelaJIB>
  jibVarianteB?: ReadonlyArray<TabelaCargaVarianteB>
}

export interface ContextoDoGuindaste {
  guindaste: Guindaste
  especificacao: EspecificacaoGuindaste
  criterioDeGiro: CriterioDeGiro
  tabelas: TabelasDoGuindaste
}

const ROTULO_SAPATA: Record<PosicaoSapata, string> = {
  dianteira_esquerda: 'dianteira esquerda',
  dianteira_direita: 'dianteira direita',
  traseira_esquerda: 'traseira esquerda',
  traseira_direita: 'traseira direita',
}

/** Massa do cabo de içamento pendurado (RF20): comprimento por perna × nº de pernas × massa linear. */
export function calcularMassaCaboIcamento(
  comprimentoPendenteM: number,
  numeroDePernas: number,
  massaLinearKgM: number,
): number {
  return Math.max(0, comprimentoPendenteM) * numeroDePernas * massaLinearKgM
}

/**
 * Pernas (passadas de cabo) que a tabela do fabricante assume para um
 * comprimento de lança. Entre duas colunas com passagens diferentes, as duas
 * são aceitas (cada uma é tabelada para um dos lados da interpolação).
 * Vazio = a ficha não informa (sem verificação).
 */
export function pernasPrevistasPelaTabela(especificacao: EspecificacaoGuindaste, comprimentoLancaM: number): number[] {
  const lista = [...especificacao.lanca.pernasPorComprimento].sort((a, b) => a.comprimentoLancaM - b.comprimentoLancaM)
  const exata = lista.find((p) => Math.abs(p.comprimentoLancaM - comprimentoLancaM) <= TOLERANCIA_DIMENSAO_M)
  if (exata) return [exata.pernas]
  for (let i = 0; i < lista.length - 1; i++) {
    if (comprimentoLancaM > lista[i].comprimentoLancaM && comprimentoLancaM < lista[i + 1].comprimentoLancaM) {
      return [...new Set([lista[i].pernas, lista[i + 1].pernas])]
    }
  }
  return []
}

function dentro(valor: number, min: number, max: number, tolerancia = TOLERANCIA_DIMENSAO_M): boolean {
  return valor >= min - tolerancia && valor <= max + tolerancia
}

export function avaliarCenario(p: ParametrosDoCenario, ctx: ContextoDoGuindaste): AvaliacaoDoCenario {
  const { guindaste, especificacao: esp, criterioDeGiro } = ctx
  const motivos: string[] = []
  const jibAtivo = p.jib.ativo

  // --- Limites mecânicos (ficha técnica) -----------------------------------
  const { comprimentoMinM, comprimentoMaxM, anguloMinGraus, anguloMaxGraus } = esp.lanca
  if (!dentro(p.lanca.comprimentoM, comprimentoMinM.valor, comprimentoMaxM.valor)) {
    motivos.push(
      `Comprimento de lança ${formatarNumero(p.lanca.comprimentoM)} m fora do limite mecânico ` +
        `(${formatarNumero(comprimentoMinM.valor)}–${formatarNumero(comprimentoMaxM.valor)} m).`,
    )
  }
  if (!dentro(p.lanca.anguloGraus, anguloMinGraus.valor, anguloMaxGraus.valor, 1e-6)) {
    motivos.push(
      `Ângulo da lança ${formatarNumero(p.lanca.anguloGraus, 1)}° fora do limite mecânico ` +
        `(${anguloMinGraus.valor}°–${anguloMaxGraus.valor}°).`,
    )
  }

  // --- Giro → quadrante/zona (RF18) ----------------------------------------
  const giro = classificarGiro(criterioDeGiro, p.giroGraus)
  const limiteGiro = esp.giro.limiteMecanicoGraus
  if (limiteGiro !== null && Math.abs(giro.normalizadoGraus) > limiteGiro + 1e-6) {
    motivos.push(`Giro ${formatarNumero(giro.normalizadoGraus, 1)}° além do limite mecânico (±${limiteGiro}°).`)
  } else if (giro.regioes.length === 0) {
    motivos.push(`Giro ${formatarNumero(giro.normalizadoGraus, 1)}° fora das áreas cobertas pela tabela.`)
  }

  // --- Sapatas: só a extensão máxima é tabelada ----------------------------
  for (const posicao of POSICOES_SAPATA) {
    const par = posicao.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
    const extensao = p.sapatas[posicao]
    if (Math.abs(extensao - par.estendidaM.valor) > TOLERANCIA_DIMENSAO_M) {
      motivos.push(
        `Sapata ${ROTULO_SAPATA[posicao]} com extensão de ${formatarNumero(extensao)} m — o fabricante só ` +
          `tabela a extensão máxima (${formatarNumero(par.estendidaM.valor)} m).`,
      )
    }
  }

  // --- JIB -----------------------------------------------------------------
  if (jibAtivo) {
    if (!guindaste.possuiJIB || !esp.jib.habilitado) {
      motivos.push(`JIB não habilitado para o ${guindaste.nome}.`)
    } else if (
      esp.jib.comprimentoLancaExigidoM !== null &&
      Math.abs(p.lanca.comprimentoM - esp.jib.comprimentoLancaExigidoM) > TOLERANCIA_DIMENSAO_M
    ) {
      motivos.push(
        `A tabela de JIB exige a lança principal em ${formatarNumero(esp.jib.comprimentoLancaExigidoM)} m ` +
          `(configurada: ${formatarNumero(p.lanca.comprimentoM)} m).`,
      )
    }
  }

  // --- Passagem de cabo prevista pela tabela -------------------------------
  const pernasPrevistas = jibAtivo
    ? esp.jib.pernas === null
      ? []
      : [esp.jib.pernas]
    : pernasPrevistasPelaTabela(esp, p.lanca.comprimentoM)
  if (pernasPrevistas.length > 0 && !pernasPrevistas.includes(p.cabo.numeroDePernas)) {
    motivos.push(
      `Cabo com ${p.cabo.numeroDePernas} perna(s) — a tabela prevê ${pernasPrevistas.join(' ou ')} ` +
        `para esta configuração.`,
    )
  }

  // --- Geometria ------------------------------------------------------------
  const ponta = calcularPonta(
    { alturaPeDaLancaM: esp.lanca.alturaPeM.valor, recuoPeDaLancaM: esp.lanca.recuoPeM.valor },
    {
      comprimentoLancaM: p.lanca.comprimentoM,
      anguloLancaGraus: p.lanca.anguloGraus,
      jib: jibAtivo ? { comprimentoM: p.jib.comprimentoM, anguloGraus: p.jib.anguloGraus } : null,
    },
  )
  const alturaGanchoNoSoloM = p.carga.alturaM + p.acessorios.alturaLingadaM
  const comprimentoCaboPendenteM = Math.max(0, ponta.alturaM - alturaGanchoNoSoloM)

  // --- Capacidade da tabela (menor entre as regiões, na fronteira) ---------
  const porRegiao = giro.regioes.map((regiao) => ({ regiao, cap: capacidadeNaRegiao(p, ctx, regiao, ponta.raioM) }))
  for (const { cap } of porRegiao) {
    if (cap.motivoSemDado) motivos.push(cap.motivoSemDado)
  }
  let escolhida: { regiao: RegiaoDeGiro; cap: CapacidadeDetalhada } | null = null
  if (motivos.length === 0 && porRegiao.length > 0) {
    escolhida = porRegiao.reduce((menor, atual) =>
      (atual.cap.capacidadeKg as number) < (menor.cap.capacidadeKg as number) ? atual : menor,
    )
  }
  const capacidadeKg = escolhida?.cap.capacidadeKg ?? null

  // --- Somatório de cargas (RF09/RF10/RF20) ---------------------------------
  const itens: ItemDoSomatorio[] = [{ descricao: 'Carga içada', massaKg: p.carga.pesoKg, origem: 'informado' }]
  itens.push({ descricao: 'Lingada', massaKg: p.acessorios.massaLingadaKg, origem: 'informado' })

  if (p.cabo.massaSobrescritaKg !== null) {
    itens.push({ descricao: 'Cabo de içamento (valor manual)', massaKg: p.cabo.massaSobrescritaKg, origem: 'sobrescrito' })
  } else if (p.cabo.massaLinearKgM !== null) {
    itens.push({
      descricao:
        `Cabo de içamento (${formatarNumero(comprimentoCaboPendenteM)} m × ${p.cabo.numeroDePernas} perna(s) × ` +
        `${formatarNumero(p.cabo.massaLinearKgM, 3)} kg/m)`,
      massaKg: calcularMassaCaboIcamento(comprimentoCaboPendenteM, p.cabo.numeroDePernas, p.cabo.massaLinearKgM),
      origem: 'calculado',
    })
  } else {
    motivos.push('Massa linear do cabo de içamento não informada (não consta nas fichas) — informe ou sobrescreva a massa do cabo.')
  }

  if (p.acessorios.usaBalancim) {
    itens.push({ descricao: 'Balancim', massaKg: p.acessorios.massaBalancimKg, origem: 'informado' })
  }

  const ganchoDeReferenciaKg = jibAtivo ? esp.jib.massaGanchoIncluidaNaTabelaKg : esp.moitao.massaGanchoIncluidaNaTabelaKg
  if (ganchoDeReferenciaKg !== null) {
    // A tabela já desconta o gancho de referência: só entra o que passar dele.
    if (p.moitao.massaKg !== null && p.moitao.massaKg > ganchoDeReferenciaKg) {
      itens.push({
        descricao: `Moitão — excedente sobre o gancho já incluído na tabela (${formatarNumero(ganchoDeReferenciaKg, 0)} kg)`,
        massaKg: p.moitao.massaKg - ganchoDeReferenciaKg,
        origem: 'calculado',
      })
    }
  } else if (p.moitao.massaKg !== null) {
    itens.push({ descricao: 'Moitão (a ficha não informa se a tabela o inclui)', massaKg: p.moitao.massaKg, origem: 'informado' })
  } else {
    motivos.push('Massa do moitão não informada — a ficha não diz se a tabela já a inclui.')
  }

  const totalKg = itens.reduce((soma, i) => soma + i.massaKg, 0)

  // --- Verificações ----------------------------------------------------------
  const verificacoes: Verificacao[] = []
  const percentualUtilizacao = capacidadeKg === null || capacidadeKg === 0 ? null : (totalKg / capacidadeKg) * 100

  if (capacidadeKg !== null) {
    verificacoes.push({
      id: 'capacidade',
      descricao: 'Somatório de cargas ≤ capacidade da tabela',
      aprovada: totalKg <= capacidadeKg,
      detalhe: `${formatarNumero(totalKg, 0)} kg de ${formatarNumero(capacidadeKg, 0)} kg`,
    })
    verificacoes.push({
      id: 'limite_engenheiro',
      descricao: `Utilização ≤ limite definido pelo engenheiro (${formatarNumero(p.limiteUtilizacaoPercentual, 0)}%)`,
      aprovada: (percentualUtilizacao ?? 0) <= p.limiteUtilizacaoPercentual + 1e-9,
      detalhe: `${formatarNumero(percentualUtilizacao ?? 0, 1)}% da capacidade`,
    })
  }

  const cargaPorPernaKg = esp.cabo.cargaMaximaPorPernaKg.valor
  const limitePernasKg = cargaPorPernaKg * p.cabo.numeroDePernas
  verificacoes.push({
    id: 'carga_por_perna',
    descricao: `Somatório ≤ nº de pernas × ${formatarNumero(cargaPorPernaKg, 0)} kg por perna (ficha)`,
    aprovada: totalKg <= limitePernasKg,
    detalhe: `${formatarNumero(totalKg, 0)} kg de ${formatarNumero(limitePernasKg, 0)} kg (${p.cabo.numeroDePernas} perna(s))`,
  })

  if (p.alturaIcamentoNecessariaM !== null) {
    const necessariaM = p.alturaIcamentoNecessariaM + p.carga.alturaM + p.acessorios.alturaLingadaM
    const disponivelM = ponta.alturaM - esp.moitao.distanciaMinimaPontaAoGanchoM.valor
    verificacoes.push({
      id: 'altura_icamento',
      descricao: 'Altura de içamento alcançada',
      aprovada: necessariaM <= disponivelM + 1e-9,
      detalhe:
        `gancho precisa chegar a ${formatarNumero(necessariaM)} m; alcança ${formatarNumero(disponivelM)} m ` +
        `(ponta a ${formatarNumero(ponta.alturaM)} m)`,
    })
  }

  return {
    status: definirStatus(verificacoes, motivos, capacidadeKg),
    geometria: {
      raioM: ponta.raioM,
      alturaPontaM: ponta.alturaM,
      alturaGanchoNoSoloM,
      comprimentoCaboPendenteM,
    },
    giro: {
      normalizadoGraus: giro.normalizadoGraus,
      regioes: giro.regioes,
      criterioProvisorio: criterioDeGiro.provisorio,
    },
    capacidade: {
      capacidadeKg,
      origem: escolhida?.cap.origem ?? null,
      pontosUsados: escolhida?.cap.pontosUsados ?? [],
      regiao: escolhida?.regiao ?? null,
    },
    somatorio: { itens, totalKg },
    percentualUtilizacao,
    verificacoes,
    motivosSemDado: [...new Set(motivos)],
  }
}

function definirStatus(verificacoes: Verificacao[], motivos: string[], capacidadeKg: number | null): StatusDoCenario {
  const reprovada = (id: Verificacao['id']) => verificacoes.some((v) => v.id === id && !v.aprovada)
  // Reprovações independentes da cobertura da tabela são definitivas.
  if (reprovada('capacidade') || reprovada('carga_por_perna') || reprovada('altura_icamento')) return 'nok'
  if (motivos.length > 0 || capacidadeKg === null) return 'sem_dado'
  if (reprovada('limite_engenheiro')) return 'atencao'
  return 'ok'
}

function capacidadeNaRegiao(
  p: ParametrosDoCenario,
  ctx: ContextoDoGuindaste,
  regiao: RegiaoDeGiro,
  raioM: number,
): CapacidadeDetalhada {
  const { guindaste, especificacao, tabelas } = ctx
  const semTabela = (motivo: string): CapacidadeDetalhada => ({
    capacidadeKg: null,
    origem: null,
    pontosUsados: [],
    motivoSemDado: motivo,
  })

  if (p.jib.ativo) {
    if (tabelas.jibVarianteA) {
      return capacidadeJIBDetalhada(tabelas.jibVarianteA, p.jib.comprimentoM, p.jib.anguloGraus, raioM, regiao as Quadrante)
    }
    if (tabelas.jibVarianteB) {
      return capacidadeVarianteBDetalhada(tabelas.jibVarianteB, p.lanca.anguloGraus, regiao as ZonaDeGiro, 'JIB')
    }
    return semTabela(`Não há tabela de JIB para o ${guindaste.nome}.`)
  }

  if (especificacao.tipoTabelaPrincipal === 'comprimento_raio_quadrante' && tabelas.principalVarianteA) {
    return capacidadeVarianteADetalhada(tabelas.principalVarianteA, p.lanca.comprimentoM, raioM, regiao as Quadrante)
  }
  if (especificacao.tipoTabelaPrincipal === 'zona_raio_faixas') {
    // Épico 10, Task 10.1 — aguardando a transcrição do diagrama polar
    // "Com sapata para lança principal" (docs/TM_130.pdf, p.2) para a planilha.
    return semTabela(
      `Tabela da lança principal do ${guindaste.nome} (diagrama polar por raio) ainda não transcrita da ficha — pendente.`,
    )
  }
  return semTabela(`Não há tabela da lança principal para o ${guindaste.nome}.`)
}
