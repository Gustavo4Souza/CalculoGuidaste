import type { ChangeEvent } from 'react'
import { formatarMassa, useInterfaceStore } from '../store/useInterfaceStore'
import { GUINDASTES_FORA_DA_BUSCA, useSimulacaoStore } from '../store/useSimulacaoStore'

/**
 * Busca reversa por peso (Task 3.5 / RF05 / RF15) — a partir de um peso a
 * içar, lista as configurações viáveis de toda a frota, ordenadas por
 * menor guindaste primeiro (RT-MC07), inspirada no Liebherr Crane Finder
 * citado em ARQUITETURA.md.
 *
 * Épico 12: aberta num diálogo pela barra de comandos (DialogoBuscaReversa).
 */
export function BuscaReversa() {
  const buscaPesoKg = useSimulacaoStore((s) => s.buscaPesoKg)
  const configuracoesViaveis = useSimulacaoStore((s) => s.configuracoesViaveis)
  const buscarPorPeso = useSimulacaoStore((s) => s.buscarPorPeso)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)

  const onChangePeso = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber
    buscarPorPeso(Number.isNaN(v) ? 0 : v)
  }

  return (
    <section className="busca-reversa">
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
                    · capacidade {formatarMassa(config.capacidadeNaConfiguracaoKg, unidade)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {GUINDASTES_FORA_DA_BUSCA.length > 0 && (
        <p className="rf-note rf-note--aviso">
          Fora da busca: {GUINDASTES_FORA_DA_BUSCA.join(', ')} — a tabela da lança principal (diagrama polar por raio)
          ainda não foi transcrita da ficha. Nenhum valor é sugerido sem dado do fabricante.
        </p>
      )}

      <p className="rf-note">
        Lista ordenada por menor guindaste primeiro (capacidade nominal) — critério econômico do RF15, não o maior
        guindaste disponível.
      </p>
    </section>
  )
}
