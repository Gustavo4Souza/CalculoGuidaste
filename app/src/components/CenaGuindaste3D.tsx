import { GizmoHelper, GizmoViewcube, Grid, Html, OrbitControls } from '@react-three/drei'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { Group, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CATALOGO } from '../data/catalogo'
import { calcularPonta } from '../engine/geometriaLanca'
import type { VistaPadrao } from '../store/useInterfaceStore'
import { comprimentosReaisDaTabela, useSimulacaoStore } from '../store/useSimulacaoStore'
import type { PosicaoSapata } from '../types/cenario'
import { ehAproximado, type EspecificacaoGuindaste, type ValorComFonte } from '../types/especificacao'
import { AnelDeGiro } from './cena/AnelDeGiro'
import { Caminhao } from './cena/Caminhao'
import { CargaSuspensa } from './cena/CargaSuspensa'
import { CAMERA_FOV, ControladorDeVista, VISTA_ISOMETRICA } from './cena/ControladorDeVista'
import { Cotas } from './cena/Cotas'
import { extremosDoCaminhao, giroDoPonto, rotacaoDoGiro } from './cena/geometriaCena'
import {
  capturarPonteiro,
  COR_JIB,
  COR_LANCA,
  COR_SUPERESTRUTURA,
  cursor,
  PlanoDeArrastoHorizontal,
  PlanoDeArrastoVertical,
  SEM_PONTEIRO,
} from './cena/primitivas'
import { Sapatas } from './cena/Sapatas'
import { SegmentoLanca } from './cena/SegmentoLanca'
import { anguloDoPonto, aplicarSnapComprimento, projetarComprimento } from './geometriaCanvas'
import { useCampoNumericoSincronizado } from './useCampoNumericoSincronizado'

/**
 * Cena 3D do guindaste (Épico 13 — modelo fiel às fichas e arrasto de todos
 * os parâmetros). Lê e escreve direto no estado único da store (Épico 11).
 *
 * Referencial (ver cena/geometriaCena.ts): origem no CENTRO DE GIRO; o
 * caminhão fica parado ao longo de X e a superestrutura gira em Y com o
 * giro (0° aponta para +X). Dentro da superestrutura, a lança opera no plano
 * local XY, com o pé em x = -recuo (RF11) — então o raio desenhado é
 * exatamente o raio do motor.
 *
 * Arrastos: gancho → ângulo da lança (ou raio, com JIB); a própria lança →
 * comprimento (com as marcas de encaixe da tabela); a barra do JIB → ângulo
 * do JIB; as esferas ao longo do JIB → comprimento do JIB; o anel no chão →
 * giro; o pé de cada sapata → extensão daquela sapata.
 */

/** Câmera isométrica inicial — exportada para os testes e2e projetarem pontos 3D em pixels. */
export const CAMERA_POSICAO: [number, number, number] = VISTA_ISOMETRICA.posicao
export const CAMERA_ALVO: [number, number, number] = VISTA_ISOMETRICA.alvo
export { CAMERA_FOV }
export { GANCHO_OFFSET_Y } from './geometriaCanvas'

const COR_CHAO = '#dfe4ea'

type Arrasto =
  | { tipo: 'angulo' }
  | { tipo: 'comprimento' }
  | { tipo: 'jibAngulo' }
  | { tipo: 'raio' }
  | { tipo: 'giro' }
  | { tipo: 'sapata'; posicao: PosicaoSapata }

function semAcao() {
  /* no-op — hooks precisam de um setter mesmo quando o campo não aparece */
}

function Chao() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={COR_CHAO} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[120, 120]}
        cellSize={2}
        cellThickness={0.8}
        cellColor="#b9c2cc"
        sectionSize={10}
        sectionThickness={1.6}
        sectionColor="#8b97a5"
        fadeDistance={80}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </group>
  )
}

