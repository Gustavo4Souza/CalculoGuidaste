import type { ChangeEvent } from 'react'
import {
  ANGULOS_JIB_MD300L,
  COMPRIMENTOS_JIB_MD300L,
  COMPRIMENTOS_LANCA_MD300L,
  useSimulacaoStore,
} from '../store/useSimulacaoStore'
import type { Quadrante, ZonaDeGiro } from '../types/guindaste'
import { CenaGuindaste3D } from './CenaGuindaste3D'
import { IndicadorStatus } from './IndicadorStatus'
import { MedidorCapacidade } from './MedidorCapacidade'

/**
 * Ângulo só ilustrativo da lança principal quando o JIB está em uso (RF12):
 * na prática o JIB é montado com a lança principal na extensão máxima, num
 * ângulo de trabalho alto — não existe um controle de ângulo para a lança
 * principal nesse modo (a capacidade vem só da tabela de JIB por
 * comprimento×ângulo×raio), então este valor não entra no motor de cálculo,
 * é só para a cena 3D não desenhar a lança principal deitada no chão.
 */
const ANGULO_PRINCIPAL_VISUAL_JIB = 55
const COMPRIMENTO_LANCA_MAXIMO_MD300L = COMPRIMENTOS_LANCA_MD300L[COMPRIMENTOS_LANCA_MD300L.length - 1]

// Mesmas cores de --sucesso/--perigo/--aviso do tema industrial (App.css) —
// repetidas aqui em hex porque a cena 3D (WebGL) não lê variáveis CSS.
const CORES_STATUS: Record<string, string> = {
  dentro_do_limite: '#35d07f',
  excede_capacidade: '#ff5c5c',
  fora_da_faixa: '#ffc247',
}

/**
 * Tela de simulação (RT-UI02) — layout em tela cheia, sem scroll de página:
 * barra superior com a seleção de guindaste/quadrante/zona/JIB, cena 3D
 * (Task 3.1, agora com profundidade real via WebGL) à esquerda e o painel
 * de controles/peso/resultado à direita. A busca reversa (RF05/RF15) mudou
 * para a própria aba "Buscar por peso" (ver App.tsx).
 */
