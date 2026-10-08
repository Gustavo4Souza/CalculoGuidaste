/**
 * Modelo do relatório (Épico 16, RF26) — TUDO o que vai no PDF, já calculado
 * e formatado, sem nenhuma dependência de desenho. O PDF em si
 * (relatorio/gerarPdf.ts) só "pinta" este modelo; é este módulo que se testa.
 *
 * O relatório RECALCULA cada cenário com as tabelas atuais (o que se entrega
 * ao cliente tem que refletir os dados vigentes) e avisa explicitamente se o
 * cenário foi salvo com outra versão das tabelas ou do critério de giro.
 */
import { CRITERIOS_DE_GIRO, VERSAO_CRITERIO_GIRO } from '../config/criteriosDeGiro'
import { CATALOGO, VERSAO_TABELAS } from '../data/catalogo'
import { avaliarCenario } from '../engine/avaliarCenario'
import { rotuloRegiao } from '../engine/capacidadeDetalhada'
import type { AvaliacaoDoCenario, ParametrosDoCenario, PosicaoSapata, StatusDoCenario } from '../types/cenario'
import { POSICOES_SAPATA } from '../types/cenario'
import { ehAproximado } from '../types/especificacao'
import type { CenarioSalvo, Orcamento, Projeto } from '../types/projeto'

export interface LinhaParametro {
  grupo: string
  rotulo: string
  valor: string
  /** Valor de referência que não consta nas fichas (selo ≈). */
  aproximado: boolean
}

export interface Cabecalho {
  cliente: string
  obra: string
  local: string
  responsavel: string
  orcamento: string
  geradoEm: string
  versaoTabelas: string
  versaoCriterioGiro: string
}

export interface ModeloCenario {
  nome: string
  guindaste: { nome: string; fabricante: string; documentoFonte: string }
  status: { codigo: StatusDoCenario; rotulo: string }
  resumo: [string, string][]
  parametros: LinhaParametro[]
  somatorio: { itens: [string, string][]; total: string }
  capacidade: { valor: string; origem: string; pontosUsados: string[] }
  verificacoes: { descricao: string; aprovada: boolean; detalhe: string }[]
  motivosSemDado: string[]
  avisos: string[]
  ambiente: [string, string][]
  notasDaFicha: string[]
  criterioGiroProvisorio: boolean
}

export interface ModeloRelatorio {
  tipo: 'cenario' | 'orcamento'
  titulo: string
  cabecalho: Cabecalho
  /** Só no relatório de orçamento (2+ cenários): linhas × cenários. */
  comparativo: { colunas: string[]; linhas: { rotulo: string; valores: string[] }[] } | null
  cenarios: ModeloCenario[]
  /** Algum cenário usa o critério de giro provisório → selo na capa. */
  criterioGiroProvisorio: boolean
  avisoValidacao: string
}

export const AVISO_VALIDACAO =
  'Este plano de içamento foi gerado por simulação a partir das tabelas de carga do fabricante e deve ser ' +
  'conferido e validado pelo engenheiro responsável antes da operação. A capacidade só é informada onde a ' +
  'tabela do fabricante cobre a configuração; valores interpolados são sempre arredondados para baixo.'

export const ROTULO_STATUS: Record<StatusDoCenario, string> = {
  ok: 'OPERAÇÃO APROVADA — dentro do limite',
  atencao: 'APROVADA COM ATENÇÃO — acima do limite definido pelo engenheiro',
  nok: 'OPERAÇÃO REPROVADA',
  sem_dado: 'OPERAÇÃO NÃO VALIDADA — sem dado do fabricante',
}

// ------------------------------------------------------------- formatação

function numero(v: number, casas = 2): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
const m = (v: number) => `${numero(v)} m`
const graus = (v: number) => `${numero(v, 1)}°`
const kg = (v: number) => `${Math.round(v).toLocaleString('pt-BR')} kg`
const opcional = (v: number | null, f: (x: number) => string, vazio = 'não informado') => (v === null ? vazio : f(v))

