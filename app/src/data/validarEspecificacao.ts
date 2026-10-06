/**
 * Validação das especificações técnicas (data/especificacoes/*.json).
 *
 * Motivo (bug de 05/10/2026): um JSON de especificação desatualizado — sem o
 * bloco `caminhao` acrescentado no Épico 13 — só aparecia como
 * "Cannot read properties of undefined (reading 'dianteiraM')" lá dentro da
 * cena 3D, e a tela ficava em branco. Agora o que falta é dito pelo nome.
 *
 * Devolve a lista de problemas (vazia = ok) em vez de lançar erro: o
 * catálogo é montado na importação do módulo, ANTES do React existir — um
 * erro ali voltaria a deixar a tela em branco.
 */

/** Campos `{ valor, fonte }` obrigatórios, por caminho. */
const VALORES_COM_FONTE = [
  'lanca.comprimentoMinM',
  'lanca.comprimentoMaxM',
  'lanca.numeroDeSecoes',
  'lanca.anguloMinGraus',
  'lanca.anguloMaxGraus',
  'lanca.alturaPeM',
  'lanca.recuoPeM',
  'sapatas.dianteiras.estendidaM',
  'sapatas.dianteiras.recolhidaM',
  'sapatas.traseiras.estendidaM',
  'sapatas.traseiras.recolhidaM',
  'cabo.cargaMaximaPorPernaKg',
  'moitao.distanciaMinimaPontaAoGanchoM',
  'caminhao.dianteiraM',
  'caminhao.traseiraM',
  'caminhao.sapataDianteiraM',
  'caminhao.sapataTraseiraM',
  'caminhao.larguraM',
  'caminhao.bitolaM',
  'caminhao.alturaChassiM',
  'caminhao.cabineComprimentoM',
  'caminhao.cabineAlturaM',
  'superestrutura.raioTraseiroM',
  'superestrutura.alturaBaseM',
  'superestrutura.alturaTopoM',
  'superestrutura.larguraM',
]

type Objeto = Record<string, unknown>

function ler(o: unknown, caminho: string): unknown {
  return caminho
    .split('.')
    .reduce<unknown>((atual, chave) => (typeof atual === 'object' && atual !== null ? (atual as Objeto)[chave] : undefined), o)
}

function ehValorComFonte(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false
  const { valor, fonte } = v as Objeto
  return typeof valor === 'number' && Number.isFinite(valor) && typeof fonte === 'string'
}

export function validarEspecificacao(esp: unknown, nome: string): string[] {
  const problemas: string[] = []
  const falta = (caminho: string, oQue = '{ valor, fonte }') =>
    problemas.push(`Especificação do ${nome}: "${caminho}" ausente ou inválido (esperado ${oQue}).`)

  if (typeof esp !== 'object' || esp === null) {
    return [`Especificação do ${nome}: arquivo vazio ou inválido.`]
  }
  for (const caminho of VALORES_COM_FONTE) {
    if (!ehValorComFonte(ler(esp, caminho))) falta(caminho)
  }

  const eixos = ler(esp, 'caminhao.eixosM')
  if (!Array.isArray(eixos) || eixos.length === 0 || !eixos.every(ehValorComFonte)) {
    falta('caminhao.eixosM', 'lista de { valor, fonte }')
  }
  if (!Array.isArray(ler(esp, 'lanca.pernasPorComprimento'))) falta('lanca.pernasPorComprimento', 'lista')
  if (!Array.isArray(ler(esp, 'jib.comprimentosM'))) falta('jib.comprimentosM', 'lista de números')
  const giroZero = ler(esp, 'giroZeroApontaPara')
  if (giroZero !== 'frente' && giroZero !== 'traseira') falta('giroZeroApontaPara', '"frente" ou "traseira"')
  const tabela = ler(esp, 'tipoTabelaPrincipal')
  if (tabela !== 'comprimento_raio_quadrante' && tabela !== 'zona_raio') {
    falta('tipoTabelaPrincipal', '"comprimento_raio_quadrante" ou "zona_raio"')
  }
  const limiteGiro = ler(esp, 'giro.limiteMecanicoGraus')
  if (limiteGiro !== null && typeof limiteGiro !== 'number') falta('giro.limiteMecanicoGraus', 'número ou null')

  return problemas
}
