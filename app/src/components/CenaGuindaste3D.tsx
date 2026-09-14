import { useMemo, useRef, useState } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { Grid, Html, Line, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { anguloDoPonto, aplicarSnapComprimento, pontaDaLanca, projetarComprimento } from './geometriaCanvas'
import { useCampoNumericoSincronizado } from './useCampoNumericoSincronizado'

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

// Task 8.1 — chão do piso de oficina/pátio, escuro.
const COR_CHAO = '#181d21'

// Task 9.1 — paleta técnica em linha (amarelo/preto/cinza), no estilo de
// guindaste real (referências enviadas pelo Gustavo), mantendo os acentos
// âmbar de segurança e a legibilidade do tema HUD escuro do Épico 8.
const COR_LANCA = '#f2c11d' // amarelo técnico — lança principal
const COR_JIB = '#f2a71b' // âmbar de acento — JIB, para se distinguir da lança principal
const COR_BASE = '#23282d' // cinza-escuro/preto — torre giratória
const COR_CHASSI = '#3a4149' // cinza médio — chassi do caminhão
const COR_CABINE = '#15181b' // quase preto — cabine
const COR_RODA = '#0c0e10' // preto — pneus
const COR_FAIXA = '#111417' // preto — faixas de risca (chevron) do moitão/lança

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
  /**
   * Task 9.2 — os 7 comprimentos reais da tabela do MD-300L: desenhados como
   * marcas de encaixe ao longo da lança, com "ímã" ao arrastar perto de uma
   * delas e pulo exato ao clicar direto nela (ver `aplicarSnapComprimento`).
   */
  comprimentosReaisM?: ReadonlyArray<number>
  /**
   * Task 9.2 — raio de trabalho atual e seu setter: presentes só na variante
   * comprimento+raio+quadrante (MD-300L sem JIB), para desenhar o campo
   * "raio de trabalho" embutido perto do pé da lança (não gira com o
   * ângulo — raio é sempre uma medida horizontal, ao nível do solo).
   */
  raioAtualM?: number
  onRaioChange?: (raioM: number) => void
  /** Cor do gancho/lança conforme o status do resultado (verde/âmbar/vermelho — Task 4.1). */
  corDestaque?: string
  /** Quando presente, desenha a lança JIB (RF12) presa na ponta da lança principal, com ângulo próprio absoluto. */
  jib?: SegmentoJIB
}

/** Ruído mínimo para não quebrar a regra dos hooks quando o setter não é passado (ex.: modo JIB/TM-130). */
function semAcao() {
  /* no-op */
}


/** Par de rodas (eixo ao longo de Z) numa posição X do chassi. */
function ParDeRodas({ x, chassiLarguraM, alturaEixoM }: { x: number; chassiLarguraM: number; alturaEixoM: number }) {
  const z = chassiLarguraM / 2 + 0.18
  return (
    <group>
      {[z, -z].map((zRoda) => (
        <mesh key={zRoda} position={[x, alturaEixoM, zRoda]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.4, 16]} />
          <meshStandardMaterial color={COR_RODA} />
        </mesh>
      ))}
    </group>
  )
}

/** Uma sapata de apoio (RT-UI, sempre com extensão máxima — CLAUDE.md regra 8) estendida para um dos lados. */
function Sapata({ ladoZ }: { ladoZ: 1 | -1 }) {
  const comprimento = 2.6
  return (
    <group>
      <mesh position={[0, 0.35, (ladoZ * comprimento) / 2 + 1.7]}>
        <boxGeometry args={[0.35, 0.35, comprimento]} />
        <meshStandardMaterial color={COR_CHASSI} />
      </mesh>
      <mesh position={[0, 0.06, ladoZ * (comprimento + 1.7)]}>
        <boxGeometry args={[0.6, 0.12, 0.6]} />
        <meshStandardMaterial color={COR_FAIXA} />
      </mesh>
    </group>
  )
}

