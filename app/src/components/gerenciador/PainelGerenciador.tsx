import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Info,
  ListTree,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react'
import { CATALOGO } from '../../data/catalogo'
import { rotuloRegiao } from '../../engine/capacidadeDetalhada'
import { formatarMassa, useInterfaceStore } from '../../store/useInterfaceStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import type { AvaliacaoDoCenario, ParametrosDoCenario } from '../../types/cenario'
import { estadoDosNos, mensagemDoNo, nosDaArvore, TITULO_NO, type EstadoDoNo, type IdNo } from './nos'
import { ICONE_NO } from './icones'
import { PropriedadesDoNo } from './PropriedadesDoNo'


const ESTADO: Record<EstadoDoNo, { Icone: LucideIcon; texto: string }> = {
  ok: { Icone: CircleCheck, texto: 'completo' },
  falta: { Icone: CircleHelp, texto: 'falta dado — operação não validada' },
  atencao: { Icone: CircleAlert, texto: 'acima do limite do engenheiro' },
  reprovado: { Icone: CircleX, texto: 'reprovado' },
}

const fmt = (v: number, casas = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

/** Resumo do valor atual de cada nó, visível na árvore sem abrir o nó. */
function resumoDoNo(no: IdNo, c: ParametrosDoCenario, a: AvaliacaoDoCenario, kg: (v: number) => string): string {
  const ctx = CATALOGO[c.guindasteId]
  switch (no) {
    case 'guindaste':
      return ctx.guindaste.fabricante
    case 'lanca':
      return `${fmt(c.lanca.comprimentoM)} m · ${fmt(c.lanca.anguloGraus, 1)}° · R ${fmt(a.geometria.raioM)} m`
    case 'giro':
      return `${fmt(a.giro.normalizadoGraus, 1)}° · ${a.giro.regioes.map(rotuloRegiao).join(' / ') || 'fora da tabela'}`
    case 'jib':
      return `${fmt(c.jib.comprimentoM, 1)} m · ${fmt(c.jib.anguloGraus, 1)}°`
    case 'sapatas': {
      const esp = ctx.especificacao
      const naMaxima = (Object.keys(c.sapatas) as (keyof typeof c.sapatas)[]).every((pos) => {
        const par = pos.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
        return Math.abs(c.sapatas[pos] - par.estendidaM.valor) < 1e-3
      })
      return naMaxima ? 'extensão máxima' : 'extensão parcial'
    }
    case 'cabo':
      return `${c.cabo.numeroDePernas ?? '?'} perna(s) · ${c.cabo.massaLinearKgM === null && c.cabo.massaSobrescritaKg === null ? 'massa não informada' : 'massa informada'}`
    case 'carga':
      return kg(c.carga.pesoKg)
    case 'acessorios':
      return `lingada ${kg(c.acessorios.massaLingadaKg)}${c.acessorios.usaBalancim ? ' · balancim' : ''}`
    case 'limites':
      return `limite ${c.limiteUtilizacaoPercentual}%`
    case 'ambiente':
      return 'informativo'
  }
}

function IconeEstado({ estado }: { estado: EstadoDoNo }) {
  const { Icone, texto } = ESTADO[estado]
  return (
    <span className={`estado-no estado-no--${estado}`} title={texto}>
      <Icone size={14} aria-hidden="true" />
      <span className="sr-only">{texto}</span>
    </span>
  )
}

function LinhaDaArvore({ no, raiz = false, titulo, resumo, estado, aoAbrir }: {
  no: IdNo
  raiz?: boolean
  titulo: string
  resumo: string
  estado: EstadoDoNo
  aoAbrir: (no: IdNo) => void
}) {
  const Icone = ICONE_NO[no]
  return (
    <li className={raiz ? 'fm__raiz' : 'fm__filho'}>
      <button type="button" className="fm__no" aria-label={titulo} onClick={() => aoAbrir(no)}>
        <Icone size={16} aria-hidden="true" className="fm__icone" />
        <span className="fm__titulo">{titulo}</span>
        <span className="fm__resumo">{resumo}</span>
        <IconeEstado estado={estado} />
      </button>
    </li>
  )
}

/** FeatureManager: a árvore do cenário. Clicar num nó abre o PropertyManager dele. */
function FeatureManager() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)
  const editarNo = useInterfaceStore((s) => s.editarNo)
  const estados = estadoDosNos(cenario, avaliacao)
  const kg = (v: number) => formatarMassa(v, unidade)
  const guindaste = CATALOGO[cenario.guindasteId].guindaste

  return (
    <nav className="fm" aria-label="Árvore do cenário">
      <ul className="fm__lista">
        <LinhaDaArvore no="guindaste" raiz titulo={guindaste.nome} resumo={resumoDoNo('guindaste', cenario, avaliacao, kg)} estado={estados.guindaste} aoAbrir={editarNo} />
        {nosDaArvore(cenario).map((no) => (
          <LinhaDaArvore key={no} no={no} titulo={TITULO_NO[no]} resumo={resumoDoNo(no, cenario, avaliacao, kg)} estado={estados[no]} aoAbrir={editarNo} />
        ))}
      </ul>
      <p className="fm__legenda">
        <span><CircleCheck size={12} aria-hidden="true" /> completo</span>
        <span><CircleHelp size={12} aria-hidden="true" /> falta dado</span>
        <span><CircleAlert size={12} aria-hidden="true" /> atenção</span>
        <span><CircleX size={12} aria-hidden="true" /> reprovado</span>
      </p>
    </nav>
  )
}

