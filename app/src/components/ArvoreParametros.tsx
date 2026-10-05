import { CATALOGO } from '../data/catalogo'
import { pernasPrevistasPelaTabela } from '../engine/avaliarCenario'
import { rotuloRegiao } from '../engine/capacidadeDetalhada'
import { useSimulacaoStore } from '../store/useSimulacaoStore'
import { POSICOES_SAPATA, type PosicaoSapata } from '../types/cenario'
import { ehAproximado } from '../types/especificacao'
import { CampoParametro } from './CampoParametro'

const ROTULO_SAPATA: Record<PosicaoSapata, string> = {
  dianteira_esquerda: 'Sapata dianteira esquerda',
  dianteira_direita: 'Sapata dianteira direita',
  traseira_esquerda: 'Sapata traseira esquerda',
  traseira_direita: 'Sapata traseira direita',
}

/**
 * Todos os parâmetros do cenário (Épico 11, RF16) com rótulo, unidade e
 * faixa válida visíveis. Comprimento e raio de trabalho continuam embutidos
 * na própria cena 3D (Task 9.2). O Épico 12 reorganiza isto numa árvore
 * estilo CAD; aqui a prioridade é que TODO parâmetro já seja editável e
 * escreva no estado único da store.
 */
export function PainelParametros() {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const atualizar = useSimulacaoStore((s) => s.atualizarCenario)
  const definirAnguloGraus = useSimulacaoStore((s) => s.definirAnguloGraus)
  const definirGiroGraus = useSimulacaoStore((s) => s.definirGiroGraus)
  const definirJIB = useSimulacaoStore((s) => s.definirJIB)
  const definirSapata = useSimulacaoStore((s) => s.definirSapata)

  const { especificacao: esp, criterioDeGiro } = CATALOGO[cenario.guindasteId]
  const limiteGiro = esp.giro.limiteMecanicoGraus
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
      <section className="painel">
        <h2>Lança e giro</h2>
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
          rotulo="Giro da superestrutura"
          unidade="°"
          casas={1}
          valor={cenario.giroGraus}
          aoMudar={definirGiroGraus}
          min={limiteGiro === null ? -180 : -limiteGiro}
          max={limiteGiro === null ? 180 : limiteGiro}
          dica={criterioDeGiro.referencia}
        />
        <p className="painel__derivado">
          Área de operação (derivada do giro):{' '}
          <strong>{avaliacao.giro.regioes.map(rotuloRegiao).join(' / ') || 'fora das áreas da tabela'}</strong>
          {criterioDeGiro.provisorio && <span className="selo-provisorio">Critério de giro provisório</span>}
        </p>
      </section>

      {cenario.jib.ativo && (
        <section className="painel">
          <h2>JIB</h2>
          <label>
            Comprimento do JIB (m)
            <select
              value={cenario.jib.comprimentoM}
              onChange={(e) => definirJIB({ comprimentoM: Number(e.target.value) })}
            >
              {esp.jib.comprimentosM.map((c) => (
                <option key={c} value={c}>
                  {c.toFixed(1)} m
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
            dica="offset em relação à lança principal"
          />
          <p className="rf-note">
            O JIB é montado com a lança principal em {esp.jib.comprimentoLancaExigidoM?.toLocaleString('pt-BR')} m (exigência
            da tabela). Comprimentos do JIB são seções montadas (só os valores tabelados); entre os ângulos tabelados (10°,
            25°, 40°) a capacidade é interpolada e arredondada para baixo.
          </p>
        </section>
      )}

      <section className="painel">
        <h2>Sapatas</h2>
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
              dica="do eixo do caminhão; só a máxima tem tabela"
            />
          )
        })}
      </section>

      <section className="painel">
        <h2>Cabo de içamento e moitão</h2>
        <CampoParametro
          rotulo="Nº de pernas do cabo"
          unidade="un"
          casas={0}
          valor={cenario.cabo.numeroDePernas}
          aoMudar={(v) => atualizar((c) => void (c.cabo.numeroDePernas = Math.max(1, Math.round(v))))}
          min={1}
          dica={pernasTabela.length > 0 ? `a tabela prevê ${pernasTabela.join(' ou ')}` : 'não consta na ficha'}
        />
        <CampoParametro
          rotulo="Massa linear do cabo"
          unidade="kg/m"
          casas={3}
          valor={cenario.cabo.massaLinearKgM}
          aoMudar={(v) => atualizar((c) => void (c.cabo.massaLinearKgM = Math.max(0, v)))}
          aoLimpar={() => atualizar((c) => void (c.cabo.massaLinearKgM = null))}
          min={0}
          dica={`cabo ${esp.cabo.bitola} — não consta nas fichas, informe pelo catálogo do fornecedor`}
        />
        <p className="painel__derivado">
          Cabo pendente: {avaliacao.geometria.comprimentoCaboPendenteM.toFixed(2)} m por perna
          {itemCabo && <> · massa considerada: {Math.round(itemCabo.massaKg).toLocaleString('pt-BR')} kg</>}
        </p>
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
      </section>

      <section className="painel">
        <h2>Carga</h2>
        <label>
          Descrição da carga
          <input
            type="text"
            value={cenario.carga.descricao}
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
        <div className="painel__grade3">
          <CampoParametro rotulo="Comprimento da carga" unidade="m" valor={cenario.carga.comprimentoM} min={0}
            aoMudar={(v) => atualizar((c) => void (c.carga.comprimentoM = Math.max(0, v)))} />
          <CampoParametro rotulo="Largura da carga" unidade="m" valor={cenario.carga.larguraM} min={0}
            aoMudar={(v) => atualizar((c) => void (c.carga.larguraM = Math.max(0, v)))} />
          <CampoParametro rotulo="Altura da carga" unidade="m" valor={cenario.carga.alturaM} min={0}
            aoMudar={(v) => atualizar((c) => void (c.carga.alturaM = Math.max(0, v)))} />
        </div>
        <div className="painel__grade3">
          <CampoParametro rotulo="CG dx" unidade="m" valor={cenario.carga.centroDeGravidade.dx}
            aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dx = v))} />
          <CampoParametro rotulo="CG dy" unidade="m" valor={cenario.carga.centroDeGravidade.dy}
            aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dy = v))} />
          <CampoParametro rotulo="CG dz" unidade="m" valor={cenario.carga.centroDeGravidade.dz}
            aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dz = v))} />
        </div>
      </section>

      <section className="painel">
        <h2>Acessórios</h2>
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
      </section>

      <section className="painel">
        <h2>Operação e limites</h2>
        <CampoParametro
          rotulo="Altura de içamento necessária"
          unidade="m"
          valor={cenario.alturaIcamentoNecessariaM}
          aoMudar={(v) => atualizar((c) => void (c.alturaIcamentoNecessariaM = Math.max(0, v)))}
          aoLimpar={() => atualizar((c) => void (c.alturaIcamentoNecessariaM = null))}
          min={0}
          dica={`base da carga; ponta a ${avaliacao.geometria.alturaPontaM.toFixed(2)} m`}
        />
        <CampoParametro
          rotulo="Limite de utilização"
          unidade="%"
          casas={0}
          valor={cenario.limiteUtilizacaoPercentual}
          aoMudar={(v) => atualizar((c) => void (c.limiteUtilizacaoPercentual = Math.min(100, Math.max(1, v))))}
          min={1}
          max={100}
          dica="alerta acima disto"
        />
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
      </section>
    </>
  )
}
