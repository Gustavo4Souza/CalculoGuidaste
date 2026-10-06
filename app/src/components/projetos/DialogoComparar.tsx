import { useEffect, useState } from 'react'
import { CATALOGO } from '../../data/catalogo'
import { rotuloRegiao } from '../../engine/capacidadeDetalhada'
import { versoesDiferentes } from '../../persistencia/montarCenario'
import { repositorio } from '../../persistencia/repositorio'
import { formatarMassa, useInterfaceStore } from '../../store/useInterfaceStore'
import { POSICOES_SAPATA } from '../../types/cenario'
import type { CenarioSalvo } from '../../types/projeto'
import { Dialogo } from '../Dialogo'
import { ROTULO_STATUS_CURTO } from './rotulos'

const m = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`

/**
 * Comparação de 2+ cenários lado a lado (Épico 15, RF24): guindaste,
 * configuração, somatório, capacidade, % de utilização e status — com o
 * resultado que foi SALVO (o apresentado ao cliente) e o aviso quando as
 * tabelas ou o critério de giro mudaram desde então.
 */
export function DialogoComparar() {
  return (
    <Dialogo nome="comparar" titulo="Comparar cenários" largura={1100}>
      <TabelaComparativa />
    </Dialogo>
  )
}

function TabelaComparativa() {
  const ids = useInterfaceStore((s) => s.comparacaoIds)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)
  const [cenarios, setCenarios] = useState<CenarioSalvo[]>([])

  useEffect(() => {
    void Promise.all(ids.map((id) => repositorio.obterCenario(id))).then((lista) =>
      setCenarios(lista.filter((c): c is CenarioSalvo => c !== null)),
    )
  }, [ids])

  if (cenarios.length < 2) {
    return <p className="projetos__vazio">Marque 2 ou mais cenários em "Abrir" (Projetos e cenários) para comparar.</p>
  }

  const linhas: { rotulo: string; valor: (c: CenarioSalvo) => string }[] = [
    { rotulo: 'Guindaste', valor: (c) => CATALOGO[c.parametros.guindasteId]?.guindaste.nome ?? c.parametros.guindasteId },
    { rotulo: 'Lança', valor: (c) => `${m(c.parametros.lanca.comprimentoM)} a ${c.parametros.lanca.anguloGraus.toFixed(1)}°` },
    {
      rotulo: 'JIB',
      valor: (c) => (c.parametros.jib.ativo ? `${m(c.parametros.jib.comprimentoM)} a ${c.parametros.jib.anguloGraus.toFixed(1)}°` : '—'),
    },
    { rotulo: 'Raio de trabalho', valor: (c) => m(c.resultado.geometria.raioM) },
    {
      rotulo: 'Giro / área',
      valor: (c) => `${c.resultado.giro.normalizadoGraus.toFixed(1)}° · ${c.resultado.giro.regioes.map(rotuloRegiao).join(' / ') || '—'}`,
    },
    {
      rotulo: 'Sapatas',
      valor: (c) => {
        const esp = CATALOGO[c.parametros.guindasteId]?.especificacao
        const naMaxima = POSICOES_SAPATA.every((pos) => {
          const par = pos.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
          return Math.abs(c.parametros.sapatas[pos] - par.estendidaM.valor) < 1e-3
        })
        return naMaxima ? 'extensão máxima' : 'extensão parcial'
      },
    },
    { rotulo: 'Carga', valor: (c) => `${formatarMassa(c.parametros.carga.pesoKg, unidade)}${c.parametros.carga.descricao ? ` · ${c.parametros.carga.descricao}` : ''}` },
    { rotulo: 'Somatório de cargas', valor: (c) => formatarMassa(c.resultado.somatorio.totalKg, unidade) },
    {
      rotulo: 'Capacidade da tabela',
      valor: (c) =>
        c.resultado.capacidade.capacidadeKg === null
          ? 'sem dado'
          : `${formatarMassa(c.resultado.capacidade.capacidadeKg, unidade)} (${c.resultado.capacidade.origem === 'exato' ? 'exato' : 'interpolado'})`,
    },
    { rotulo: 'Utilização', valor: (c) => (c.resultado.percentualUtilizacao === null ? '—' : `${c.resultado.percentualUtilizacao.toFixed(1)}%`) },
    { rotulo: 'Limite do engenheiro', valor: (c) => `${c.parametros.limiteUtilizacaoPercentual}%` },
    { rotulo: 'Versão das tabelas', valor: (c) => `${c.versaoTabelas}${versoesDiferentes(c).tabelas ? ' ⚠ difere da atual' : ''}` },
    {
      rotulo: 'Critério de giro',
      valor: (c) =>
        `${c.versaoCriterioGiro}${c.criterioGiroProvisorio ? ' (provisório)' : ''}${versoesDiferentes(c).criterioGiro ? ' ⚠ difere do atual' : ''}`,
    },
  ]

  return (
    <div className="comparacao">
      <table className="comparacao__tabela">
        <thead>
          <tr>
            <th />
            {cenarios.map((c) => (
              <th key={c.id}>{c.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="comparacao__status">
            <th>Status</th>
            {cenarios.map((c) => (
              <td key={c.id}>
                <span className={`selo-status selo-status--${c.resultado.status}`}>{ROTULO_STATUS_CURTO[c.resultado.status]}</span>
              </td>
            ))}
          </tr>
          {linhas.map((l) => (
            <tr key={l.rotulo}>
              <th>{l.rotulo}</th>
              {cenarios.map((c) => (
                <td key={c.id}>{l.valor(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="rf-note">Resultados como foram salvos. Abra um cenário para recalculá-lo com as tabelas atuais.</p>
    </div>
  )
}