/**
 * Task 9.1 — caminhão-guindaste: chassi + cabine + rodas + sapatas de apoio,
 * na paleta técnica cinza/preto, com a torre giratória (amarela/escura) por
 * cima. Fica sempre "atrás" da lança (lado -X) — a lança só opera no
 * quadrante +X, então o caminhão nunca interfere no raycasting/arrasto dela.
 */
function Caminhao({ alturaTorreM }: { alturaTorreM: number }) {
  const chassiAltura = 0.9
  const chassiLargura = 2.3
  const chassiComprimento = 6.6
  const chassiCentroX = -(chassiComprimento / 2 + 1.6)
  const cabineComprimento = 1.7
  const cabineX = chassiCentroX - chassiComprimento / 2 + cabineComprimento / 2

  return (
    <group>
      {/* torre giratória — mantém a física de arrasto (pivot em X=0,Y=alturaTorreM,Z=0) */}
      <mesh position={[0, alturaTorreM / 2, 0]}>
        <boxGeometry args={[3.4, alturaTorreM, 3.4]} />
        <meshStandardMaterial color={COR_BASE} />
      </mesh>
      <mesh position={[-0.5, alturaTorreM + 0.35, 0]}>
        <boxGeometry args={[1.6, 0.7, 2]} />
        <meshStandardMaterial color={COR_LANCA} />
      </mesh>

      {/* chassi do caminhão */}
      <mesh position={[chassiCentroX, chassiAltura / 2, 0]}>
        <boxGeometry args={[chassiComprimento, chassiAltura, chassiLargura]} />
        <meshStandardMaterial color={COR_CHASSI} />
      </mesh>

      {/* cabine, na ponta dianteira (mais longe da lança) */}
      <mesh position={[cabineX, chassiAltura + 0.7, 0]}>
        <boxGeometry args={[cabineComprimento, 1.4, 2.0]} />
        <meshStandardMaterial color={COR_CABINE} />
      </mesh>
      {/* para-brisa */}
      <mesh position={[cabineX - cabineComprimento / 2 - 0.02, chassiAltura + 1.05, 0]}>
        <boxGeometry args={[0.05, 0.6, 1.6]} />
        <meshStandardMaterial color="#9fadb6" />
      </mesh>

      {/* 3 eixos de rodas ao longo do chassi */}
      {[0.35, -0.55, -1.9].map((fracao) => (
        <ParDeRodas
          key={fracao}
          x={chassiCentroX + fracao * (chassiComprimento / 2)}
          chassiLarguraM={chassiLargura}
          alturaEixoM={0.55}
        />
      ))}

      {/* sapatas de apoio, sempre com extensão máxima (CLAUDE.md regra 8) */}
      <Sapata ladoZ={1} />
      <Sapata ladoZ={-1} />
    </group>
  )
}

/**
 * Marca de encaixe (Task 9.2) — um dos 7 comprimentos reais da tabela do
 * MD-300L, desenhada como uma faixa atravessando a lança. Puramente visual
 * — sem handler de ponteiro próprio, para não competir no raycasting com a
 * "alça" de arrasto (mais larga, por cima). O clique direto numa marca e o
 * "ímã" ao arrastar perto dela são tratados num único lugar, no handler de
 * clique da própria lança (ver `aoClicarNaLanca` em CenaGuindaste3D).
 */
