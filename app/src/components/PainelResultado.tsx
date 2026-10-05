import { rotuloRegiao } from '../engine/capacidadeDetalhada'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import { IndicadorStatus } from './IndicadorStatus'
import { MedidorCapacidade } from './MedidorCapacidade'

const kg = (v: number) => `${Math.round(v).toLocaleString('pt-BR')} kg`

/**
 * Resultado da avaliação (Épico 11): capacidade da tabela (ou "sem dado"),
 * de onde ela veio (ponto exato / interpolado e quais pontos reais), o
 * somatório detalhado item a item (RF10) e as verificações.
 */
export function PainelResultado() {
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const limite = useSimulacaoStore((s) => s.cenario.limiteUtilizacaoPercentual)
  const { capacidade, somatorio, status } = avaliacao

  return (
    <section className={`painel resultado resultado--${status}`} aria-label="Resultado">
      <h2>Resultado</h2>
      {capacidade.capacidadeKg !== null ? (
        <>
          <p className="capacidade">{kg(capacidade.capacidadeKg)}</p>
          <p className="resultado__origem">
            Capacidade da tabela — {capacidade.origem === 'exato' ? 'ponto exato' : 'interpolado (arredondado para baixo)'}
            {capacidade.regiao && <> · {rotuloRegiao(capacidade.regiao)}</>}
          </p>
          {capacidade.origem !== 'exato' && (
            <ul className="resultado__pontos">
              {capacidade.pontosUsados.map((p, i) => (
                <li key={i}>
                  {Object.entries(p.chaves)
                    .map(([k, v]) => `${ROTULO_CHAVE[k] ?? k} ${typeof v === 'number' ? v.toLocaleString('pt-BR') : v}`)
                    .join(' · ')}{' '}
                  → {kg(p.capacidadeKg)}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="capacidade capacidade--semdado">Sem dado do fabricante</p>
      )}

      <details className="resultado__somatorio" open>
        <summary>Somatório de cargas: {kg(somatorio.totalKg)}</summary>
        <ul>
          {somatorio.itens.map((item) => (
            <li key={item.descricao}>
              <span>{item.descricao}</span>
              <span>{kg(item.massaKg)}</span>
            </li>
          ))}
        </ul>
      </details>

      {capacidade.capacidadeKg !== null && (
        <MedidorCapacidade
          capacidadeMaximaKg={capacidade.capacidadeKg}
          somatorioDeCargasKg={somatorio.totalKg}
          limiteUtilizacaoPercentual={limite}
        />
      )}
      <IndicadorStatus avaliacao={avaliacao} />
    </section>
  )
}

const ROTULO_CHAVE: Record<string, string> = {
  comprimentoLancaM: 'lança (m)',
  raioM: 'raio (m)',
  anguloJibGraus: 'JIB (°)',
  anguloLancaGraus: 'ângulo (°)',
  zona: 'zona',
}
