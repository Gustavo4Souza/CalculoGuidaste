import type { ChangeEvent } from 'react'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import type { Quadrante, ZonaDeGiro } from '../types/guindaste'

/**
 * Tela única de simulação — versão inicial, só com campos numéricos
 * (sem o canvas arrastável ainda: RT-UI02/Task 3.1 é o próximo passo do
 * Épico 3). Serve para validar o motor de cálculo ponta a ponta enquanto
 * as tabelas reais (Épico 1) e o canvas (Épico 3) não estão prontos.
 *
 * Decisões de UI já aplicadas aqui: fluxo único (sem abas), seletor manual
 * de quadrante/zona (RF08), painel de peso com somatório (RF09/RF10).
 */
export function Simulador() {
  const guindastes = useSimulacaoStore((s) => s.guindastes)
  const guindasteSelecionado = useSimulacaoStore((s) => s.guindasteSelecionado)
  const configuracao = useSimulacaoStore((s) => s.configuracao)
  const resultado = useSimulacaoStore((s) => s.resultado)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const atualizarConfiguracao = useSimulacaoStore((s) => s.atualizarConfiguracao)

  const ehVarianteA = guindasteSelecionado.tipoTabela === 'comprimento_raio_quadrante'

  const numero = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber
    return Number.isNaN(v) ? 0 : v
  }

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
              Comprimento de lança (m)
              <input
                type="number"
                step="0.1"
                value={configuracao.comprimentoLancaM ?? ''}
                onChange={(e) => atualizarConfiguracao({ comprimentoLancaM: numero(e) })}
              />
            </label>
            <label>
              Raio de trabalho (m)
              <input
                type="number"
                step="0.1"
                value={configuracao.raioM ?? ''}
                onChange={(e) => atualizarConfiguracao({ raioM: numero(e) })}
              />
            </label>
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
          </>
        ) : (
          <>
            <label>
              Ângulo da lança (graus)
              <input
                type="number"
                step="0.1"
                value={configuracao.anguloLancaGraus ?? ''}
                onChange={(e) => atualizarConfiguracao({ anguloLancaGraus: numero(e) })}
              />
            </label>
            <label>
              Zona de giro
              <select
                value={configuracao.quadranteOuZona}
                onChange={(e) =>
                  atualizarConfiguracao({ quadranteOuZona: e.target.value as ZonaDeGiro })
                }
              >
                <option value="I">Zona I</option>
                <option value="II">Zona II</option>
              </select>
            </label>
          </>
        )}
      </section>

      <section className="painel">
        <h2>Peso a içar</h2>
        <label>
          Carga içada (kg)
          <input
            type="number"
            value={configuracao.cargaIcadaKg}
            onChange={(e) => atualizarConfiguracao({ cargaIcadaKg: numero(e) })}
          />
        </label>
        <label>
          Massa da lingada (kg)
          <input
            type="number"
            value={configuracao.massaLingadaKg}
            onChange={(e) => atualizarConfiguracao({ massaLingadaKg: numero(e) })}
          />
        </label>
        <label>
          Massa do cabo de aço (kg)
          <input
            type="number"
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
            <p className="status">{descricaoStatus(resultado.status)}</p>
            {resultado.status !== 'fora_da_faixa' && (
              <p>Margem: {resultado.margemPercentual.toFixed(1)}%</p>
            )}
          </>
        ) : (
          <p>Preencha a configuração para calcular.</p>
        )}
      </section>
    </div>
  )
}

function descricaoStatus(status: string): string {
  switch (status) {
    case 'dentro_do_limite':
      return 'Dentro do limite'
    case 'excede_capacidade':
      return 'Excede a capacidade'
    case 'fora_da_faixa':
      return 'Fora da faixa da tabela'
    default:
      return ''
  }
}