/** PropertyManager: edição de um nó, ao vivo, com ✔ (confirmar) e ✖ (desfazer). */
function PropertyManager({ no }: { no: IdNo }) {
  const confirmar = useInterfaceStore((s) => s.confirmarEdicao)
  const cancelar = useInterfaceStore((s) => s.cancelarEdicao)
  const Icone = ICONE_NO[no]
  return (
    <section className="pm" aria-label={`Propriedades: ${TITULO_NO[no]}`}>
      <header className="pm__cabecalho">
        <Icone size={18} aria-hidden="true" />
        <h2>{TITULO_NO[no]}</h2>
        <button type="button" className="pm__ok" onClick={confirmar} title="Confirmar e voltar à árvore" aria-label="Confirmar">
          <Check size={18} aria-hidden="true" />
        </button>
        <button type="button" className="pm__cancelar" onClick={cancelar} title="Desfazer as alterações deste nó" aria-label="Cancelar">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="pm__mensagem">
        <Info size={14} aria-hidden="true" />
        <p>{mensagemDoNo(no)}</p>
      </div>
      <div className="pm__corpo">
        <PropriedadesDoNo no={no} />
      </div>
    </section>
  )
}

/**
 * Painel esquerdo (Épico 17, RF23) no padrão do SolidWorks: abas
 * FeatureManager (árvore) e PropertyManager (edição do nó escolhido).
 */
export function PainelGerenciador() {
  const edicao = useInterfaceStore((s) => s.edicao)
  const confirmar = useInterfaceStore((s) => s.confirmarEdicao)
  const editarNo = useInterfaceStore((s) => s.editarNo)
  return (
    <aside className="gerenciador">
      <div className="gerenciador__abas" role="tablist" aria-label="Gerenciadores">
        <button
          type="button"
          role="tab"
          aria-selected={edicao === null}
          className="gerenciador__aba"
          title="FeatureManager — árvore do cenário"
          onClick={confirmar}
        >
          <ListTree size={16} aria-hidden="true" />
          Árvore
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={edicao !== null}
          className="gerenciador__aba"
          title="PropertyManager — propriedades do nó"
          onClick={() => editarNo(edicao?.no ?? 'lanca')}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Propriedades
        </button>
      </div>
      {edicao ? <PropertyManager no={edicao.no} /> : <FeatureManager />}
    </aside>
  )
}
