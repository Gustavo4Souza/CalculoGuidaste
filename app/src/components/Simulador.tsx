import { CATALOGO } from '../data/catalogo'
import { useInterfaceStore, type VistaPadrao } from '../store/useInterfaceStore'
import { comprimentosReaisDaTabela, useSimulacaoStore } from '../store/useSimulacaoStore'
import { ArvoreParametros } from './ArvoreParametros'
import { CenaGuindaste3D } from './CenaGuindaste3D'
import { PainelResultado } from './PainelResultado'

// Mesmas cores de --ok/--atencao/--nok/--semdado (index.css) — repetidas
// aqui em hex porque a cena 3D (WebGL) não lê variáveis CSS.
const CORES_STATUS: Record<string, string> = {
  ok: '#1e8e3e',
  atencao: '#c77700',
  nok: '#c62828',
  sem_dado: '#6b7680',
}

const VISTAS: { nome: VistaPadrao; rotulo: string }[] = [
  { nome: 'frontal', rotulo: 'Frontal' },
  { nome: 'lateral', rotulo: 'Lateral' },
  { nome: 'superior', rotulo: 'Superior' },
  { nome: 'isometrica', rotulo: 'Isométrica' },
]

/**
 * Área de trabalho (Épico 12, RF23) no estilo SolidWorks: árvore de
 * parâmetros à esquerda, viewport 3D no centro (barra de vistas padrão,
 * cubo de orientação e cotas) e o painel de resultado à direita. Tudo lê e
 * escreve no estado único da store (Épico 11).
 */
export function Simulador() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const definirAnguloGraus = useSimulacaoStore((s) => s.definirAnguloGraus)
  const definirRaioM = useSimulacaoStore((s) => s.definirRaioM)
  const definirComprimentoLancaM = useSimulacaoStore((s) => s.definirComprimentoLancaM)
  const vista = useInterfaceStore((s) => s.vista)
  const pedirVista = useInterfaceStore((s) => s.pedirVista)

  const ctx = CATALOGO[cenario.guindasteId]
  const { especificacao: esp } = ctx
  const usaJIB = cenario.jib.ativo
  const comprimentosReais = comprimentosReaisDaTabela(ctx)

  return (
    <div className="area-trabalho">
      <ArvoreParametros />

      <section className="viewport" aria-label="Visualização 3D do guindaste">
        <div className="viewport__vistas" role="toolbar" aria-label="Vistas padrão">
          {VISTAS.map((v) => (
            <button
              key={v.nome}
              type="button"
              className={`segmento ${vista.nome === v.nome && vista.pedido > 0 ? 'segmento--ativo' : ''}`}
              onClick={() => pedirVista(v.nome)}
            >
              {v.rotulo}
            </button>
          ))}
        </div>
        <CenaGuindaste3D
          alturaPeDaLancaM={esp.lanca.alturaPeM.valor}
          comprimentoLancaM={cenario.lanca.comprimentoM}
          anguloGraus={cenario.lanca.anguloGraus}
          raioM={avaliacao.geometria.raioM}
          corDestaque={CORES_STATUS[avaliacao.status]}
          onAnguloChange={usaJIB ? undefined : definirAnguloGraus}
          onComprimentoChange={usaJIB ? undefined : definirComprimentoLancaM}
          comprimentoMinM={esp.lanca.comprimentoMinM.valor}
          comprimentoMaxM={esp.lanca.comprimentoMaxM.valor}
          comprimentosReaisM={comprimentosReais.length > 0 ? comprimentosReais : undefined}
          raioAtualM={avaliacao.geometria.raioM}
          onRaioChange={definirRaioM}
          jib={usaJIB ? { comprimentoJibM: cenario.jib.comprimentoM, anguloJibGraus: cenario.jib.anguloGraus } : undefined}
          cotas={{
            recuoPeDaLancaM: esp.lanca.recuoPeM.valor,
            raioM: avaliacao.geometria.raioM,
            alturaPontaM: avaliacao.geometria.alturaPontaM,
            giroGraus: avaliacao.giro.normalizadoGraus,
            alturaIcamentoM: cenario.alturaIcamentoNecessariaM,
          }}
          vista={vista}
        />
      </section>

      <aside className="painel-direito">
        <PainelResultado />
      </aside>
    </div>
  )
}
