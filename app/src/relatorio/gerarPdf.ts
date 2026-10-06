/**
 * Desenho do relatório em PDF (Épico 16, RF26) com jsPDF + jspdf-autotable,
 * carregados sob demanda (não pesam a abertura do simulador). Este módulo só
 * "pinta" o ModeloRelatorio — todo o conteúdo é decidido e testado em
 * relatorio/modeloRelatorio.ts.
 */
import type { jsPDF as JsPDF } from 'jspdf'
import type { StatusDoCenario } from '../types/cenario'
import type { ModeloCenario, ModeloRelatorio } from './modeloRelatorio'

export interface ImagensDoCenario {
  lateral: string | null
  superior: string | null
}

const MARGEM = 15
const LARGURA_PAGINA = 210
const ALTURA_PAGINA = 297
const LARGURA_UTIL = LARGURA_PAGINA - 2 * MARGEM
const TOPO_CONTEUDO = 24
const LIMITE_INFERIOR = ALTURA_PAGINA - 18

type RGB = [number, number, number]
const AZUL: RGB = [31, 95, 191]
const CINZA_TEXTO: RGB = [93, 105, 118]
const COR_STATUS: Record<StatusDoCenario, RGB> = {
  ok: [30, 142, 62],
  atencao: [199, 119, 0],
  nok: [198, 40, 40],
  sem_dado: [107, 118, 128],
}

/**
 * A fonte padrão do PDF (Helvetica, WinAnsi) tem os acentos do português, mas
 * não símbolos como ≈ ≤ → ●. Eles viram equivalentes legíveis; qualquer outro
 * caractere fora da fonte vira "?" em vez de quebrar o texto.
 */
const TROCAS: Record<string, string> = { '≈': '~', '≤': '<=', '≥': '>=', '→': '->', '←': '<-', '●': '*', '✓': 'OK', '⚠': '!', '∅': 'Ø', '−': '-' }
const EXTRAS_WINANSI = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')
export function paraPdf(texto: string): string {
  return [...texto]
    .map((c) => TROCAS[c] ?? (c.charCodeAt(0) <= 0xff || EXTRAS_WINANSI.has(c) ? c : '?'))
    .join('')
}

interface Contexto {
  doc: JsPDF
  autoTable: (doc: JsPDF, opcoes: Record<string, unknown>) => void
  y: number
}