function MarcaDeEncaixe({ x, espessura, ativa }: { x: number; espessura: number; ativa: boolean }) {
  return (
    <mesh position={[x, 0, 0]}>
      <boxGeometry args={[0.1, espessura * 1.5, espessura * 1.5]} />
      <meshStandardMaterial
        color={ativa ? '#ffffff' : '#111417'}
        emissive={ativa ? '#f2a71b' : '#000000'}
        emissiveIntensity={ativa ? 0.6 : 0}
      />
    </mesh>
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
  marcasComprimentoM,
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
  /** Task 9.2 — os 7 comprimentos reais da tabela, desenhados como marcas de encaixe ao longo da lança. */
  marcasComprimentoM?: ReadonlyArray<number>
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

      {/* faixas de seção (Task 9.1) — sugerem uma lança telescópica em partes, puramente decorativas */}
      {[0.3, 0.62].map((fracao) => (
        <mesh key={fracao} position={[comprimentoM * fracao, 0, 0]}>
          <boxGeometry args={[0.12, espessura * 1.06, espessura * 1.06]} />
          <meshStandardMaterial color={COR_FAIXA} />
        </mesh>
      ))}

      {marcasComprimentoM?.map((valorM) => (
        <MarcaDeEncaixe key={valorM} x={valorM} espessura={espessura} ativa={Math.abs(valorM - comprimentoM) < 0.05} />
      ))}

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

      {/* moitão/gancho — a esfera interativa não muda (raycasting/testes usam a posição exata dela);
          as faixas de risca (chevron) ao redor são só decoração, sem handler próprio. */}
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
      {[0.2, -0.2].map((deltaY) => (
        <mesh key={deltaY} position={[comprimentoM, -1.1 + deltaY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.56, 0.1, 8, 24]} />
          <meshStandardMaterial color={COR_FAIXA} />
        </mesh>
      ))}
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
  comprimentosReaisM,
  raioAtualM,
  onRaioChange,
  corDestaque = '#f2a71b',
  jib,
}: CenaGuindaste3DProps) {
  const [arrastando, setArrastando] = useState(false)
  const [arrastandoComprimento, setArrastandoComprimento] = useState(false)
  // Ref (não só o prop `enabled` reativo) para desligar o OrbitControls na
  // hora: o listener nativo de pointerdown/pointermove dele fica no MESMO
  // <canvas> do R3F, então `e.stopPropagation()` nos handlers do gancho/
  // estrutura (que só vale dentro da árvore de eventos do R3F) não impede o
  // OrbitControls de também começar a orbitar a câmera no mesmo gesto — o
  // prop `enabled` só reflete a mudança de estado no PRÓXIMO render, tarde
  // demais para o pointerdown que já disparou. Mutar `.enabled` direto no
  // objeto, síncrono, corta isso na hora (bug real: a câmera "pulava"
  // sozinha ao arrastar o gancho ou a lança).
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const anguloRad = (anguloGraus * Math.PI) / 180
  const arrastavel = Boolean(onAnguloChange) && !jib
  const estruturaArrastavel =
    Boolean(onComprimentoChange) && comprimentoMinM !== undefined && comprimentoMaxM !== undefined && !jib
  const ponta = pontaDaLanca(comprimentoLancaM, anguloGraus)
  const alturaGancho = alturaPeDaLancaM + ponta.y + GANCHO_OFFSET_Y

  // Task 9.2 — campos de posição embutidos na própria cena 3D (o painel
  // lateral "Posição da lança" foi removido). Os hooks precisam rodar
  // incondicionalmente (regra dos hooks) mesmo quando o campo em questão
  // não é exibido nesta variante (ex.: comprimento no modo TM-130/JIB).
  const campoComprimento = useCampoNumericoSincronizado(comprimentoLancaM, onComprimentoChange ?? semAcao)
  const campoRaio = useCampoNumericoSincronizado(raioAtualM ?? raioM, onRaioChange ?? semAcao)
  const campoAngulo = useCampoNumericoSincronizado(anguloGraus, onAnguloChange ?? semAcao, 1)

  /** Task 9.2 — comprimento "cru" a partir do clique/arrasto, já com o ímã das marcas de encaixe aplicado. */
  const comprimentoComSnap = (dx: number, dy: number): number => {
    const bruto = projetarComprimento(dx, dy, anguloGraus, comprimentoMinM ?? 0, comprimentoMaxM ?? comprimentoLancaM)
    return comprimentosReaisM ? aplicarSnapComprimento(bruto, comprimentosReaisM) : bruto
  }

  // Posições dos <Html> memoizadas por VALOR (não só por referência): um
  // array literal `[x, y, z]` novo a cada render faz o <Html> do drei
  // reancorar o portal a cada render — inofensivo para rótulos estáticos,
  // mas fatal para os campos embutidos (Task 9.2): qualquer tecla digitada
  // gera um re-render, o que remontava o próprio <input> a cada caractere,
  // perdendo o foco e o texto digitado (mesma classe de bug da Task 4.2,
  // só que causada pelo <Html>, não pelo valor derivado em si).
  const posicaoCampoComprimento = useMemo<[number, number, number]>(
    () => [comprimentoLancaM / 2, -1.6, 0],
    [comprimentoLancaM],
  )
  const posicaoCampoPeDaLanca = useMemo<[number, number, number]>(
    () => [0, alturaPeDaLancaM * 0.35, 0.9],
    [alturaPeDaLancaM],
  )
  const posicaoLancaPrincipalJIB = useMemo<[number, number, number]>(
    () => [0, alturaPeDaLancaM + 0.9, 0],
    [alturaPeDaLancaM],
  )
  // `jib` (RF12) chega como um objeto literal novo a cada render de quem
  // chama este componente — depender dele por referência recriaria a
  // posição sempre; o que realmente importa para a posição é o comprimento.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const posicaoJIB = useMemo<[number, number, number]>(
    () => [jib ? jib.comprimentoJibM / 2 : 0, 0.9, 0],
    [jib?.comprimentoJibM],
  )
  const posicaoRaioLabel = useMemo<[number, number, number]>(() => [ponta.x / 2, 0.02, 0], [ponta.x])

  // Objeto de config da câmera do <Canvas>, memoizado com dependências fixas
  // (nunca mudam de fato): sem isso, o R3F recebe uma referência NOVA a cada
  // render (qualquer digitação num campo embutido já causa um) e reaplica a
  // posição/fov da câmera "por cima" do que o OrbitControls calculou por
  // conta própria — os dois ficam brigando pela posição da câmera a cada
  // frame, fazendo a câmera "pular"/derivar sozinha mesmo sem o usuário
  // arrastar a órbita (bug real, não só de teste: a câmera visivelmente
  // se movia ao digitar em qualquer campo).
  const cameraConfig = useMemo(() => ({ position: CAMERA_POSICAO, fov: CAMERA_FOV }), [])

  return (
    <div className="cena-3d">
      <Canvas shadows={false} camera={cameraConfig} style={{ width: '100%', height: '100%', touchAction: 'none' }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[15, 22, 12]} intensity={0.9} />

        <Chao />
        <Caminhao alturaTorreM={alturaPeDaLancaM} />

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
              if (controlsRef.current) controlsRef.current.enabled = false
              setArrastando(true)
            }}
            onPointerUpGancho={(e) => {
              e.stopPropagation()
              if (controlsRef.current) controlsRef.current.enabled = true
              setArrastando(false)
            }}
            estruturaArrastavel={estruturaArrastavel}
            estruturaEmDestaque={arrastandoComprimento}
            marcasComprimentoM={estruturaArrastavel ? comprimentosReaisM : undefined}
            onPointerDownEstrutura={(e) => {
              e.stopPropagation()
              ;(e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(
                e.pointerId,
              )
              if (controlsRef.current) controlsRef.current.enabled = false
              // Task 9.2 — clicar direto (sem arrastar) já pula para o valor
              // exato: se o clique cai perto de uma marca de encaixe, o
              // ímã (mesmo usado durante o arrasto) resolve isso sozinho.
              onComprimentoChange?.(comprimentoComSnap(e.point.x, e.point.y - alturaPeDaLancaM))
              setArrastandoComprimento(true)
            }}
            onPointerUpEstrutura={(e) => {
              e.stopPropagation()
              if (controlsRef.current) controlsRef.current.enabled = true
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
              <Html position={posicaoJIB} center distanceFactor={22}>
                <div className="cena-3d__rotulo cena-3d__rotulo--jib">
                  JIB {jib.comprimentoJibM.toFixed(1)} m · {jib.anguloJibGraus}°
                </div>
              </Html>
            </group>
          )}

          {/* Task 9.2 — campo de comprimento embutido no meio da própria lança (gira junto com ela) */}
          {estruturaArrastavel && (
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
          )}

          {/* TM-130 (sem comprimento real) — mostra só o ângulo, no lugar do rótulo antigo */}
          {arrastavel && !estruturaArrastavel && (
            <Html position={posicaoCampoComprimento} center distanceFactor={22}>
              <div className="cena-3d__rotulo">lança {comprimentoLancaM.toFixed(2)} m</div>
            </Html>
          )}
        </group>

        {jib && (
          <Html position={posicaoLancaPrincipalJIB} center distanceFactor={22}>
            <div className="cena-3d__rotulo">lança principal {comprimentoLancaM.toFixed(2)} m (extensão máxima)</div>
          </Html>
        )}

        {/* Task 9.2 — campo embutido no pé da lança: raio de trabalho (MD-300L)
            ou ângulo da lança (TM-130) — não gira com o ângulo, porque raio é
            sempre uma medida horizontal ao nível do solo e o ângulo é lido
            justamente onde a lança nasce. */}
        {estruturaArrastavel && (
          <Html position={posicaoCampoPeDaLanca} center distanceFactor={22}>
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
        )}
        {arrastavel && !estruturaArrastavel && (
          <Html position={posicaoCampoPeDaLanca} center distanceFactor={22}>
            <label className="cena-3d__campo">
              Ângulo da lança (°)
              <input
                type="text"
                inputMode="decimal"
                value={campoAngulo.texto}
                onFocus={campoAngulo.onFocus}
                onBlur={campoAngulo.onBlur}
                onChange={campoAngulo.onChange}
              />
            </label>
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
        {/* Nas variantes com o ângulo arrastável, o raio/ângulo já aparece no campo embutido
            perto do pé da lança acima — este rótulo só sobra para o modo JIB (raio digitado
            manualmente no painel lateral, sem arrasto próprio nesta cena). */}
        {!arrastavel && (
          <Html position={posicaoRaioLabel} center distanceFactor={22}>
            <div className="cena-3d__rotulo cena-3d__rotulo--raio">raio {raioM.toFixed(1)} m</div>
          </Html>
        )}

        {arrastando && (
          <PlanoDeArrasto
            pivotX={0}
            pivotY={alturaPeDaLancaM}
            onMoveRelativo={(dx, dy) => onAnguloChange?.(anguloDoPonto(dx, dy))}
            onSoltar={() => {
              if (controlsRef.current) controlsRef.current.enabled = true
              setArrastando(false)
            }}
          />
        )}

        {arrastandoComprimento && comprimentoMinM !== undefined && comprimentoMaxM !== undefined && (
          <PlanoDeArrasto
            pivotX={0}
            pivotY={alturaPeDaLancaM}
            onMoveRelativo={(dx, dy) => onComprimentoChange?.(comprimentoComSnap(dx, dy))}
            onSoltar={() => {
              if (controlsRef.current) controlsRef.current.enabled = true
              setArrastandoComprimento(false)
            }}
          />
        )}

        <OrbitControls
          ref={controlsRef}
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
          ? 'Arraste o gancho para o ângulo · arraste a lança para o comprimento (as marcas claras são os 7 comprimentos reais da tabela) · arraste fora do modelo para girar a câmera.'
          : arrastavel
            ? 'Arraste o gancho para ajustar o ângulo da lança · arraste fora do gancho para girar a câmera.'
            : 'Visualização ilustrativa — arraste fora do modelo para girar a câmera.'}
      </p>
    </div>
  )
}