export function Simulador() {
  const guindastes = useSimulacaoStore((s) => s.guindastes)
  const guindasteSelecionado = useSimulacaoStore((s) => s.guindasteSelecionado)
  const configuracao = useSimulacaoStore((s) => s.configuracao)
  const resultado = useSimulacaoStore((s) => s.resultado)
  const raioAtualM = useSimulacaoStore((s) => s.raioAtualM)
  const comprimentoVisualM = useSimulacaoStore((s) => s.comprimentoVisualM)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const atualizarConfiguracao = useSimulacaoStore((s) => s.atualizarConfiguracao)
  const definirAnguloGraus = useSimulacaoStore((s) => s.definirAnguloGraus)
  const definirRaioM = useSimulacaoStore((s) => s.definirRaioM)
  const definirComprimentoLancaM = useSimulacaoStore((s) => s.definirComprimentoLancaM)
  const alternarUsoJIB = useSimulacaoStore((s) => s.alternarUsoJIB)
  const definirJIB = useSimulacaoStore((s) => s.definirJIB)

  const ehVarianteA = guindasteSelecionado.tipoTabela === 'comprimento_raio_quadrante'
  const usaJIB = configuracao.usaJIB
  const corDestaque = CORES_STATUS[resultado?.status ?? ''] ?? '#f2a71b'

  const numero = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber
    return Number.isNaN(v) ? 0 : v
  }

  const anguloVisualTM130 = configuracao.anguloLancaGraus ?? 30
  const raioVisualTM130 = comprimentoVisualM * Math.cos((anguloVisualTM130 * Math.PI) / 180)

  return (
    <div className="simulador">
      <div className="simulador__barra">
        <label className="simulador__campo-barra">
          Guindaste
          <select value={guindasteSelecionado.id} onChange={(e) => selecionarGuindaste(e.target.value)}>
            {guindastes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome} ({g.fabricante})
              </option>
            ))}
          </select>
        </label>

        {ehVarianteA ? (
          <label className="simulador__campo-barra">
            Quadrante
            <select
              value={configuracao.quadranteOuZona}
              onChange={(e) => atualizarConfiguracao({ quadranteOuZona: e.target.value as Quadrante })}
            >
              <option value="frontal">Frontal</option>
              <option value="lateral_traseira">Lateral / Traseira</option>
            </select>
          </label>
        ) : (
          <label className="simulador__campo-barra">
            Zona de giro
            <select
              value={configuracao.quadranteOuZona}
              onChange={(e) => atualizarConfiguracao({ quadranteOuZona: e.target.value as ZonaDeGiro })}
            >
              <option value="I">Zona I</option>
              <option value="II">Zona II</option>
            </select>
          </label>
        )}

        {ehVarianteA && guindasteSelecionado.possuiJIB && (
          <label className="simulador__campo-barra simulador__campo-barra--checkbox">
            <input type="checkbox" checked={usaJIB} onChange={(e) => alternarUsoJIB(e.target.checked)} />
            Usar lança JIB (RF12)
          </label>
        )}
      </div>

      <div className="simulador__corpo">
        <section className="simulador__cena" aria-label="Visualização 3D do guindaste">
          {ehVarianteA ? (
            usaJIB ? (
              <CenaGuindaste3D
                alturaPeDaLancaM={guindasteSelecionado.alturaPeDaLancaM}
                comprimentoLancaM={COMPRIMENTO_LANCA_MAXIMO_MD300L}
                anguloGraus={ANGULO_PRINCIPAL_VISUAL_JIB}
                raioM={raioAtualM}
                corDestaque={corDestaque}
                jib={{
                  comprimentoJibM: configuracao.jib?.comprimentoJibM ?? COMPRIMENTOS_JIB_MD300L[0],
                  anguloJibGraus: configuracao.jib?.anguloJibGraus ?? ANGULOS_JIB_MD300L[0],
                }}
              />
            ) : (
              <CenaGuindaste3D
                alturaPeDaLancaM={guindasteSelecionado.alturaPeDaLancaM}
                comprimentoLancaM={configuracao.comprimentoLancaM ?? COMPRIMENTOS_LANCA_MD300L[0]}
                anguloGraus={configuracao.anguloLancaGraus ?? 45}
                raioM={raioAtualM}
                onAnguloChange={definirAnguloGraus}
                onComprimentoChange={definirComprimentoLancaM}
                comprimentoMinM={COMPRIMENTOS_LANCA_MD300L[0]}
                comprimentoMaxM={COMPRIMENTO_LANCA_MAXIMO_MD300L}
                comprimentosReaisM={COMPRIMENTOS_LANCA_MD300L}
                raioAtualM={raioAtualM}
                onRaioChange={definirRaioM}
                corDestaque={corDestaque}
              />
            )
          ) : (
            <CenaGuindaste3D
              alturaPeDaLancaM={guindasteSelecionado.alturaPeDaLancaM}
              comprimentoLancaM={comprimentoVisualM}
              anguloGraus={anguloVisualTM130}
              raioM={raioVisualTM130}
              onAnguloChange={definirAnguloGraus}
              corDestaque={corDestaque}
            />
          )}
        </section>

        <aside className="simulador__lateral">
          {/* Task 9.2 — o painel "Posição da lança" saiu daqui: comprimento,
              raio e ângulo agora são campos embutidos na própria cena 3D
              (ver CenaGuindaste3D.tsx). O modo JIB é a exceção — a tabela de
              JIB só tem 3 comprimentos × 3 ângulos discretos (sem arrasto
              contínuo nem marcas de encaixe), então continua um formulário
              simples aqui. */}
          {usaJIB && (
            <section className="painel">
              <h2>Posição da lança (JIB)</h2>
              <label>
                Comprimento do JIB (m)
                <select
                  value={configuracao.jib?.comprimentoJibM}
                  onChange={(e) => definirJIB({ comprimentoJibM: Number(e.target.value) })}
                >
                  {COMPRIMENTOS_JIB_MD300L.map((c) => (
                    <option key={c} value={c}>
                      {c.toFixed(1)} m
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ângulo do JIB (°)
                <select
                  value={configuracao.jib?.anguloJibGraus}
                  onChange={(e) => definirJIB({ anguloJibGraus: Number(e.target.value) })}
                >
                  {ANGULOS_JIB_MD300L.map((a) => (
                    <option key={a} value={a}>
                      {a}°
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Raio de trabalho (m)
                <input
                  type="number"
                  step="0.1"
                  value={configuracao.raioM ?? ''}
                  onChange={(e) => definirJIB({ raioM: numero(e) })}
                />
              </label>
              <p className="rf-note">
                Adicionar o JIB aumenta o alcance da lança, mas reduz a capacidade máxima em relação à lança
                principal sozinha — e essa capacidade também muda conforme o ângulo do JIB (tabela própria, RF12).
              </p>
            </section>
          )}

          <section className="painel">
            <h2>Peso a içar</h2>
            <label>
              Carga içada (kg)
              <input
                type="number"
                min={0}
                value={configuracao.cargaIcadaKg}
                onChange={(e) => atualizarConfiguracao({ cargaIcadaKg: numero(e) })}
              />
            </label>
            <label>
              Massa da lingada (kg)
              <input
                type="number"
                min={0}
                value={configuracao.massaLingadaKg}
                onChange={(e) => atualizarConfiguracao({ massaLingadaKg: numero(e) })}
              />
            </label>
            <label>
              Massa do cabo de aço (kg)
              <input
                type="number"
                min={0}
                value={configuracao.massaCaboDeAcoKg}
                onChange={(e) => atualizarConfiguracao({ massaCaboDeAcoKg: numero(e) })}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={configuracao.usaBalancim}
                onChange={(e) => atualizarConfiguracao({ usaBalancim: e.target.checked })}
              />
              Usar balancim
            </label>
            {configuracao.usaBalancim && (
              <label>
                Massa do balancim (kg)
                <input
                  type="number"
                  min={0}
                  value={configuracao.massaBalancimKg ?? 0}
                  onChange={(e) => atualizarConfiguracao({ massaBalancimKg: numero(e) })}
                />
              </label>
            )}
          </section>

          <section className={`painel resultado resultado--${resultado?.status ?? 'indefinido'}`}>
            <h2>Resultado</h2>
            {resultado ? (
              <>
                <p className="capacidade">{resultado.capacidadeMaximaKg.toLocaleString('pt-BR')} kg</p>
                <p>Somatório de cargas: {resultado.somatorioDeCargasKg.toLocaleString('pt-BR')} kg</p>
                <MedidorCapacidade
                  capacidadeMaximaKg={resultado.capacidadeMaximaKg}
                  somatorioDeCargasKg={resultado.somatorioDeCargasKg}
                />
              </>
            ) : (
              <p>Preencha a configuração para calcular.</p>
            )}
            <IndicadorStatus resultado={resultado} />
          </section>
        </aside>
      </div>
    </div>
  )
}
