import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { CATALOGO } from '../../data/catalogo'
import { pernasPrevistasPelaTabela } from '../../engine/avaliarCenario'
import { rotuloRegiao } from '../../engine/capacidadeDetalhada'
import { formatarMassa, useInterfaceStore } from '../../store/useInterfaceStore'
import { useSimulacaoStore } from '../../store/useSimulacaoStore'
import { POSICOES_SAPATA, type PosicaoSapata } from '../../types/cenario'
import { ehAproximado } from '../../types/especificacao'
import { CampoParametro } from '../CampoParametro'
import type { IdNo } from './nos'

const ROTULO_SAPATA: Record<PosicaoSapata, string> = {
  dianteira_esquerda: 'Sapata dianteira esquerda',
  dianteira_direita: 'Sapata dianteira direita',
  traseira_esquerda: 'Sapata traseira esquerda',
  traseira_direita: 'Sapata traseira direita',
}

const m = (v: number, casas = 2) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} m`

/** Grupo recolhível do PropertyManager (o "rollout" do SolidWorks). */
export function Grupo({ titulo, children, aberto = true }: { titulo: string; children: ReactNode; aberto?: boolean }) {
  const [expandido, setExpandido] = useState(aberto)
  return (
    <section className={`pm-grupo ${expandido ? '' : 'pm-grupo--recolhido'}`}>
      <button type="button" className="pm-grupo__titulo" aria-expanded={expandido} onClick={() => setExpandido(!expandido)}>
        <ChevronDown size={14} aria-hidden="true" className="pm-grupo__seta" />
        {titulo}
      </button>
      {expandido && <div className="pm-grupo__conteudo">{children}</div>}
    </section>
  )
}

/** Linha só de leitura (valor calculado pelo motor), sempre com rótulo e unidade. */
function Leitura({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div className="pm-leitura">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

/**
 * Campos de cada nó no PropertyManager (Épico 17, RF16). Tudo escreve no
 * estado único da store (Épico 11) e o resultado é recalculado ao vivo.
 */
export function PropriedadesDoNo({ no }: { no: IdNo }) {
  const guindastes = useSimulacaoStore((s) => s.guindastes)
  const cenario = useSimulacaoStore((s) => s.cenario)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const selecionarGuindaste = useSimulacaoStore((s) => s.selecionarGuindaste)
  const atualizar = useSimulacaoStore((s) => s.atualizarCenario)
  const definirComprimentoLancaM = useSimulacaoStore((s) => s.definirComprimentoLancaM)
  const definirAnguloGraus = useSimulacaoStore((s) => s.definirAnguloGraus)
  const definirRaioM = useSimulacaoStore((s) => s.definirRaioM)
  const definirGiroGraus = useSimulacaoStore((s) => s.definirGiroGraus)
  const definirJIB = useSimulacaoStore((s) => s.definirJIB)
  const definirSapata = useSimulacaoStore((s) => s.definirSapata)
  const unidade = useInterfaceStore((s) => s.unidadeMassa)

  const ctx = CATALOGO[cenario.guindasteId]
  const { especificacao: esp, criterioDeGiro, guindaste } = ctx
  const limiteGiro = esp.giro.limiteMecanicoGraus
  const jibDisponivel = esp.jib.habilitado && guindaste.possuiJIB
  const geo = avaliacao.geometria

  switch (no) {
    case 'guindaste':
      return (
        <>
          <Grupo titulo="Modelo">
            <label className="campo-simples">
              Guindaste
              <select value={cenario.guindasteId} onChange={(e) => selecionarGuindaste(e.target.value)}>
                {guindastes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} ({g.fabricante})
                  </option>
                ))}
              </select>
            </label>
            <label className={`checkbox ${jibDisponivel ? '' : 'checkbox--desabilitado'}`}>
              <input
                type="checkbox"
                disabled={!jibDisponivel}
                checked={cenario.jib.ativo}
                onChange={(e) => definirJIB({ ativo: e.target.checked })}
              />
              Usar lança JIB (RF12)
            </label>
            {!jibDisponivel && <p className="pm-nota">JIB desligado para o {guindaste.nome} até a confirmação da Ribas.</p>}
          </Grupo>
          <Grupo titulo="Dados do fabricante">
            <Leitura rotulo="Fabricante" valor={guindaste.fabricante} />
            <Leitura rotulo="Capacidade nominal" valor={formatarMassa(guindaste.capacidadeNominalKg, unidade)} />
            <Leitura rotulo="Altura do pé da lança" valor={m(esp.lanca.alturaPeM.valor)} />
            <Leitura rotulo="Recuo do pé da lança" valor={m(esp.lanca.recuoPeM.valor)} />
            <p className="pm-nota">Fonte: {esp.documentoFonte}</p>
          </Grupo>
        </>
      )

    case 'lanca':
      return (
        <>
          <Grupo titulo="Lança principal">
            <CampoParametro
              rotulo="Comprimento da lança"
              unidade="m"
              valor={cenario.lanca.comprimentoM}
              aoMudar={definirComprimentoLancaM}
              min={esp.lanca.comprimentoMinM.valor}
              max={esp.lanca.comprimentoMaxM.valor}
              aproximado={ehAproximado(esp.lanca.comprimentoMaxM)}
              desabilitado={cenario.jib.ativo}
              dica={cenario.jib.ativo ? 'fixo pela tabela de JIB' : `${esp.lanca.numeroDeSecoes.valor} seções telescópicas`}
            />
            <CampoParametro
              rotulo="Ângulo da lança"
              unidade="°"
              casas={1}
              valor={cenario.lanca.anguloGraus}
              aoMudar={definirAnguloGraus}
              min={esp.lanca.anguloMinGraus.valor}
              max={esp.lanca.anguloMaxGraus.valor}
              aproximado={ehAproximado(esp.lanca.anguloMaxGraus)}
              dica="em relação à horizontal"
            />
            <CampoParametro
              rotulo="Raio de trabalho — do centro de giro"
              unidade="m"
              valor={geo.raioM}
              aoMudar={definirRaioM}
              min={0}
              dica="ajusta o ângulo da lança"
            />
          </Grupo>
          <Grupo titulo="Geometria calculada">
            <Leitura rotulo="Altura da ponta" valor={m(geo.alturaPontaM)} />
            <Leitura rotulo="Cabo pendente por perna" valor={m(geo.comprimentoCaboPendenteM)} />
          </Grupo>
        </>
      )

    case 'giro':
      return (
        <Grupo titulo="Superestrutura">
          <CampoParametro
            rotulo="Giro da superestrutura"
            unidade="°"
            casas={1}
            valor={cenario.giroGraus}
            aoMudar={definirGiroGraus}
            min={limiteGiro === null ? -180 : -limiteGiro}
            max={limiteGiro === null ? 180 : limiteGiro}
            dica={criterioDeGiro.referencia}
          />
          <Leitura
            rotulo="Área da tabela (derivada do giro)"
            valor={avaliacao.giro.regioes.map(rotuloRegiao).join(' / ') || 'fora das áreas da tabela'}
          />
          {criterioDeGiro.provisorio && <span className="selo-provisorio">Critério de giro provisório</span>}
          <p className="pm-nota">{criterioDeGiro.justificativa}</p>
        </Grupo>
      )

    case 'jib':
      return (
        <Grupo titulo="Lança JIB">
          <label className="campo-simples">
            Comprimento do JIB (m)
            <select value={cenario.jib.comprimentoM} onChange={(e) => definirJIB({ comprimentoM: Number(e.target.value) })}>
              {esp.jib.comprimentosM.map((c) => (
                <option key={c} value={c}>
                  {c.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} m
                </option>
              ))}
            </select>
          </label>
          <CampoParametro
            rotulo="Ângulo do JIB"
            unidade="°"
            casas={1}
            valor={cenario.jib.anguloGraus}
            aoMudar={(v) => definirJIB({ anguloGraus: v })}
            min={esp.jib.anguloMinGraus}
            max={esp.jib.anguloMaxGraus}
            dica="offset para baixo em relação à lança principal"
          />
          <CampoParametro
            rotulo="Raio de trabalho — do centro de giro"
            unidade="m"
            valor={geo.raioM}
            aoMudar={definirRaioM}
            min={0}
            dica="ajusta o ângulo da lança principal"
          />
          <Leitura rotulo="Lança principal exigida" valor={m(esp.jib.comprimentoLancaExigidoM ?? cenario.lanca.comprimentoM)} />
        </Grupo>
      )

    case 'sapatas': {
      return (
        <>
          <Grupo titulo="Extensão de cada sapata">
            {POSICOES_SAPATA.map((posicao) => {
              const par = posicao.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
              return (
                <CampoParametro
                  key={posicao}
                  rotulo={ROTULO_SAPATA[posicao]}
                  unidade="m"
                  valor={cenario.sapatas[posicao]}
                  aoMudar={(v) => definirSapata(posicao, v)}
                  min={par.recolhidaM.valor}
                  max={par.estendidaM.valor}
                  aproximado={ehAproximado(par.recolhidaM)}
                  dica="do eixo do caminhão ao centro da sapata"
                />
              )
            })}
          </Grupo>
          <Grupo titulo="Ação rápida">
            <button
              type="button"
              className="comando"
              onClick={() =>
                POSICOES_SAPATA.forEach((pos) =>
                  definirSapata(pos, (pos.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras).estendidaM.valor),
                )
              }
            >
              Todas na extensão máxima
            </button>
          </Grupo>
        </>
      )
    }

    case 'cabo': {
      const pernasTabela = cenario.jib.ativo
        ? esp.jib.pernas === null
          ? []
          : [esp.jib.pernas]
        : pernasPrevistasPelaTabela(esp, cenario.lanca.comprimentoM)
      const ganchoDeReferencia = cenario.jib.ativo
        ? esp.jib.massaGanchoIncluidaNaTabelaKg
        : esp.moitao.massaGanchoIncluidaNaTabelaKg
      const itemCabo = avaliacao.somatorio.itens.find((i) => i.descricao.startsWith('Cabo de içamento'))
      return (
        <>
          <Grupo titulo="Cabo de içamento">
            <CampoParametro
              rotulo="Nº de pernas do cabo"
              unidade="un"
              casas={0}
              valor={cenario.cabo.numeroDePernas}
              aoMudar={(v) => atualizar((c) => void (c.cabo.numeroDePernas = Math.max(1, Math.round(v))))}
              aoLimpar={() => atualizar((c) => void (c.cabo.numeroDePernas = null))}
              min={1}
              dica={pernasTabela.length > 0 ? `a tabela prevê ${pernasTabela.join(' ou ')}` : 'não consta na ficha — informe'}
            />
            <CampoParametro
              rotulo="Massa linear do cabo"
              unidade="kg/m"
              casas={3}
              valor={cenario.cabo.massaLinearKgM}
              aoMudar={(v) => atualizar((c) => void (c.cabo.massaLinearKgM = Math.max(0, v)))}
              aoLimpar={() => atualizar((c) => void (c.cabo.massaLinearKgM = null))}
              min={0}
              dica={`cabo ${esp.cabo.bitola} — não consta nas fichas; use o certificado do cabo`}
            />
            <CampoParametro
              rotulo="Massa do cabo — valor manual"
              unidade="kg"
              casas={0}
              valor={cenario.cabo.massaSobrescritaKg}
              aoMudar={(v) => atualizar((c) => void (c.cabo.massaSobrescritaKg = Math.max(0, v)))}
              aoLimpar={() => atualizar((c) => void (c.cabo.massaSobrescritaKg = null))}
              min={0}
              dica="vazio = cálculo automático"
            />
            <Leitura rotulo="Cabo pendente por perna" valor={m(geo.comprimentoCaboPendenteM)} />
            <Leitura
              rotulo="Massa do cabo no somatório"
              valor={itemCabo ? formatarMassa(itemCabo.massaKg, unidade) : 'não calculada'}
            />
          </Grupo>
          <Grupo titulo="Moitão / gancho">
            <CampoParametro
              rotulo="Massa do moitão/gancho"
              unidade="kg"
              casas={0}
              valor={cenario.moitao.massaKg}
              aoMudar={(v) => atualizar((c) => void (c.moitao.massaKg = Math.max(0, v)))}
              aoLimpar={() => atualizar((c) => void (c.moitao.massaKg = null))}
              min={0}
              dica={
                ganchoDeReferencia !== null
                  ? `a tabela já inclui ${ganchoDeReferencia} kg; só o excedente entra no somatório`
                  : 'a ficha não diz se a tabela o inclui; entra inteiro'
              }
            />
          </Grupo>
        </>
      )
    }

    case 'carga':
      return (
        <>
          <Grupo titulo="Peça a içar">
            <label className="campo-simples">
              Descrição da carga
              <input
                type="text"
                value={cenario.carga.descricao}
                placeholder="ex.: transformador 9 t"
                onChange={(e) => atualizar((c) => void (c.carga.descricao = e.target.value))}
              />
            </label>
            <CampoParametro
              rotulo="Peso da carga"
              unidade="kg"
              casas={0}
              valor={cenario.carga.pesoKg}
              aoMudar={(v) => atualizar((c) => void (c.carga.pesoKg = Math.max(0, v)))}
              min={0}
            />
          </Grupo>
          <Grupo titulo="Dimensões">
            <div className="pm-grade3">
              <CampoParametro rotulo="Comprimento da carga" unidade="m" valor={cenario.carga.comprimentoM} min={0}
                aoMudar={(v) => atualizar((c) => void (c.carga.comprimentoM = Math.max(0, v)))} />
              <CampoParametro rotulo="Largura da carga" unidade="m" valor={cenario.carga.larguraM} min={0}
                aoMudar={(v) => atualizar((c) => void (c.carga.larguraM = Math.max(0, v)))} />
              <CampoParametro rotulo="Altura da carga" unidade="m" valor={cenario.carga.alturaM} min={0}
                aoMudar={(v) => atualizar((c) => void (c.carga.alturaM = Math.max(0, v)))} />
            </div>
          </Grupo>
          <Grupo titulo="Centro de gravidade" aberto={false}>
            <div className="pm-grade3">
              <CampoParametro rotulo="CG dx" unidade="m" valor={cenario.carga.centroDeGravidade.dx}
                aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dx = v))} />
              <CampoParametro rotulo="CG dy" unidade="m" valor={cenario.carga.centroDeGravidade.dy}
                aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dy = v))} />
              <CampoParametro rotulo="CG dz" unidade="m" valor={cenario.carga.centroDeGravidade.dz}
                aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dz = v))} />
            </div>
          </Grupo>
        </>
      )

    case 'acessorios':
      return (
        <Grupo titulo="Lingada e balancim">
          <CampoParametro
            rotulo="Massa da lingada"
            unidade="kg"
            casas={0}
            valor={cenario.acessorios.massaLingadaKg}
            aoMudar={(v) => atualizar((c) => void (c.acessorios.massaLingadaKg = Math.max(0, v)))}
            min={0}
          />
          <CampoParametro
            rotulo="Altura da lingada"
            unidade="m"
            valor={cenario.acessorios.alturaLingadaM}
            aoMudar={(v) => atualizar((c) => void (c.acessorios.alturaLingadaM = Math.max(0, v)))}
            min={0}
            dica="do gancho ao topo da carga, com balancim"
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={cenario.acessorios.usaBalancim}
              onChange={(e) => atualizar((c) => void (c.acessorios.usaBalancim = e.target.checked))}
            />
            Usar balancim
          </label>
          {cenario.acessorios.usaBalancim && (
            <CampoParametro
              rotulo="Massa do balancim"
              unidade="kg"
              casas={0}
              valor={cenario.acessorios.massaBalancimKg}
              aoMudar={(v) => atualizar((c) => void (c.acessorios.massaBalancimKg = Math.max(0, v)))}
              min={0}
            />
          )}
        </Grupo>
      )

    case 'limites':
      return (
        <Grupo titulo="Critérios do engenheiro">
          <CampoParametro
            rotulo="Altura de içamento necessária"
            unidade="m"
            valor={cenario.alturaIcamentoNecessariaM}
            aoMudar={(v) => atualizar((c) => void (c.alturaIcamentoNecessariaM = Math.max(0, v)))}
            aoLimpar={() => atualizar((c) => void (c.alturaIcamentoNecessariaM = null))}
            min={0}
            dica={`base da carga · ponta a ${m(geo.alturaPontaM)}`}
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
      )

    case 'ambiente':
      return (
        <Grupo titulo="Condições do local">
          <CampoParametro
            rotulo="Vento máximo (informativo)"
            unidade="m/s"
            casas={1}
            valor={cenario.ambiente.ventoMaximoMS}
            aoMudar={(v) => atualizar((c) => void (c.ambiente.ventoMaximoMS = Math.max(0, v)))}
            aoLimpar={() => atualizar((c) => void (c.ambiente.ventoMaximoMS = null))}
            dica="sem dado nas fichas — vai só para o relatório"
          />
          <CampoParametro
            rotulo="Pressão admissível do solo (informativo)"
            unidade="kgf/cm²"
            valor={cenario.ambiente.pressaoAdmissivelSoloKgfCm2}
            aoMudar={(v) => atualizar((c) => void (c.ambiente.pressaoAdmissivelSoloKgfCm2 = Math.max(0, v)))}
            aoLimpar={() => atualizar((c) => void (c.ambiente.pressaoAdmissivelSoloKgfCm2 = null))}
            dica="sem dado nas fichas — vai só para o relatório"
          />
        </Grupo>
      )
  }
}