function dataHora(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const ROTULO_CHAVE: Record<string, string> = {
  comprimentoLancaM: 'lança',
  raioM: 'raio',
  anguloJibGraus: 'JIB',
  anguloLancaGraus: 'ângulo',
  zona: 'zona',
}

function textoChaves(chaves: Record<string, number | string>): string {
  return Object.entries(chaves)
    .map(([k, v]) => {
      const rotulo = ROTULO_CHAVE[k] ?? k
      if (typeof v !== 'number') return `${rotulo} ${v}`
      return k.endsWith('Graus') ? `${rotulo} ${graus(v)}` : `${rotulo} ${m(v)}`
    })
    .join(', ')
}

const ROTULO_SAPATA: Record<PosicaoSapata, string> = {
  dianteira_esquerda: 'Sapata dianteira esquerda',
  dianteira_direita: 'Sapata dianteira direita',
  traseira_esquerda: 'Sapata traseira esquerda',
  traseira_direita: 'Sapata traseira direita',
}

// ------------------------------------------------------------ montagem

/** Parâmetros completos do cenário, agrupados, com o selo ≈ onde o limite vem de valor aproximado. */
function linhasDeParametros(p: ParametrosDoCenario, a: AvaliacaoDoCenario): LinhaParametro[] {
  const esp = CATALOGO[p.guindasteId].especificacao
  const linhas: LinhaParametro[] = []
  const add = (grupo: string, rotulo: string, valor: string, aproximado = false) =>
    linhas.push({ grupo, rotulo, valor, aproximado })

  add('Lança', 'Comprimento da lança', m(p.lanca.comprimentoM), ehAproximado(esp.lanca.comprimentoMaxM))
  add('Lança', 'Ângulo da lança (em relação à horizontal)', graus(p.lanca.anguloGraus), ehAproximado(esp.lanca.anguloMaxGraus))
  add('Lança', 'Raio de trabalho (do centro de giro)', m(a.geometria.raioM))
  add('Lança', 'Altura da ponta (do solo)', m(a.geometria.alturaPontaM))
  add('Giro', 'Giro da superestrutura', graus(a.giro.normalizadoGraus))
  add('Giro', 'Área de operação (derivada do giro)', a.giro.regioes.map(rotuloRegiao).join(' / ') || 'fora das áreas da tabela')
  if (p.jib.ativo) {
    add('JIB', 'Comprimento do JIB', m(p.jib.comprimentoM))
    add('JIB', 'Ângulo do JIB (offset em relação à lança)', graus(p.jib.anguloGraus))
  } else {
    add('JIB', 'JIB', 'não utilizado')
  }
  for (const pos of POSICOES_SAPATA) {
    const par = pos.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
    const naMaxima = Math.abs(p.sapatas[pos] - par.estendidaM.valor) < 1e-3
    add('Sapatas', ROTULO_SAPATA[pos], `${m(p.sapatas[pos])}${naMaxima ? ' (extensão máxima)' : ' (extensão parcial)'}`)
  }
  add('Cabo e moitão', 'Nº de pernas do cabo', opcional(p.cabo.numeroDePernas, String))
  add('Cabo e moitão', 'Massa linear do cabo', opcional(p.cabo.massaLinearKgM, (v) => `${numero(v, 3)} kg/m`))
  add('Cabo e moitão', 'Massa do cabo (valor manual)', opcional(p.cabo.massaSobrescritaKg, kg, 'cálculo automático'))
  add('Cabo e moitão', 'Comprimento de cabo pendente por perna', m(a.geometria.comprimentoCaboPendenteM))
  add('Cabo e moitão', 'Massa do moitão/gancho', opcional(p.moitao.massaKg, kg))
  add('Carga', 'Descrição', p.carga.descricao || '—')
  add('Carga', 'Peso da carga', kg(p.carga.pesoKg))
  add('Carga', 'Dimensões (C × L × A)', `${m(p.carga.comprimentoM)} × ${m(p.carga.larguraM)} × ${m(p.carga.alturaM)}`)
  const cg = p.carga.centroDeGravidade
  add('Carga', 'Centro de gravidade (dx, dy, dz)', `${m(cg.dx)}, ${m(cg.dy)}, ${m(cg.dz)}`)
  add('Acessórios', 'Massa da lingada', kg(p.acessorios.massaLingadaKg))
  add('Acessórios', 'Altura da lingada (gancho → topo da carga)', m(p.acessorios.alturaLingadaM))
  add('Acessórios', 'Balancim', p.acessorios.usaBalancim ? kg(p.acessorios.massaBalancimKg) : 'não utilizado')
  add('Limites', 'Altura de içamento necessária (base da carga)', opcional(p.alturaIcamentoNecessariaM, m))
  add('Limites', 'Limite de utilização definido pelo engenheiro', `${numero(p.limiteUtilizacaoPercentual, 0)}%`)
  return linhas
}

function versoesDoCenarioSalvo(salvo: CenarioSalvo | undefined): string[] {
  if (!salvo) return []
  const avisos: string[] = []
  if (salvo.versaoTabelas !== VERSAO_TABELAS) {
    avisos.push(
      `O cenário foi salvo com outra versão das tabelas (${salvo.versaoTabelas}); este relatório foi recalculado com a versão atual (${VERSAO_TABELAS}).`,
    )
  }
  if (salvo.versaoCriterioGiro !== VERSAO_CRITERIO_GIRO) {
    avisos.push(
      `O cenário foi salvo com outro critério de giro (${salvo.versaoCriterioGiro}); este relatório foi recalculado com o atual (${VERSAO_CRITERIO_GIRO}).`,
    )
  }
  return avisos
}

export function montarModeloCenario(parametros: ParametrosDoCenario, nome: string, salvo?: CenarioSalvo): ModeloCenario {
  const ctx = CATALOGO[parametros.guindasteId]
  const esp = ctx.especificacao
  const a = avaliarCenario(parametros, ctx)
  const provisorio = CRITERIOS_DE_GIRO[parametros.guindasteId]?.provisorio ?? false
  const cap = a.capacidade

  const avisos = [...versoesDoCenarioSalvo(salvo)]
  if (provisorio) {
    avisos.push(
      `Critério de giro provisório (${ctx.criterioDeGiro.justificativa}) — aguardando confirmação; a área de operação pode mudar.`,
    )
  }
  if (ctx.criterioDeGiro.aviso) avisos.push(ctx.criterioDeGiro.aviso)
  if (!salvo) avisos.push('Cenário não salvo em um orçamento no momento da emissão.')

  return {
    nome,
    guindaste: { nome: ctx.guindaste.nome, fabricante: ctx.guindaste.fabricante, documentoFonte: esp.documentoFonte },
    status: { codigo: a.status, rotulo: ROTULO_STATUS[a.status] },
    resumo: [
      ['Capacidade da tabela', cap.capacidadeKg === null ? 'sem dado do fabricante' : kg(cap.capacidadeKg)],
      ['Somatório de cargas', kg(a.somatorio.totalKg)],
      ['Utilização', a.percentualUtilizacao === null ? '—' : `${numero(a.percentualUtilizacao, 1)}%`],
      ['Raio de trabalho', m(a.geometria.raioM)],
      ['Área de operação', a.giro.regioes.map(rotuloRegiao).join(' / ') || '—'],
    ],
    parametros: linhasDeParametros(parametros, a),
    somatorio: { itens: a.somatorio.itens.map((i) => [i.descricao, kg(i.massaKg)]), total: kg(a.somatorio.totalKg) },
    capacidade: {
      valor: cap.capacidadeKg === null ? 'Sem dado do fabricante — operação não validada' : kg(cap.capacidadeKg),
      origem:
        cap.capacidadeKg === null
          ? 'A tabela do fabricante não cobre esta configuração (ver motivos).'
          : cap.origem === 'exato'
            ? `Ponto exato da tabela (${cap.regiao ? rotuloRegiao(cap.regiao) : ''}).`
            : `Interpolado entre os pontos abaixo e arredondado para baixo (${cap.regiao ? rotuloRegiao(cap.regiao) : ''}).`,
      pontosUsados: cap.pontosUsados.map((pt) => `${pt.tabela}: ${textoChaves(pt.chaves)} → ${kg(pt.capacidadeKg)}`),
    },
    verificacoes: a.verificacoes.map((v) => ({ descricao: v.descricao, aprovada: v.aprovada, detalhe: v.detalhe })),
    motivosSemDado: a.motivosSemDado,
    avisos,
    ambiente: [
      ['Vento máximo previsto', opcional(parametros.ambiente.ventoMaximoMS, (v) => `${numero(v, 1)} m/s`)],
      ['Pressão admissível do solo', opcional(parametros.ambiente.pressaoAdmissivelSoloKgfCm2, (v) => `${numero(v)} kgf/cm²`)],
      ['Observação', 'Informativos: as fichas não trazem dados de vento nem de pressão nas sapatas para verificação.'],
    ],
    notasDaFicha: esp.notas,
    criterioGiroProvisorio: provisorio,
  }
}

function cabecalho(agora: Date, projeto?: Projeto, orcamento?: Orcamento): Cabecalho {
  return {
    cliente: projeto?.cliente || '—',
    obra: projeto?.obra || '—',
    local: projeto?.local || '—',
    responsavel: projeto?.responsavel || '—',
    orcamento: orcamento?.nome || '—',
    geradoEm: dataHora(agora),
    versaoTabelas: VERSAO_TABELAS,
    versaoCriterioGiro: VERSAO_CRITERIO_GIRO,
  }
}

/** Relatório de UM cenário (o da tela, salvo ou não). */
export function montarRelatorioCenario(entrada: {
  parametros: ParametrosDoCenario
  nome: string
  salvo?: CenarioSalvo
  projeto?: Projeto
  orcamento?: Orcamento
  agora?: Date
}): ModeloRelatorio {
  const cenario = montarModeloCenario(entrada.parametros, entrada.nome, entrada.salvo)
  return {
    tipo: 'cenario',
    titulo: `Plano de içamento — ${entrada.nome}`,
    cabecalho: cabecalho(entrada.agora ?? new Date(), entrada.projeto, entrada.orcamento),
    comparativo: null,
    cenarios: [cenario],
    criterioGiroProvisorio: cenario.criterioGiroProvisorio,
    avisoValidacao: AVISO_VALIDACAO,
  }
}

/** Relatório de um ORÇAMENTO inteiro: capa, comparativo dos cenários e um capítulo por cenário. */
export function montarRelatorioOrcamento(entrada: {
  projeto: Projeto
  orcamento: Orcamento
  cenarios: CenarioSalvo[]
  agora?: Date
}): ModeloRelatorio {
  const modelos = entrada.cenarios.map((c) => montarModeloCenario(c.parametros, c.nome, c))
  const linha = (rotulo: string, f: (mc: ModeloCenario, c: CenarioSalvo) => string) => ({
    rotulo,
    valores: modelos.map((mc, i) => f(mc, entrada.cenarios[i])),
  })
  const resumo = (mc: ModeloCenario, chave: string) => mc.resumo.find(([k]) => k === chave)?.[1] ?? '—'
  const parametro = (mc: ModeloCenario, rotulo: string) => mc.parametros.find((p) => p.rotulo === rotulo)?.valor ?? '—'

  return {
    tipo: 'orcamento',
    titulo: `Orçamento — ${entrada.orcamento.nome}`,
    cabecalho: cabecalho(entrada.agora ?? new Date(), entrada.projeto, entrada.orcamento),
    comparativo:
      modelos.length >= 2
        ? {
            colunas: modelos.map((mc) => mc.nome),
            linhas: [
              linha('Status', (mc) => mc.status.rotulo.split(' — ')[0]),
              linha('Guindaste', (mc) => mc.guindaste.nome),
              linha('Lança', (mc) => `${parametro(mc, 'Comprimento da lança')} a ${parametro(mc, 'Ângulo da lança (em relação à horizontal)')}`),
              linha('JIB', (_mc, c) => (c.parametros.jib.ativo ? `${m(c.parametros.jib.comprimentoM)} a ${graus(c.parametros.jib.anguloGraus)}` : '—')),
              linha('Raio de trabalho', (mc) => resumo(mc, 'Raio de trabalho')),
              linha('Área de operação', (mc) => resumo(mc, 'Área de operação')),
              linha('Carga', (_mc, c) => kg(c.parametros.carga.pesoKg)),
              linha('Somatório de cargas', (mc) => resumo(mc, 'Somatório de cargas')),
              linha('Capacidade da tabela', (mc) => resumo(mc, 'Capacidade da tabela')),
              linha('Utilização', (mc) => resumo(mc, 'Utilização')),
            ],
          }
        : null,
    cenarios: modelos,
    criterioGiroProvisorio: modelos.some((mc) => mc.criterioGiroProvisorio),
    avisoValidacao: AVISO_VALIDACAO,
  }
}