/** Quantas medidas do desenho vêm da ficha e quantas são aproximadas (selo ≈). */
function contarFontes(esp: EspecificacaoGuindaste): { ficha: number; aproximadas: number } {
  const valores: ValorComFonte[] = [
    ...esp.caminhao.eixosM,
    ...Object.values(esp.caminhao).filter((v): v is ValorComFonte => !Array.isArray(v)),
    ...Object.values(esp.superestrutura),
    esp.lanca.alturaPeM,
    esp.lanca.recuoPeM,
    esp.sapatas.dianteiras.estendidaM,
    esp.sapatas.traseiras.estendidaM,
  ]
  const aproximadas = valores.filter(ehAproximado).length
  return { ficha: valores.length - aproximadas, aproximadas }
}

export function CenaGuindaste3D({
  corDestaque,
  vista,
}: {
  corDestaque: string
  vista: { nome: VistaPadrao; pedido: number }
}) {
  const cenario = useSimulacaoStore((s) => s.cenario)
  const avaliacao = useSimulacaoStore((s) => s.avaliacao)
  const definirAnguloGraus = useSimulacaoStore((s) => s.definirAnguloGraus)
  const definirComprimentoLancaM = useSimulacaoStore((s) => s.definirComprimentoLancaM)
  const definirRaioM = useSimulacaoStore((s) => s.definirRaioM)
  const definirGiroGraus = useSimulacaoStore((s) => s.definirGiroGraus)
  const definirJIB = useSimulacaoStore((s) => s.definirJIB)
  const definirSapata = useSimulacaoStore((s) => s.definirSapata)

  const ctx = CATALOGO[cenario.guindasteId]
  const esp = ctx.especificacao
  const alturaPe = esp.lanca.alturaPeM.valor
  const recuo = esp.lanca.recuoPeM.valor
  const xPe = -recuo
  const L = cenario.lanca.comprimentoM
  const theta = cenario.lanca.anguloGraus
  const thetaRad = (theta * Math.PI) / 180
  const usaJIB = cenario.jib.ativo
  const comprimentoMin = esp.lanca.comprimentoMinM.valor
  const comprimentoMax = esp.lanca.comprimentoMaxM.valor
  const comprimentosReais = comprimentosReaisDaTabela(ctx)
  const marcas = !usaJIB && comprimentosReais.length > 0 ? comprimentosReais : undefined

  const [arrasto, setArrasto] = useState<Arrasto | null>(null)
  // Ref (não só o prop `enabled`) para desligar o OrbitControls de forma
  // síncrona no pointerdown — ver Épico 9, bug 3.
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const superestruturaRef = useRef<Group>(null)

  const iniciar = (novo: Arrasto, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    capturarPonteiro(e)
    if (controlsRef.current) controlsRef.current.enabled = false
    setArrasto(novo)
  }
  const soltar = () => {
    if (controlsRef.current) controlsRef.current.enabled = true
    cursor('auto')
    setArrasto(null)
  }

  /** Comprimento a partir de um ponto local (relativo ao centro de giro), com o ímã das marcas reais. */
  const comprimentoDoPonto = (x: number, y: number) => {
    const bruto = projetarComprimento(x - xPe, y - alturaPe, theta, comprimentoMin, comprimentoMax)
    return marcas ? aplicarSnapComprimento(bruto, marcas) : bruto
  }
  const pontaLanca = { x: xPe + L * Math.cos(thetaRad), y: alturaPe + L * Math.sin(thetaRad) }

  const aoMoverVertical = (x: number, y: number) => {
    if (!arrasto) return
    if (arrasto.tipo === 'angulo') definirAnguloGraus(anguloDoPonto(x - xPe, y - alturaPe))
    else if (arrasto.tipo === 'comprimento') definirComprimentoLancaM(comprimentoDoPonto(x, y))
    else if (arrasto.tipo === 'raio') definirRaioM(x)
    else if (arrasto.tipo === 'jibAngulo') {
      const phi = (Math.atan2(y - pontaLanca.y, x - pontaLanca.x) * 180) / Math.PI
      definirJIB({ anguloGraus: theta - phi })
    }
  }

  // Campos embutidos na cena (Task 9.2) — hooks rodam sempre (regra dos hooks).
  const campoComprimento = useCampoNumericoSincronizado(L, usaJIB ? semAcao : definirComprimentoLancaM)
  const campoRaio = useCampoNumericoSincronizado(avaliacao.geometria.raioM, definirRaioM)

  // Posições de <Html> com input memoizadas por VALOR (Task 9.2: array novo a
  // cada render remonta o input e perde o foco).
  const posicaoCampoComprimento = useMemo<[number, number, number]>(() => [L / 2, -1.6, 0], [L])
  const posicaoCampoPe = useMemo<[number, number, number]>(() => [xPe, alturaPe * 0.35, 0.9], [xPe, alturaPe])
  const posicaoRotuloJIB = useMemo<[number, number, number]>(
    () => [cenario.jib.comprimentoM / 2, 0.9, 0],
    [cenario.jib.comprimentoM],
  )

  // Objeto de config da câmera memoizado (Épico 9, bug 2).
  const cameraConfig = useMemo(() => ({ position: CAMERA_POSICAO, fov: CAMERA_FOV }), [])

  const ponta = calcularPonta(
    { alturaPeDaLancaM: alturaPe, recuoPeDaLancaM: recuo },
    {
      comprimentoLancaM: L,
      anguloLancaGraus: theta,
      jib: usaJIB ? { comprimentoM: cenario.jib.comprimentoM, anguloGraus: cenario.jib.anguloGraus } : null,
    },
  )
  const extremos = extremosDoCaminhao(esp)
  const raioTraseiro = esp.superestrutura.raioTraseiroM.valor
  const enquadramento = {
    xMin: Math.min(extremos.xMin, -raioTraseiro) - 1,
    xMax: Math.max(extremos.xMax, ponta.raioM) + 4,
    yMax: Math.max(ponta.alturaM, esp.caminhao.cabineAlturaM.valor) + 2,
  }
  const fontes = contarFontes(esp)
  const raioAnel = raioTraseiro + 1.4
  const larguraSuper = esp.superestrutura.larguraM.valor
  const baseSuper = esp.superestrutura.alturaBaseM.valor
  const topoSuper = Math.max(esp.superestrutura.alturaTopoM.valor, baseSuper + 0.6)
  const frenteSuper = Math.max(0.6, recuo * 0.4)
  const alturaChassi = esp.caminhao.alturaChassiM.valor
  const arrastoVertical = arrasto !== null && ['angulo', 'comprimento', 'raio', 'jibAngulo'].includes(arrasto.tipo)

  return (
    <div className="cena-3d">
      {/* frameloop "demand" (Épico 11): só renderiza quando algo muda. */}
      <Canvas
        frameloop="demand"
        shadows={false}
        camera={cameraConfig}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[15, 22, 12]} intensity={0.9} />

        <Chao />
        <Caminhao esp={esp} />
        <Sapatas
          esp={esp}
          extensoes={cenario.sapatas}
          arrastando={arrasto?.tipo === 'sapata' ? arrasto.posicao : null}
          aoIniciarArrasto={(posicao, e) => iniciar({ tipo: 'sapata', posicao }, e)}
        />
        <AnelDeGiro
          raioM={raioAnel}
          giroGraus={avaliacao.giro.normalizadoGraus}
          limiteMecanicoGraus={esp.giro.limiteMecanicoGraus}
          criterio={ctx.criterioDeGiro}
          ativo={arrasto?.tipo === 'giro'}
          aoIniciarArrasto={(e) => iniciar({ tipo: 'giro' }, e)}
        />

        {/* ---------------- superestrutura (gira com o giro) ---------------- */}
        <group ref={superestruturaRef} rotation={[0, rotacaoDoGiro(cenario.giroGraus), 0]}>
          {/* coroa de giro */}
          <mesh position={[0, (alturaChassi + baseSuper) / 2, 0]}>
            <cylinderGeometry args={[1.1, 1.25, Math.max(0.2, baseSuper - alturaChassi), 28]} />
            <meshStandardMaterial color="#2f3a45" />
          </mesh>
          {/* casa de máquinas: da traseira (raio traseiro da ficha) até um pouco à frente do centro */}
          <mesh position={[(-raioTraseiro + frenteSuper) / 2, (baseSuper + topoSuper) / 2, 0]}>
            <boxGeometry args={[raioTraseiro + frenteSuper, topoSuper - baseSuper, larguraSuper]} />
            <meshStandardMaterial color={COR_SUPERESTRUTURA} />
          </mesh>
          {/* suporte do pé da lança */}
          <mesh position={[xPe, (baseSuper + alturaPe) / 2 + 0.2, 0]}>
            <boxGeometry args={[0.7, Math.max(0.4, alturaPe - baseSuper + 0.4), 1.1]} />
            <meshStandardMaterial color={COR_LANCA} />
          </mesh>

          <group position={[xPe, alturaPe, 0]} rotation={[0, 0, thetaRad]}>
            <SegmentoLanca
              comprimentoM={L}
              corEstrutura={COR_LANCA}
              corGancho={corDestaque}
              arrastavel={!usaJIB}
              arrastando={arrasto?.tipo === 'angulo'}
              onPointerDownGancho={(e) => iniciar({ tipo: 'angulo' }, e)}
              onPointerUpGancho={(e) => {
                e.stopPropagation()
                soltar()
              }}
              estruturaArrastavel={!usaJIB}
              estruturaEmDestaque={arrasto?.tipo === 'comprimento'}
              marcasComprimentoM={marcas}
              onPointerDownEstrutura={(e) => {
                iniciar({ tipo: 'comprimento' }, e)
                // Clique direto já confirma o valor (Task 9.2), com o ímã das marcas.
                const local = superestruturaRef.current!.worldToLocal(new Vector3().copy(e.point))
                definirComprimentoLancaM(comprimentoDoPonto(local.x, local.y))
              }}
              onPointerUpEstrutura={(e) => {
                e.stopPropagation()
                soltar()
              }}
            />

            {usaJIB && (
              // O ângulo do JIB é um offset PARA BAIXO em relação à lança principal.
              <group position={[L, 0, 0]} rotation={[0, 0, -(cenario.jib.anguloGraus * Math.PI) / 180]}>
                <SegmentoLanca
                  comprimentoM={cenario.jib.comprimentoM}
                  corEstrutura={COR_JIB}
                  corGancho={corDestaque}
                  arrastavel
                  arrastando={arrasto?.tipo === 'raio'}
                  onPointerDownGancho={(e) => iniciar({ tipo: 'raio' }, e)}
                  onPointerUpGancho={(e) => {
                    e.stopPropagation()
                    soltar()
                  }}
                  espessura={0.55}
                  estruturaArrastavel
                  estruturaEmDestaque={arrasto?.tipo === 'jibAngulo'}
                  onPointerDownEstrutura={(e) => iniciar({ tipo: 'jibAngulo' }, e)}
                  onPointerUpEstrutura={(e) => {
                    e.stopPropagation()
                    soltar()
                  }}
                />
                {/* comprimentos do JIB: seções montadas, só os valores da tabela — clique para trocar */}
                {esp.jib.comprimentosM.map((c) => (
                  <mesh
                    key={c}
                    position={[c, 0.75, 0]}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      definirJIB({ comprimentoM: c })
                    }}
                    onPointerOver={() => cursor('pointer')}
                    onPointerOut={() => cursor('auto')}
                  >
                    <sphereGeometry args={[0.32, 14, 14]} />
                    <meshStandardMaterial
                      color={Math.abs(c - cenario.jib.comprimentoM) < 1e-6 ? '#1f5fbf' : '#ffffff'}
                      transparent
                      opacity={0.85}
                    />
                  </mesh>
                ))}
                <Html style={SEM_PONTEIRO} position={posicaoRotuloJIB} center distanceFactor={22}>
                  <div className="cena-3d__rotulo cena-3d__rotulo--jib">
                    JIB {cenario.jib.comprimentoM.toFixed(1)} m · {cenario.jib.anguloGraus.toFixed(1)}°
                  </div>
                </Html>
              </group>
            )}

            {!usaJIB ? (
              <Html position={posicaoCampoComprimento} center distanceFactor={22}>
                <label className="cena-3d__campo">
                  Comprimento (m)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={campoComprimento.texto}
                    onFocus={campoComprimento.onFocus}
                    onBlur={campoComprimento.onBlur}
                    onChange={campoComprimento.onChange}
                  />
                </label>
              </Html>
            ) : (
              <Html style={SEM_PONTEIRO} position={posicaoCampoComprimento} center distanceFactor={22}>
                <div className="cena-3d__rotulo">lança principal {L.toFixed(2)} m (exigida pela tabela de JIB)</div>
              </Html>
            )}
          </group>

          {/* campo do raio de trabalho, no pé da lança (não gira com o ângulo) */}
          <Html position={posicaoCampoPe} center distanceFactor={22}>
            <label className="cena-3d__campo">
              Raio de trabalho (m)
              <input
                type="text"
                inputMode="decimal"
                value={campoRaio.texto}
                onFocus={campoRaio.onFocus}
                onBlur={campoRaio.onBlur}
                onChange={campoRaio.onChange}
              />
            </label>
          </Html>

          <Cotas
            recuoPeM={recuo}
            alturaPeM={alturaPe}
            raioM={avaliacao.geometria.raioM}
            alturaPontaM={avaliacao.geometria.alturaPontaM}
            anguloGraus={theta}
            alturaIcamentoM={cenario.alturaIcamentoNecessariaM}
          />
          <CargaSuspensa
            raioM={avaliacao.geometria.raioM}
            alturaPontaM={avaliacao.geometria.alturaPontaM}
            cenario={cenario}
            corStatus={corDestaque}
          />

          {arrastoVertical && <PlanoDeArrastoVertical aoMover={aoMoverVertical} aoSoltar={soltar} />}
        </group>

        {arrasto?.tipo === 'giro' && (
          <PlanoDeArrastoHorizontal y={0.06} aoMover={(x, z) => definirGiroGraus(giroDoPonto(x, z))} aoSoltar={soltar} />
        )}
        {arrasto?.tipo === 'sapata' && (
          <PlanoDeArrastoHorizontal
            y={0.4}
            aoMover={(_x, z) => definirSapata(arrasto.posicao, Math.abs(z))}
            aoSoltar={soltar}
          />
        )}

        <OrbitControls
          makeDefault
          ref={controlsRef}
          enabled={!arrasto}
          target={CAMERA_ALVO}
          minDistance={8}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2 - 0.03}
          enableDamping
        />
        <ControladorDeVista vista={vista} enquadramento={enquadramento} />

        {/* Épico 12 — cubo de orientação (clicar numa face leva a câmera àquela vista). */}
        <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
          <GizmoViewcube
            color="#f4f6f8"
            hoverColor="#cfe0f7"
            textColor="#22303c"
            strokeColor="#8b97a5"
            faces={['Frontal', 'Trás', 'Topo', 'Base', 'Lateral', 'Oposta']}
          />
        </GizmoHelper>
      </Canvas>
      <p className="cena-3d__dica">
        Arraste: gancho → ângulo{usaJIB ? ' (com JIB: raio)' : ''} · lança → comprimento
        {usaJIB ? ' · barra do JIB → ângulo do JIB · esferas → comprimento do JIB' : ''} · anel no chão → giro · pé da
        sapata → extensão · fora do modelo → câmera.{' '}
        <span
          className="cena-3d__fontes"
          title="Medidas do desenho que não constam nas fichas ficam marcadas como aproximadas em data/especificacoes"
        >
          Desenho: {fontes.ficha} medidas da ficha, {fontes.aproximadas} aproximadas (≈)
        </span>
      </p>
    </div>
  )
}
