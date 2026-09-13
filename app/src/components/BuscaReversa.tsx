import type { ChangeEvent } from 'react'
import { useSimulacaoStore } from '../store/useSimulacaoStore'

/**
 * Busca reversa por peso (Task 3.5 / RF05 / RF15) — a partir de um peso a
 * içar, lista as configurações viáveis de toda a frota, ordenadas por
 * menor guindaste primeiro (RT-MC07), inspirada no Liebherr Crane Finder
 * citado em ARQUITETURA.md.
 */
export function BuscaReversa() {
  const buscaPesoKg = useSimulacaoStore((s) => s.buscaPesoKg)
  const configuracoesViaveis = useSimulacaoStore((s) => s.configuracoesViaveis)
  const buscarPorPeso = useSimulacaoStore((s) => s.buscarPorPeso)

  const onChangePeso = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber
    buscarPorPeso(Number.isNaN(v) ? 0 : v)
  }

  return (
    <section className="painel busca-reversa">
      <h2>Qual guindaste eu preciso? (RF05/RF15)</h2>
      <label>
        Peso a içar (kg)
        <input type="number" min={0} step={100} value={buscaPesoKg || ''} onChange={onChangePeso} />
      </label>

      {buscaPesoKg > 0 && (
        <>
          {configuracoesViaveis.length === 0 ? (
            <p className="busca-reversa__vazio">Nenhum guindaste da frota atende esse peso.</p>
          ) : (
            <ol className="busca-reversa__lista">
              {configuracoesViaveis.map((config, i) => (
                <li key={`${config.guindasteId}-${i}`}>
                  <strong>{config.guindasteId}</strong>
                  {config.comprimentoLancaM !== undefined && (
                    <span> · lança {config.comprimentoLancaM.toFixed(2)} m</span>
                  )}
                  {config.anguloLancaGraus !== undefined && (
                    <span> · ângulo {config.anguloLancaGraus.toFixed(0)}°</span>
                  )}
                  <span> · {config.quadranteOuZona}</span>
                  {config.raioMaximoM !== undefined && <span> · raio até {config.raioMaximoM.toFixed(1)} m</span>}
                  <span className="busca-reversa__capacidade">
                    {' '}
                    · capacidade {config.capacidadeNaConfiguracaoKg.toLocaleString('pt-BR')} kg
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <p className="rf-note">
        Lista ordenada por menor guindaste primeiro (capacidade nominal) — critério econômico do RF15, não o maior
        guindaste disponível.
      </p>
    </section>
  )
}
