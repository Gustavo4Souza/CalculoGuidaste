import { ChevronRight } from 'lucide-react'
import { useFluxoStore } from '../../store/useFluxoStore'
import { formatarMassa, useInterfaceStore } from '../../store/useInterfaceStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { CampoParametro } from '../CampoParametro'
import { Grupo } from '../gerenciador/PropriedadesDoNo'
import { useSituacaoDasEtapas } from './useSituacaoDasEtapas'

/**
 * ② Carga (Épico 18): o pedido do cliente começa pela peça. Peso, dimensões,
 * centro de gravidade, acessórios, a massa linear do cabo e — o que define a
 * escolha do guindaste — o RAIO NECESSÁRIO (do centro de giro até a peça).
 * Tudo escreve no cenário (estado único); o raio fica no fluxo.
 */
export function TelaCarga() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const atualizar = useSimulacaoStore((s) => s.atualizarCenario)
  const raio = useFluxoStore((s) => s.raioNecessarioM)
  const definirRaio = useFluxoStore((s) => s.definirRaioNecessario)
  const irPara = useFluxoStore((s) => s.irPara)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)
  const situacao = useSituacaoDasEtapas()
  const { carga, acessorios } = cenario
  const preliminar = carga.pesoKg + acessorios.massaLingadaKg + (acessorios.usaBalancim ? acessorios.massaBalancimKg : 0)

  return (
    <div className="tela tela--duas-colunas">
      <header className="tela__cabecalho">
        <span className="tela__numero">2</span>
        <div>
          <h2>Carga</h2>
          <p>A peça a içar e as condições da operação. Com o peso e o raio, o simulador sugere os guindastes viáveis.</p>
        </div>
      </header>

      <div className="tela__corpo">
        <div className="tela__formulario">
          <Grupo titulo="Peça a içar">
            <label className="campo-simples">
              Descrição da carga
              <input
                type="text"
                value={carga.descricao}
                placeholder="ex.: transformador 9 t"
                onChange={(e) => atualizar((c) => void (c.carga.descricao = e.target.value))}
              />
            </label>
            <CampoParametro
              rotulo="Peso da carga"
              unidade="kg"
              casas={0}
              valor={carga.pesoKg}
              aoMudar={(v) => atualizar((c) => void (c.carga.pesoKg = Math.max(0, v)))}
              min={0}
              dica="obrigatório"
            />
            <div className="pm-grade3">
              <CampoParametro rotulo="Comprimento da carga" unidade="m" valor={carga.comprimentoM} min={0}
                aoMudar={(v) => atualizar((c) => void (c.carga.comprimentoM = Math.max(0, v)))} />
              <CampoParametro rotulo="Largura da carga" unidade="m" valor={carga.larguraM} min={0}
                aoMudar={(v) => atualizar((c) => void (c.carga.larguraM = Math.max(0, v)))} />
              <CampoParametro rotulo="Altura da carga" unidade="m" valor={carga.alturaM} min={0}
                aoMudar={(v) => atualizar((c) => void (c.carga.alturaM = Math.max(0, v)))} />
            </div>
          </Grupo>

          <Grupo titulo="Centro de gravidade" aberto={false}>
            <p className="pm-nota">Medido a partir do centro geométrico da carga.</p>
            <div className="pm-grade3">
              <CampoParametro rotulo="CG dx" unidade="m" valor={carga.centroDeGravidade.dx}
                aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dx = v))} />
              <CampoParametro rotulo="CG dy" unidade="m" valor={carga.centroDeGravidade.dy}
                aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dy = v))} />
              <CampoParametro rotulo="CG dz" unidade="m" valor={carga.centroDeGravidade.dz}
                aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dz = v))} />
            </div>
          </Grupo>

          <Grupo titulo="Acessórios e cabo">
            <CampoParametro
              rotulo="Massa da lingada"
              unidade="kg"
              casas={0}
              valor={acessorios.massaLingadaKg}
              aoMudar={(v) => atualizar((c) => void (c.acessorios.massaLingadaKg = Math.max(0, v)))}
              min={0}
            />
            <CampoParametro
              rotulo="Altura da lingada"
              unidade="m"
              valor={acessorios.alturaLingadaM}
              aoMudar={(v) => atualizar((c) => void (c.acessorios.alturaLingadaM = Math.max(0, v)))}
              min={0}
              dica="do gancho ao topo da carga, com balancim"
            />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={acessorios.usaBalancim}
                onChange={(e) => atualizar((c) => void (c.acessorios.usaBalancim = e.target.checked))}
              />
              Usar balancim
            </label>
            {acessorios.usaBalancim && (
              <CampoParametro
                rotulo="Massa do balancim"
                unidade="kg"
                casas={0}
                valor={acessorios.massaBalancimKg}
                aoMudar={(v) => atualizar((c) => void (c.acessorios.massaBalancimKg = Math.max(0, v)))}
                min={0}
              />
            )}
            <CampoParametro
              rotulo="Massa linear do cabo"
              unidade="kg/m"
              casas={3}
              valor={cenario.cabo.massaLinearKgM}
              aoMudar={(v) => atualizar((c) => void (c.cabo.massaLinearKgM = Math.max(0, v)))}
              aoLimpar={() => atualizar((c) => void (c.cabo.massaLinearKgM = null))}
              min={0}
              dica="cabo 5/8″ — não consta nas fichas; use o certificado do cabo. Vazio = operação não validada"
            />
          </Grupo>

          <Grupo titulo="Condições da operação">
            <CampoParametro
              rotulo="Raio necessário"
              unidade="m"
              valor={raio}
              aoMudar={(v) => definirRaio(Math.max(0, v))}
              aoLimpar={() => definirRaio(null)}
              min={0}
              dica="obrigatório · do centro de giro do guindaste até o centro da peça"
            />
            <CampoParametro
              rotulo="Altura de içamento necessária"
              unidade="m"
              valor={cenario.alturaIcamentoNecessariaM}
              aoMudar={(v) => atualizar((c) => void (c.alturaIcamentoNecessariaM = Math.max(0, v)))}
              aoLimpar={() => atualizar((c) => void (c.alturaIcamentoNecessariaM = null))}
              min={0}
              dica="base da carga; vazio = não verificar"
            />
            <CampoParametro
              rotulo="Limite de utilização"
              unidade="%"
              casas={0}
              valor={cenario.limiteUtilizacaoPercentual}
              aoMudar={(v) => atualizar((c) => void (c.limiteUtilizacaoPercentual = Math.min(100, Math.max(1, v))))}
              min={1}
              max={100}
              dica="acima disto o resultado vira Atenção"
            />
          </Grupo>
        </div>

        <aside className="tela__resumo" aria-label="Resumo do pedido">
          <h3 className="tela__secao">Resumo do pedido</h3>
          <table className="resultado__valores">
            <tbody>
              <tr>
                <th scope="row">Peso da carga</th>
                <td>{formatarMassa(carga.pesoKg, unidade)}</td>
              </tr>
              <tr>
                <th scope="row">Lingada + balancim</th>
                <td>{formatarMassa(preliminar - carga.pesoKg, unidade)}</td>
              </tr>
              <tr>
                <th scope="row">
                  Peso preliminar
                  <small>sem o cabo e o moitão</small>
                </th>
                <td>{formatarMassa(preliminar, unidade)}</td>
              </tr>
              <tr>
                <th scope="row">Raio necessário</th>
                <td>{raio === null ? '—' : `${raio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m`}</td>
              </tr>
            </tbody>
          </table>
          <p className="tela__nota">
            O cabo de içamento e o excedente do moitão dependem do guindaste e da lança: entram no somatório na próxima etapa.
          </p>
          <button
            type="button"
            className="comando comando--destaque tela__principal"
            disabled={!situacao.guindaste.liberada}
            title={situacao.guindaste.motivo}
            onClick={() => irPara('guindaste')}
          >
            Ver guindastes viáveis <ChevronRight size={14} aria-hidden="true" />
          </button>
          {!situacao.guindaste.liberada && <p className="tela__pendencia">{situacao.guindaste.motivo}</p>}
        </aside>
      </div>
    </div>
  )
}
