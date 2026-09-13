import type { ChangeEvent } from 'react'
import {
  ANGULOS_JIB_MD300L,
  COMPRIMENTOS_JIB_MD300L,
  COMPRIMENTOS_LANCA_MD300L,
  useSimulacaoStore,
} from '../store/useSimulacaoStore'
import type { Quadrante, ZonaDeGiro } from '../types/guindaste'
import { CanvasLanca } from './CanvasLanca'
import { BuscaReversa } from './BuscaReversa'
import { IndicadorStatus } from './IndicadorStatus'
import { useCampoNumericoSincronizado } from './useCampoNumericoSincronizado'

/**
 * Tela única de simulação (RT-UI02) — canvas arrastável (Task 3.1) + campos
 * numéricos sincronizados nos dois sentidos (Task 3.4), seletor manual de
 * quadrante/zona (Task 3.2 / RF08), toggle de JIB (Task 3.3 / RF12) e busca
 * reversa por peso (Task 3.5 / RF05 / RF15).
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

  const numero = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber
    return Number.isNaN(v) ? 0 : v
  }

  // Task 4.2 — evita que o campo "Raio de trabalho" (valor derivado do
  // ângulo, reformatado a cada render) atrapalhe a digitação do usuário.
  const campoRaio = useCampoNumericoSincronizado(raioAtualM, definirRaioM)

  return (
    <div className="simulador">
      <section className="painel">
        <h2>Guindaste</h2>
        <select
          value={guindasteSelecionado.id}
          onChange={(e) => selecionarGuindaste(e.target.value)}
        >
          {guindastes.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome} ({g.fabricante})
            </option>
          ))}
        </select>

        {ehVarianteA ? (
          <>
            <label>
              Quadrante
              <select
                value={configuracao.quadranteOuZona}
                onChange={(e) =>
                  atualizarConfiguracao({ quadranteOuZona: e.target.value as Quadrante })
                }
              >
                <option value="frontal">Frontal</option>
                <option value="lateral_traseira">Lateral / Traseira</option>
              </select>
            </label>

            {guindasteSelecionado.possuiJIB && (
              <label className="checkbox">
                <input type="checkbox" checked={usaJIB} onChange={(e) => alternarUsoJIB(e.target.checked)} />
                Usar lança JIB (RF12)
              </label>
            )}
          </>
        ) : (
          <label>
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
      </section>

      <section className="painel painel-canvas">
        <h2>Posição da lança</h2>

        {usaJIB ? (
          <>
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
          </>
        ) : (
          <>
            {ehVarianteA ? (
              <>
                <CanvasLanca
                  comprimentoLancaM={configuracao.comprimentoLancaM ?? COMPRIMENTOS_LANCA_MD300L[0]}
                  anguloGraus={configuracao.anguloLancaGraus ?? 45}
                  raioM={raioAtualM}
                  onAnguloChange={definirAnguloGraus}
                />
                <label>
                  Comprimento de lança (m)
                  <select
                    value={configuracao.comprimentoLancaM}
                    onChange={(e) => definirComprimentoLancaM(Number(e.target.value))}
                  >
                    {COMPRIMENTOS_LANCA_MD300L.map((c) => (
                      <option key={c} value={c}>
                        {c.toFixed(2)} m
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Raio de trabalho (m)
                  <input
                    type="number"
                    step="0.1"
                    value={campoRaio.texto}
                    onFocus={campoRaio.onFocus}
                    onBlur={campoRaio.onBlur}
                    onChange={campoRaio.onChange}
                  />
                </label>
              </>
            ) : (
              <>
                <CanvasLanca
                  comprimentoLancaM={comprimentoVisualM}
                  anguloGraus={configuracao.anguloLancaGraus ?? 30}
                  raioM={comprimentoVisualM * Math.cos(((configuracao.anguloLancaGraus ?? 30) * Math.PI) / 180)}
                  onAnguloChange={definirAnguloGraus}
                />
                <label>
                  Ângulo da lança (°)
                  <input
                    type="number"
                    step="0.1"
                    value={configuracao.anguloLancaGraus ?? ''}
                    onChange={(e) => atualizarConfiguracao({ anguloLancaGraus: numero(e) })}
                  />
                </label>
              </>
            )}
          </>
        )}
      </section>

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
          </>
        ) : (
          <p>Preencha a configuração para calcular.</p>
        )}
        <IndicadorStatus resultado={resultado} />
      </section>

      <BuscaReversa />
    </div>
  )
}
