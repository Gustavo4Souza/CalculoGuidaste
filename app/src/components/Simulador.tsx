import { CATALOGO } from '../data/catalogo'
import { rotuloRegiao } from '../engine/capacidadeDetalhada'
import { comprimentosReaisDaTabela, useSimulacaoStore } from '../store/useSimulacaoStore'
import { CampoParametro } from './CampoParametro'
import { CenaGuindaste3D } from './CenaGuindaste3D'
import { PainelParametros } from './PainelParametros'
import { PainelResultado } from './PainelResultado'

// Mesmas cores de --sucesso/--aviso/--perigo/--semdado (App.css) — repetidas
// aqui em hex porque a cena 3D (WebGL) não lê variáveis CSS.
const CORES_STATUS: Record<string, string> = {
  ok: '#35d07f',
  atencao: '#ffc247',
  nok: '#ff5c5c',
  sem_dado: '#9aa3ab',
}

/**
 * Tela de simulação (Épico 11 — fonte única de estado): tudo o que a tela
 * mostra sai de `cenario` (parâmetros) e `avaliacao` (derivada pelo motor)
 * na store; todo campo e todo arrasto escreve só em `cenario`. O seletor
 * manual de quadrante/zona saiu (RF18): a área agora é derivada do giro.
 */
export function Simulador() {
  const guindastes = useSimulacaoStore((s) => s.guindastes)
  const cenario = useSimulacaoStore((s) => s.cenario)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const definirAnguloGraus = useSimulacaoStore((s) => s.definirAnguloGraus)
  const definirRaioM = useSimulacaoStore((s) => s.definirRaioM)
  const definirComprimentoLancaM = useSimulacaoStore((s) => s.definirComprimentoLancaM)
  const definirJIB = useSimulacaoStore((s) => s.definirJIB)

  const ctx = CATALOGO[cenario.guindasteId]
  const { especificacao: esp, criterioDeGiro } = ctx
  const usaJIB = cenario.jib.ativo
  const corDestaque = CORES_STATUS[avaliacao.status]
  const comprimentosReais = comprimentosReaisDaTabela(ctx)

  return (
    <div className="simulador">
      <div className="simulador__barra">
        <label className="simulador__campo-barra">
          Guindaste
          <select value={cenario.guindasteId} onChange={(e) => selecionarGuindaste(e.target.value)}>
            {guindastes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome} ({g.fabricante})
              </option>
            ))}
          </select>
        </label>

        <span className="simulador__regiao" data-testid="regiao-derivada">
          Área: {avaliacao.giro.regioes.map(rotuloRegiao).join(' / ') || '—'} · giro{' '}
          {avaliacao.giro.normalizadoGraus.toFixed(1)}°
        </span>
        {criterioDeGiro.provisorio && <span className="selo-provisorio">Critério de giro provisório</span>}

        {esp.jib.habilitado && ctx.guindaste.possuiJIB && (
          <label className="simulador__campo-barra simulador__campo-barra--checkbox">
            <input type="checkbox" checked={usaJIB} onChange={(e) => definirJIB({ ativo: e.target.checked })} />
            Usar lança JIB (RF12)
          </label>
        )}
      </div>

      <div className="simulador__corpo">
        <section className="simulador__cena" aria-label="Visualização 3D do guindaste">
          <CenaGuindaste3D
            alturaPeDaLancaM={esp.lanca.alturaPeM.valor}
            comprimentoLancaM={cenario.lanca.comprimentoM}
            anguloGraus={cenario.lanca.anguloGraus}
            raioM={avaliacao.geometria.raioM}
            corDestaque={corDestaque}
            onAnguloChange={usaJIB ? undefined : definirAnguloGraus}
            onComprimentoChange={usaJIB ? undefined : definirComprimentoLancaM}
            comprimentoMinM={esp.lanca.comprimentoMinM.valor}
            comprimentoMaxM={esp.lanca.comprimentoMaxM.valor}
            comprimentosReaisM={comprimentosReais.length > 0 ? comprimentosReais : undefined}
            raioAtualM={avaliacao.geometria.raioM}
            onRaioChange={definirRaioM}
            jib={usaJIB ? { comprimentoJibM: cenario.jib.comprimentoM, anguloJibGraus: cenario.jib.anguloGraus } : undefined}
          />
        </section>

        <aside className="simulador__lateral">
          <PainelResultado />
          {usaJIB && (
            <section className="painel">
              <h2>Posição (JIB)</h2>
              <RaioJIB />
            </section>
          )}
          <PainelParametros />
        </aside>
      </div>
    </div>
  )
}

/** Raio de trabalho no modo JIB — o arrasto do gancho no JIB fica para o Épico 13. */
function RaioJIB() {
  const raio = useSimulacaoStore((s) => s.avaliacao.geometria.raioM)
  const definirRaioM = useSimulacaoStore((s) => s.definirRaioM)
  return (
    <CampoParametro
      rotulo="Raio de trabalho (JIB)"
      unidade="m"
      valor={raio}
      aoMudar={definirRaioM}
      dica="do centro de giro ao gancho"
    />
  )
}
