import { useState } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { Grid, Html, Line, OrbitControls } from '@react-three/drei'
import { anguloDoPonto, pontaDaLanca, projetarComprimento } from './geometriaCanvas'

/**
 * Cena 3D do guindaste (redesenho do layout — pedido do usuário: "trazer uma
 * terceira dimensão", em vez do canvas 2D do POC/Épico 3 original).
 *
 * Mantém a mesma física do canvas 2D anterior (o gancho se move num único
 * PLANO VERTICAL fixo, em z=0 — não há simulação de giro/azimute, decisão já
 * tomada no RF08): só o ângulo de elevação é arrastável, o comprimento de
 * lança continua um controle discreto à parte (Task 3.4). O que muda é a
 * apresentação: câmera em perspectiva com OrbitControls (o usuário pode
 * girar/aproximar a visão) e um chão com grid para dar noção real de
 * profundidade e escala.
 *
 * Convenção de eixos: X = alcance horizontal (raio), Y = altura, Z = usado
 * só para dar volume aos sólidos e para o chão — o plano de operação da
 * lança em si é sempre Z=0, exatamente como no motor de cálculo
 * (engine/geometriaLanca.ts).
 */

// Task 8.1 — paleta ajustada ao painel de controle industrial escuro: chão
// mais escuro (piso de oficina/pátio), estrutura em aço mais clara para
// continuar legível contra o fundo escuro, JIB na mesma cor de acento
// (âmbar) usada no resto da interface.
const COR_LANCA = '#4a5761'
const COR_BASE = '#2a323a'
const COR_JIB = '#f2a71b'
const COR_CHAO = '#181d21'

/**
 * Câmera/alvo fixos, generosos o bastante para enquadrar tanto a lança
 * normal (até ~32m) quanto a configuração mais estendida com JIB (até
 * ~52m) sem precisar recalcular a cada mudança — o usuário pode sempre
 * aproximar/afastar com o OrbitControls se quiser um enquadramento mais
 * próximo da configuração atual.
 *
 * Exportados (não só locais ao componente) para os testes e2e projetarem
 * pontos 3D exatos em pixels de tela, sem duplicar esses números.
 */
export const CAMERA_POSICAO: [number, number, number] = [40, 32, 40]
export const CAMERA_ALVO: [number, number, number] = [14, 14, 0]
export const CAMERA_FOV = 42
/** Deslocamento local do gancho em relação à ponta da lança (antes da rotação) — ver SegmentoLanca. */
export const GANCHO_OFFSET_Y = -1.1

export interface SegmentoJIB {
  comprimentoJibM: number
  anguloJibGraus: number
}

interface CenaGuindaste3DProps {
  /** Altura do pé da lança acima do solo (RF11) — de onde a lança "nasce". */
  alturaPeDaLancaM: number
  comprimentoLancaM: number
  anguloGraus: number
  raioM: number
  /** Presente → gancho arrastável (muda o ângulo, Task 3.1/UC02); ausente → cena só ilustrativa (modo JIB). */
  onAnguloChange?: (anguloGraus: number) => void
  /**
   * Task 8.2 — presente → a própria estrutura da lança fica arrastável para
   * estender/recolher o comprimento (além do seletor discreto da Task 3.4).
   * Só faz sentido para a lança principal do MD-300L sem JIB — o modo JIB
   * trava a lança principal no máximo (a tabela de JIB não tem esse eixo) e
   * o TM-130 não tem comprimento real na tabela (só zona×ângulo).
   */
  onComprimentoChange?: (comprimentoLancaM: number) => void
  /** Limites reais do comprimento (Task 8.2) — obrigatórios junto com `onComprimentoChange`. */
  comprimentoMinM?: number
  comprimentoMaxM?: number
  /** Cor do gancho/lança conforme o status do resultado (verde/âmbar/vermelho — Task 4.1). */
  corDestaque?: string
  /** Quando presente, desenha a lança JIB (RF12) presa na ponta da lança principal, com ângulo próprio absoluto. */
  jib?: SegmentoJIB
}

function Base({ alturaM }: { alturaM: number }) {
  return (
    <group>
      <mesh position={[0, alturaM / 2, 0]}>
        <boxGeometry args={[3.4, alturaM, 3.4]} />
        <meshStandardMaterial color={COR_BASE} />
      </mesh>
      <mesh position={[-0.5, alturaM + 0.35, 0]}>
        <boxGeometry args={[1.6, 0.7, 2]} />
        <meshStandardMaterial color={COR_LANCA} />
      </mesh>
    </group>
  )
}