function finalDaTabela(ctx: Contexto): number {
  return (ctx.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

function garantirEspaco(ctx: Contexto, alturaMm: number) {
  if (ctx.y + alturaMm > LIMITE_INFERIOR) {
    ctx.doc.addPage()
    ctx.y = TOPO_CONTEUDO
  }
}

function titulo(ctx: Contexto, texto: string, tamanho = 11) {
  garantirEspaco(ctx, 12)
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(tamanho)
  ctx.doc.setTextColor(17, 26, 36)
  ctx.doc.text(paraPdf(texto), MARGEM, ctx.y)
  ctx.y += tamanho * 0.5
}

function paragrafo(ctx: Contexto, texto: string, opcoes: { cor?: RGB; tamanho?: number; negrito?: boolean } = {}) {
  const { doc } = ctx
  doc.setFont('helvetica', opcoes.negrito ? 'bold' : 'normal')
  doc.setFontSize(opcoes.tamanho ?? 9)
  doc.setTextColor(...(opcoes.cor ?? ([43, 53, 64] as RGB)))
  const linhas = doc.splitTextToSize(paraPdf(texto), LARGURA_UTIL) as string[]
  garantirEspaco(ctx, linhas.length * 4.2 + 1)
  doc.text(linhas, MARGEM, ctx.y)
  ctx.y += linhas.length * 4.2 + 1.5
}

function tabela(ctx: Contexto, opcoes: { cabecalho?: string[]; corpo: string[][]; larguras?: number[]; colunaDestaque?: boolean }) {
  const colunas: Record<number, { cellWidth: number }> = {}
  opcoes.larguras?.forEach((w, i) => (colunas[i] = { cellWidth: w }))
  ctx.autoTable(ctx.doc, {
    startY: ctx.y,
    margin: { left: MARGEM, right: MARGEM, top: TOPO_CONTEUDO },
    head: opcoes.cabecalho ? [opcoes.cabecalho.map(paraPdf)] : undefined,
    body: opcoes.corpo.map((l) => l.map(paraPdf)),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.3, cellPadding: 1.4, textColor: [43, 53, 64], lineColor: [201, 208, 216], lineWidth: 0.15 },
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold' },
    columnStyles: { ...(opcoes.colunaDestaque ? { 0: { fontStyle: 'bold', fillColor: [244, 246, 248] } } : {}), ...colunas },
  })
  ctx.y = finalDaTabela(ctx) + 5
}

function seloProvisorio(ctx: Contexto) {
  const { doc } = ctx
  garantirEspaco(ctx, 12)
  doc.setFillColor(255, 245, 229)
  doc.setDrawColor(199, 119, 0)
  doc.setLineDashPattern([1.2, 0.8], 0)
  doc.rect(MARGEM, ctx.y - 4, LARGURA_UTIL, 9, 'FD')
  doc.setLineDashPattern([], 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(138, 82, 0)
  doc.text(
    paraPdf('CRITÉRIO DE GIRO PROVISÓRIO — o limite entre as áreas de operação aguarda confirmação do fabricante/empresa.'),
    MARGEM + 2,
    ctx.y + 1.5,
  )
  ctx.y += 9
}

function caixaStatus(ctx: Contexto, cenario: ModeloCenario) {
  const { doc } = ctx
  garantirEspaco(ctx, 12)
  doc.setFillColor(...COR_STATUS[cenario.status.codigo])
  doc.rect(MARGEM, ctx.y - 4.5, LARGURA_UTIL, 8.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(paraPdf(cenario.status.rotulo), MARGEM + 2.5, ctx.y + 1.2)
  ctx.y += 9
}

function imagens(ctx: Contexto, img: ImagensDoCenario | null) {
  if (!img || (!img.lateral && !img.superior)) {
    paragrafo(ctx, 'Capturas da cena indisponíveis nesta emissão.', { cor: CINZA_TEXTO })
    return
  }
  const largura = (LARGURA_UTIL - 6) / 2
  const altura = largura / 1.5
  garantirEspaco(ctx, altura + 10)
  const pares: [string | null, string][] = [
    [img.lateral, 'Vista lateral (plano da lança)'],
    [img.superior, 'Vista superior (planta, com a área de operação no chão)'],
  ]
  pares.forEach(([dados, legenda], i) => {
    const x = MARGEM + i * (largura + 6)
    if (dados) ctx.doc.addImage(dados, 'JPEG', x, ctx.y, largura, altura)
    ctx.doc.setDrawColor(201, 208, 216)
    ctx.doc.rect(x, ctx.y, largura, altura)
    ctx.doc.setFont('helvetica', 'normal')
    ctx.doc.setFontSize(7.5)
    ctx.doc.setTextColor(...CINZA_TEXTO)
    ctx.doc.text(paraPdf(legenda), x, ctx.y + altura + 3.5)
  })
  ctx.y += altura + 8.5
  paragrafo(
    ctx,
    'Legenda do chão: verde = OK, âmbar = acima do limite do engenheiro, vermelho = NOK, cinza hachurado = sem dado do fabricante. Cotas e valores: ver tabelas.',
    { cor: CINZA_TEXTO, tamanho: 7.5 },
  )
}

function capituloDoCenario(ctx: Contexto, c: ModeloCenario, img: ImagensDoCenario | null) {
  titulo(ctx, `Cenário: ${c.nome}`, 13)
  paragrafo(ctx, `${c.guindaste.nome} (${c.guindaste.fabricante}) — dados de: ${c.guindaste.documentoFonte}`, { cor: CINZA_TEXTO, tamanho: 8 })
  caixaStatus(ctx, c)
  tabela(ctx, { corpo: c.resumo, larguras: [55], colunaDestaque: true })
  if (c.criterioGiroProvisorio) seloProvisorio(ctx)
  imagens(ctx, img)

  titulo(ctx, 'Capacidade da tabela do fabricante')
  paragrafo(ctx, c.capacidade.valor, { negrito: true, tamanho: 10 })
  paragrafo(ctx, c.capacidade.origem)
  if (c.capacidade.pontosUsados.length > 0) {
    tabela(ctx, { cabecalho: ['Pontos reais da tabela usados no cálculo'], corpo: c.capacidade.pontosUsados.map((p) => [p]) })
  }
  if (c.motivosSemDado.length > 0) {
    tabela(ctx, { cabecalho: ['Por que não há dado do fabricante'], corpo: c.motivosSemDado.map((m) => [m]) })
  }

  titulo(ctx, 'Somatório de cargas (RF10)')
  tabela(ctx, { cabecalho: ['Item', 'Massa'], corpo: [...c.somatorio.itens, ['TOTAL', c.somatorio.total]], larguras: [140] })

  titulo(ctx, 'Verificações')
  tabela(ctx, {
    cabecalho: ['Verificação', 'Resultado', 'Detalhe'],
    corpo: c.verificacoes.map((v) => [v.descricao, v.aprovada ? 'Aprovada' : 'REPROVADA', v.detalhe]),
    larguras: [80, 22],
  })

  titulo(ctx, 'Parâmetros da operação')
  tabela(ctx, {
    cabecalho: ['Grupo', 'Parâmetro', 'Valor'],
    corpo: c.parametros.map((p) => [p.grupo, `${p.rotulo}${p.aproximado ? ' (~)' : ''}`, p.valor]),
    larguras: [28, 92],
  })
  paragrafo(ctx, '(~) faixa/limite de referência aproximado — não consta nas fichas técnicas; aguarda confirmação.', {
    cor: CINZA_TEXTO,
    tamanho: 7.5,
  })

  titulo(ctx, 'Ambiente (informativo)')
  tabela(ctx, { corpo: c.ambiente, larguras: [55], colunaDestaque: true })

  if (c.avisos.length > 0) {
    titulo(ctx, 'Avisos')
    c.avisos.forEach((a) => paragrafo(ctx, `• ${a}`, { cor: [138, 82, 0] }))
  }
  titulo(ctx, 'Notas da ficha técnica')
  c.notasDaFicha.forEach((n) => paragrafo(ctx, `• ${n}`, { tamanho: 8 }))
}

function blocoDeAssinatura(ctx: Contexto, modelo: ModeloRelatorio) {
  const { doc } = ctx
  garantirEspaco(ctx, 52)
  ctx.y += 2
  doc.setFillColor(253, 232, 232)
  doc.setDrawColor(198, 40, 40)
  const linhas = doc.splitTextToSize(paraPdf(modelo.avisoValidacao), LARGURA_UTIL - 6) as string[]
  const altura = linhas.length * 4.2 + 8
  doc.rect(MARGEM, ctx.y, LARGURA_UTIL, altura, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(92, 20, 20)
  doc.text(paraPdf('VALIDAÇÃO OBRIGATÓRIA PELO ENGENHEIRO RESPONSÁVEL'), MARGEM + 3, ctx.y + 5)
  doc.setFont('helvetica', 'normal')
  doc.text(linhas, MARGEM + 3, ctx.y + 9.5)
  ctx.y += altura + 18

  doc.setDrawColor(43, 53, 64)
  doc.line(MARGEM, ctx.y, MARGEM + 95, ctx.y)
  doc.line(MARGEM + 120, ctx.y, LARGURA_PAGINA - MARGEM, ctx.y)
  doc.setFontSize(8.5)
  doc.setTextColor(43, 53, 64)
  doc.text(paraPdf(`Engenheiro responsável: ${modelo.cabecalho.responsavel}`), MARGEM, ctx.y + 4.5)
  doc.text(paraPdf('CREA / ART nº'), MARGEM, ctx.y + 9)
  doc.text(paraPdf('Data'), MARGEM + 120, ctx.y + 4.5)
  ctx.y += 14
}

function cabecalhoERodape(ctx: Contexto, modelo: ModeloRelatorio) {
  const { doc } = ctx
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...AZUL)
    doc.text(paraPdf('Guindastes Ribas — Plano de içamento'), MARGEM, 12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text(paraPdf(modelo.titulo), LARGURA_PAGINA - MARGEM, 12, { align: 'right' })
    doc.setDrawColor(...AZUL)
    doc.line(MARGEM, 14, LARGURA_PAGINA - MARGEM, 14)

    doc.setFontSize(7.5)
    doc.text(
      paraPdf(
        `Emitido em ${modelo.cabecalho.geradoEm} · ${modelo.cabecalho.versaoTabelas} · critério de giro ${modelo.cabecalho.versaoCriterioGiro}`,
      ),
      MARGEM,
      ALTURA_PAGINA - 8,
    )
    doc.text(paraPdf(`Página ${p} de ${total}`), LARGURA_PAGINA - MARGEM, ALTURA_PAGINA - 8, { align: 'right' })
  }
}

/** Gera o PDF do relatório. `imagens[i]` são as capturas do cenário `modelo.cenarios[i]`. */
export async function gerarPdf(modelo: ModeloRelatorio, imagensPorCenario: (ImagensDoCenario | null)[]): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  doc.setProperties({ title: paraPdf(modelo.titulo), subject: 'Plano de içamento', creator: 'Simulador Guindastes Ribas' })
  const ctx: Contexto = { doc, autoTable: autoTable as unknown as Contexto['autoTable'], y: TOPO_CONTEUDO }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 26, 36)
  doc.text(paraPdf(modelo.titulo), MARGEM, ctx.y)
  ctx.y += 8
  const h = modelo.cabecalho
  tabela(ctx, {
    corpo: [
      ['Cliente', h.cliente],
      ['Obra', h.obra],
      ['Local', h.local],
      ['Responsável técnico', h.responsavel],
      ['Orçamento', h.orcamento],
      ['Emitido em', h.geradoEm],
      ['Versão das tabelas', h.versaoTabelas],
      ['Critério de giro', `${h.versaoCriterioGiro}${modelo.criterioGiroProvisorio ? ' (PROVISÓRIO)' : ''}`],
    ],
    larguras: [45],
    colunaDestaque: true,
  })
  // No relatório de UM cenário o selo já aparece no capítulo, logo abaixo; na capa ele só entra no de orçamento.
  if (modelo.criterioGiroProvisorio && modelo.tipo === 'orcamento') seloProvisorio(ctx)

  if (modelo.comparativo) {
    titulo(ctx, 'Comparativo dos cenários', 12)
    tabela(ctx, {
      cabecalho: ['', ...modelo.comparativo.colunas],
      corpo: modelo.comparativo.linhas.map((l) => [l.rotulo, ...l.valores]),
      colunaDestaque: true,
    })
  }

  modelo.cenarios.forEach((c, i) => {
    if (modelo.tipo === 'orcamento' || i > 0) {
      doc.addPage()
      ctx.y = TOPO_CONTEUDO
    }
    capituloDoCenario(ctx, c, imagensPorCenario[i] ?? null)
  })

  blocoDeAssinatura(ctx, modelo)
  cabecalhoERodape(ctx, modelo)
  return doc.output('blob')
}
