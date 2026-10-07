import type { ReactNode } from 'react'
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

/** Um nó recolhível da árvore (estilo FeatureManager do SolidWorks). */
function No({ titulo, icone, resumo, aberto = true, children }: {
  titulo: string
  icone: string
  resumo?: string
  aberto?: boolean
  children: ReactNode
}) {
  return (
    <details className="arvore__no" open={aberto}>
      <summary>
        <span className="arvore__icone" aria-hidden="true">
          {icone}
        </span>
        <span className="arvore__titulo">{titulo}</span>
        {resumo && <span className="arvore__resumo">{resumo}</span>}
      </summary>
      <div className="arvore__conteudo">{children}</div>
    </details>
  )
}

const m = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m`

/**
 * Árvore de parâmetros (Épico 12, RF16/RF23) — todo ponto ajustável do
 * cenário, com rótulo, unidade e faixa válida visíveis. Cada nó mostra um
 * resumo do valor atual mesmo recolhido. Tudo escreve no estado único da
 * store (Épico 11); comprimento e raio também têm campos embutidos na cena.
 */
export function ArvoreParametros() {
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

  const ctx = CATALOGO[cenario.guindasteId]
  const { especificacao: esp, criterioDeGiro, guindaste } = ctx
  const limiteGiro = esp.giro.limiteMecanicoGraus
  const jibDisponivel = esp.jib.habilitado && guindaste.possuiJIB
  const pernasTabela = cenario.jib.ativo
    ? esp.jib.pernas === null
      ? []
      : [esp.jib.pernas]
    : pernasPrevistasPelaTabela(esp, cenario.lanca.comprimentoM)
  const ganchoDeReferencia = cenario.jib.ativo
    ? esp.jib.massaGanchoIncluidaNaTabelaKg
    : esp.moitao.massaGanchoIncluidaNaTabelaKg
  const itemCabo = avaliacao.somatorio.itens.find((i) => i.descricao.startsWith('Cabo de içamento'))
  const sapatasNaMaxima = POSICOES_SAPATA.every((pos) => {
    const par = pos.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
    return Math.abs(cenario.sapatas[pos] - par.estendidaM.valor) < 1e-3
  })

  return (
    <nav className="arvore" aria-label="Árvore de parâmetros">
      <div className="arvore__cabecalho">Parâmetros do cenário</div>

      <No titulo="Guindaste" icone="▣" resumo={guindaste.nome}>
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
        {jibDisponivel && (
          <label className="checkbox">
            <input type="checkbox" checked={cenario.jib.ativo} onChange={(e) => definirJIB({ ativo: e.target.checked })} />
            Usar lança JIB (RF12)
          </label>
        )}
        <p className="arvore__nota">Fonte: {esp.documentoFonte}</p>
      </No>

      <No titulo="Lança" icone="╱" resumo={`${m(cenario.lanca.comprimentoM)} · ${cenario.lanca.anguloGraus.toFixed(1)}°`}>
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
          valor={avaliacao.geometria.raioM}
          aoMudar={definirRaioM}
          min={0}
          dica="ajusta o ângulo da lança"
        />
      </No>

      <No
        titulo="Giro"
        icone="↻"
        resumo={`${avaliacao.giro.normalizadoGraus.toFixed(1)}° · ${avaliacao.giro.regioes.map(rotuloRegiao).join(' / ') || '—'}`}
      >
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
        <p className="arvore__nota">
          Área de operação (derivada do giro):{' '}
          <strong>{avaliacao.giro.regioes.map(rotuloRegiao).join(' / ') || 'fora das áreas da tabela'}</strong>
          {criterioDeGiro.provisorio && <span className="selo-provisorio">Critério de giro provisório</span>}
        </p>
      </No>

      {cenario.jib.ativo && (
        <No titulo="JIB" icone="⟋" resumo={`${m(cenario.jib.comprimentoM)} · ${cenario.jib.anguloGraus.toFixed(1)}°`}>
          <label className="campo-simples">
            Comprimento do JIB (m)
            <select value={cenario.jib.comprimentoM} onChange={(e) => definirJIB({ comprimentoM: Number(e.target.value) })}>
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
          <p className="arvore__nota">
            Montado com a lança principal em {esp.jib.comprimentoLancaExigidoM?.toLocaleString('pt-BR')} m (exigência da
            tabela). Entre os ângulos tabelados (10°, 25°, 40°) a capacidade é interpolada e arredondada para baixo.
          </p>
        </No>
      )}

      <No titulo="Sapatas" icone="⊥" resumo={sapatasNaMaxima ? 'extensão máxima' : 'extensão parcial'} aberto={false}>
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
      </No>

      <No
        titulo="Cabo e moitão"
        icone="⚓"
        resumo={`${cenario.cabo.numeroDePernas ?? '?'} perna(s)${itemCabo ? ` · cabo ${Math.round(itemCabo.massaKg)} kg` : ' · cabo sem massa'}`}
      >
        <CampoParametro
          rotulo="Nº de pernas do cabo"
          unidade="un"
          casas={0}
          valor={cenario.cabo.numeroDePernas}
          aoMudar={(v) => atualizar((c) => void (c.cabo.numeroDePernas = Math.max(1, Math.round(v))))}
          aoLimpar={() => atualizar((c) => void (c.cabo.numeroDePernas = null))}
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
        <p className="arvore__nota">
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
      </No>

      <No titulo="Carga" icone="▢" resumo={`${Math.round(cenario.carga.pesoKg).toLocaleString('pt-BR')} kg`}>
        <label className="campo-simples">
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
        <div className="arvore__grade3">
          <CampoParametro rotulo="Comprimento da carga" unidade="m" valor={cenario.carga.comprimentoM} min={0}
            aoMudar={(v) => atualizar((c) => void (c.carga.comprimentoM = Math.max(0, v)))} />
          <CampoParametro rotulo="Largura da carga" unidade="m" valor={cenario.carga.larguraM} min={0}
            aoMudar={(v) => atualizar((c) => void (c.carga.larguraM = Math.max(0, v)))} />
          <CampoParametro rotulo="Altura da carga" unidade="m" valor={cenario.carga.alturaM} min={0}
            aoMudar={(v) => atualizar((c) => void (c.carga.alturaM = Math.max(0, v)))} />
        </div>
        <div className="arvore__grade3">
          <CampoParametro rotulo="CG dx" unidade="m" valor={cenario.carga.centroDeGravidade.dx}
            aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dx = v))} />
          <CampoParametro rotulo="CG dy" unidade="m" valor={cenario.carga.centroDeGravidade.dy}
            aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dy = v))} />
          <CampoParametro rotulo="CG dz" unidade="m" valor={cenario.carga.centroDeGravidade.dz}
            aoMudar={(v) => atualizar((c) => void (c.carga.centroDeGravidade.dz = v))} />
        </div>
      </No>

      <No
        titulo="Acessórios"
        icone="⛓"
        resumo={`lingada ${Math.round(cenario.acessorios.massaLingadaKg)} kg${cenario.acessorios.usaBalancim ? ' · balancim' : ''}`}
        aberto={false}
      >
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
      </No>

      <No titulo="Limites e operação" icone="⚠" resumo={`limite ${cenario.limiteUtilizacaoPercentual}%`} aberto={false}>
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
      </No>

      <No titulo="Ambiente (informativo)" icone="☁" aberto={false}>
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
      </No>
    </nav>
  )
}