/** Um segmento de lança (principal ou JIB): a barra + o gancho na ponta, opcionalmente arrastável. */
function SegmentoLanca({
  comprimentoM,
  corEstrutura,
  corGancho,
  arrastavel,
  arrastando,
  onPointerDownGancho,
  onPointerUpGancho,
  espessura = 0.9,
  estruturaArrastavel,
  estruturaEmDestaque,
  onPointerDownEstrutura,
  onPointerUpEstrutura,
}: {
  comprimentoM: number
  corEstrutura: string
  corGancho: string
  arrastavel: boolean
  arrastando?: boolean
  onPointerDownGancho?: (e: ThreeEvent<PointerEvent>) => void
  onPointerUpGancho?: (e: ThreeEvent<PointerEvent>) => void
  espessura?: number
  /** Task 8.2 — a barra em si (não só o gancho) pode ser arrastada para mudar o comprimento. */
  estruturaArrastavel?: boolean
  estruturaEmDestaque?: boolean
  onPointerDownEstrutura?: (e: ThreeEvent<PointerEvent>) => void
  onPointerUpEstrutura?: (e: ThreeEvent<PointerEvent>) => void
}) {
  return (
    <group>
      <mesh position={[comprimentoM / 2, 0, 0]}>
        <boxGeometry args={[comprimentoM, espessura, espessura]} />
        <meshStandardMaterial
          color={corEstrutura}
          emissive={estruturaEmDestaque ? '#f2a71b' : '#000000'}
          emissiveIntensity={estruturaEmDestaque ? 0.35 : 0}
        />
      </mesh>

      {estruturaArrastavel && (
        // Área de clique bem maior que a barra visível (Task 8.2): pegar
        // exatamente a barra fina, de qualquer ângulo de câmera, é pouco
        // confiável (tanto para o usuário de verdade quanto para o teste
        // e2e — foi essa imprecisão que causava flakiness no drag). Uma
        // "alça" invisível e mais grossa em volta da barra resolve os dois
        // — mesma técnica do PlanoDeArrasto (material transparente,
        // opacity 0, sem escrever no depth buffer, mas continua clicável).
        <mesh
          position={[comprimentoM / 2, 0, 0]}
          onPointerDown={onPointerDownEstrutura}
          onPointerUp={onPointerUpEstrutura}
          onPointerOver={() => (document.body.style.cursor = 'ew-resize')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <boxGeometry args={[comprimentoM, Math.max(espessura * 3, 2.2), Math.max(espessura * 3, 2.2)]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* cabo até o gancho */}
      <Line
        points={[
          [comprimentoM, 0, 0],
          [comprimentoM, -0.9, 0],
        ]}
        color="#8a8a8a"
        lineWidth={1.5}
      />

      <mesh
        position={[comprimentoM, -1.1, 0]}
        onPointerDown={arrastavel ? onPointerDownGancho : undefined}
        onPointerUp={arrastavel ? onPointerUpGancho : undefined}
      >
        <sphereGeometry args={[0.55, 18, 18]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={corGancho}
          emissiveIntensity={arrastando ? 0.6 : 0.35}
        />
      </mesh>
    </group>
  )
}

/**
 * Plano invisível (só para raycasting) que capta o arrasto no plano vertical
 * de operação da lança (RF08 — sem giro/azimute) e devolve a posição do
 * ponteiro relativa ao pivot (pé da lança), em metros. Reaproveitado tanto
 * para o arrasto do ângulo (Task 3.1) quanto do comprimento (Task 8.2) —
 * cada chamador decide o que fazer com (dx, dy).
 */
function PlanoDeArrasto({
  pivotX,
  pivotY,
  onMoveRelativo,
  onSoltar,
}: {
  pivotX: number
  pivotY: number
  onMoveRelativo: (dx: number, dy: number) => void
  onSoltar: () => void
}) {
  return (
    <mesh
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onMoveRelativo(e.point.x - pivotX, e.point.y - pivotY)
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onSoltar()
      }}
      onPointerLeave={onSoltar}
    >
      <planeGeometry args={[160, 100]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function Chao() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={COR_CHAO} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[100, 100]}
        cellSize={2}
        cellThickness={0.8}
        cellColor="#3a4249"
        sectionSize={10}
        sectionThickness={1.6}
        sectionColor="#f2a71b"
        fadeDistance={70}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </group>
  )
}

export function CenaGuindaste3D({
  alturaPeDaLancaM,
  comprimentoLancaM,
  anguloGraus,
  raioM,
  onAnguloChange,
  onComprimentoChange,
  comprimentoMinM,
  comprimentoMaxM,
  corDestaque = '#f2a71b',
  jib,
}: CenaGuindaste3DProps) {
  const [arrastando, setArrastando] = useState(false)
  const [arrastandoComprimento, setArrastandoComprimento] = useState(false)
  const anguloRad = (anguloGraus * Math.PI) / 180
  const arrastavel = Boolean(onAnguloChange) && !jib
  const estruturaArrastavel =
    Boolean(onComprimentoChange) && comprimentoMinM !== undefined && comprimentoMaxM !== undefined && !jib
  const ponta = pontaDaLanca(comprimentoLancaM, anguloGraus)
  const alturaGancho = alturaPeDaLancaM + ponta.y + GANCHO_OFFSET_Y

  return (
    <div className="cena-3d">
      <Canvas
        shadows={false}
        camera={{ position: CAMERA_POSICAO, fov: CAMERA_FOV }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[15, 22, 12]} intensity={0.9} />

        <Chao />
        <Base alturaM={alturaPeDaLancaM} />

        <group position={[0, alturaPeDaLancaM, 0]} rotation={[0, 0, anguloRad]}>
          <SegmentoLanca
            comprimentoM={comprimentoLancaM}
            corEstrutura={COR_LANCA}
            corGancho={corDestaque}
            arrastavel={arrastavel}
            arrastando={arrastando}
            onPointerDownGancho={(e) => {
              e.stopPropagation()
              ;(e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(
                e.pointerId,
              )
              setArrastando(true)
            }}
            onPointerUpGancho={(e) => {
              e.stopPropagation()
              setArrastando(false)
            }}
            estruturaArrastavel={estruturaArrastavel}
            estruturaEmDestaque={arrastandoComprimento}
            onPointerDownEstrutura={(e) => {
              e.stopPropagation()
              ;(e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(
                e.pointerId,
              )
              setArrastandoComprimento(true)
            }}
            onPointerUpEstrutura={(e) => {
              e.stopPropagation()
              setArrastandoComprimento(false)
            }}
          />

          {jib && (
            <group position={[comprimentoLancaM, 0, 0]} rotation={[0, 0, (jib.anguloJibGraus * Math.PI) / 180 - anguloRad]}>
              <SegmentoLanca
                comprimentoM={jib.comprimentoJibM}
                corEstrutura={COR_JIB}
                corGancho={COR_JIB}
                arrastavel={false}
                espessura={0.55}
              />
              <Html position={[jib.comprimentoJibM / 2, 0.9, 0]} center distanceFactor={22}>
                <div className="cena-3d__rotulo cena-3d__rotulo--jib">
                  JIB {jib.comprimentoJibM.toFixed(1)} m · {jib.anguloJibGraus}°
                </div>
              </Html>
            </group>
          )}

          {!jib && (
            <Html position={[comprimentoLancaM / 2, -1.6, 0]} center distanceFactor={22}>
              <div className="cena-3d__rotulo">
                lança {comprimentoLancaM.toFixed(2)} m · ângulo {anguloGraus.toFixed(0)}°
              </div>
            </Html>
          )}
        </group>

        {jib && (
          <Html position={[0, alturaPeDaLancaM + 0.9, 0]} center distanceFactor={22}>
            <div className="cena-3d__rotulo">lança principal {comprimentoLancaM.toFixed(2)} m (extensão máxima)</div>
          </Html>
        )}

        {/* linha guia do raio no chão + linha guia vertical até o gancho */}
        <Line
          points={[
            [0, 0.02, 0],
            [ponta.x, 0.02, 0],
          ]}
          color="#9a9a8f"
          dashed
          dashSize={0.4}
          gapSize={0.3}
        />
        <Line
          points={[
            [ponta.x, 0.02, 0],
            [ponta.x, alturaGancho, 0],
          ]}
          color="#9a9a8f"
          dashed
          dashSize={0.4}
          gapSize={0.3}
        />
        <Html position={[ponta.x / 2, 0.02, 0]} center distanceFactor={22}>
          <div className="cena-3d__rotulo cena-3d__rotulo--raio">raio {raioM.toFixed(1)} m</div>
        </Html>

        {arrastando && (
          <PlanoDeArrasto
            pivotX={0}
            pivotY={alturaPeDaLancaM}
            onMoveRelativo={(dx, dy) => onAnguloChange?.(anguloDoPonto(dx, dy))}
            onSoltar={() => setArrastando(false)}
          />
        )}

        {arrastandoComprimento && comprimentoMinM !== undefined && comprimentoMaxM !== undefined && (
          <PlanoDeArrasto
            pivotX={0}
            pivotY={alturaPeDaLancaM}
            onMoveRelativo={(dx, dy) =>
              onComprimentoChange?.(projetarComprimento(dx, dy, anguloGraus, comprimentoMinM, comprimentoMaxM))
            }
            onSoltar={() => setArrastandoComprimento(false)}
          />
        )}

        <OrbitControls
          enabled={!arrastando && !arrastandoComprimento}
          target={CAMERA_ALVO}
          minDistance={12}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2 - 0.03}
          enableDamping
        />
      </Canvas>
      <p className="cena-3d__dica">
        {estruturaArrastavel
          ? 'Arraste o gancho para o ângulo · arraste a lança para o comprimento · arraste fora do modelo para girar a câmera.'
          : arrastavel
            ? 'Arraste o gancho para ajustar o ângulo da lança · arraste fora do gancho para girar a câmera.'
            : 'Visualização ilustrativa — arraste fora do modelo para girar a câmera.'}
      </p>
    </div>
  )
}
