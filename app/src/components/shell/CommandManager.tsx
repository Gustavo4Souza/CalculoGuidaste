import { ArrowDownToLine, Columns2, FileText, Search, Spline, Truck, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { CATALOGO } from '../../data/catalogo'
import { useInterfaceStore, type AbaComandos } from '../../store/useInterfaceStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { POSICOES_SAPATA } from '../../types/cenario'
import { useComandos } from './useComandos'

/** Botão grande do CommandManager: ícone em cima, rótulo embaixo, motivo no tooltip quando desabilitado. */
function BotaoComando({
  rotulo,
  Icone,
  dica,
  aoClicar,
  pressionado,
  desabilitadoPorque,
}: {
  rotulo: string
  Icone: LucideIcon
  dica: string
  aoClicar: () => void
  pressionado?: boolean
  desabilitadoPorque?: string
}) {
  return (
    <button
      type="button"
      className="cm-botao"
      title={desabilitadoPorque ?? dica}
      aria-pressed={pressionado}
      disabled={!!desabilitadoPorque}
      onClick={aoClicar}
    >
      <Icone size={22} aria-hidden="true" />
      <span>{rotulo}</span>
    </button>
  )
}

function GrupoComandos({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="cm-grupo" role="group" aria-label={titulo}>
      <div className="cm-grupo__botoes">{children}</div>
      <span className="cm-grupo__titulo">{titulo}</span>
    </div>
  )
}

const ABAS: { id: AbaComandos; rotulo: string }[] = [
  { id: 'guindaste', rotulo: 'Guindaste' },
  { id: 'avaliar', rotulo: 'Avaliar' },
]

/**
 * CommandManager (Épico 17, RF23): faixa de comandos com abas, ícones
 * grandes e grupos rotulados, como no SolidWorks. Os comandos de vista
 * ficam na barra sobre a cena (heads-up), também como no SolidWorks.
 */
export function CommandManager() {
  const aba = useInterfaceStore((s) => s.abaComandos)
  const definirAba = useInterfaceStore((s) => s.definirAbaComandos)
  const confirmarEdicao = useInterfaceStore((s) => s.confirmarEdicao)
  const guindastes = useSimulacaoStore((s) => s.guindastes)
  const cenario = useSimulacaoStore((s) => s.cenario)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const definirJIB = useSimulacaoStore((s) => s.definirJIB)
  const definirSapata = useSimulacaoStore((s) => s.definirSapata)
  const comandos = useComandos(() => {})

  const { especificacao: esp, guindaste } = CATALOGO[cenario.guindasteId]
  const jibDisponivel = esp.jib.habilitado && guindaste.possuiJIB

  return (
    <div className="command-manager">
      <div className="cm-abas" role="tablist" aria-label="CommandManager">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            className="cm-aba"
            onClick={() => definirAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <div className="cm-faixa" role="tabpanel" aria-label={ABAS.find((a) => a.id === aba)!.rotulo}>
        {aba === 'guindaste' && (
          <>
            <GrupoComandos titulo="Modelo">
              {guindastes.map((g) => (
                <BotaoComando
                  key={g.id}
                  rotulo={g.nome}
                  Icone={Truck}
                  dica={`${g.nome} — ${g.fabricante}, ${(g.capacidadeNominalKg / 1000).toLocaleString('pt-BR')} t nominais`}
                  pressionado={cenario.guindasteId === g.id}
                  aoClicar={() => {
                    if (cenario.guindasteId === g.id) return
                    confirmarEdicao()
                    selecionarGuindaste(g.id)
                  }}
                />
              ))}
            </GrupoComandos>
            <GrupoComandos titulo="Lança">
              <BotaoComando
                rotulo="Lança JIB"
                Icone={Spline}
                dica="Liga/desliga a lança JIB (RF12): a lança principal vai ao comprimento exigido pela tabela de JIB"
                pressionado={cenario.jib.ativo}
                desabilitadoPorque={jibDisponivel ? undefined : `JIB desligado para o ${guindaste.nome} até a confirmação da Ribas`}
                aoClicar={() => definirJIB({ ativo: !cenario.jib.ativo })}
              />
            </GrupoComandos>
            <GrupoComandos titulo="Sapatas">
              <BotaoComando
                rotulo="Extensão máxima"
                Icone={ArrowDownToLine}
                dica="Leva as 4 sapatas à extensão máxima — a única condição com capacidade na ficha"
                aoClicar={() =>
                  POSICOES_SAPATA.forEach((pos) =>
                    definirSapata(pos, (pos.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras).estendidaM.valor),
                  )
                }
              />
            </GrupoComandos>
          </>
        )}

        {aba === 'avaliar' && (
          <>
            <GrupoComandos titulo="Consulta">
              <BotaoComando
                rotulo={comandos.buscarPorPeso.rotulo}
                Icone={Search}
                dica={comandos.buscarPorPeso.dica}
                aoClicar={comandos.buscarPorPeso.executar}
              />
            </GrupoComandos>
            <GrupoComandos titulo="Cenários">
              <BotaoComando
                rotulo={comandos.comparar.rotulo}
                Icone={Columns2}
                dica={comandos.comparar.dica}
                aoClicar={comandos.comparar.executar}
              />
            </GrupoComandos>
            <GrupoComandos titulo="Relatório">
              <BotaoComando
                rotulo="Relatório PDF"
                Icone={FileText}
                dica={comandos.exportarPdf.dica}
                aoClicar={comandos.exportarPdf.executar}
              />
            </GrupoComandos>
          </>
        )}
      </div>
    </div>
  )
}
