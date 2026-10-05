import type { ThreeEvent } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { COR_FAIXA } from './primitivas'

/**
 * Segmento de lança (principal ou JIB) — movido de CenaGuindaste3D.tsx no
 * Épico 13 sem mudança de comportamento: a barra, as faixas de seção, as
 * marcas de encaixe (Task 9.2), a alça de arrasto do comprimento (Task 8.2)
 * e a esfera de arrasto na cabeça da lança (Task 3.1). A esfera fica no
 * ponto local (comprimento, GANCHO_OFFSET_Y) — os testes e2e clicam
 * exatamente nela.
 */

/**
 * Marca de encaixe (Task 9.2) — um dos 7 comprimentos reais da tabela do
 * MD-300L, desenhada como uma faixa atravessando a lança. Puramente visual
 * — sem handler de ponteiro próprio, para não competir no raycasting com a
 * "alça" de arrasto (mais larga, por cima). O clique direto numa marca e o
 * "ímã" ao arrastar perto dela são tratados num único lugar, no handler de
 * clique da própria lança (ver `aoClicarNaLanca` em CenaGuindaste3D).
 */
function MarcaDeEncaixe({
  x,
  espessura,
  ativa,
  alemDaPonta,
}: {
  x: number
  espessura: number
  ativa: boolean
  /** Épico 12 — marca de um comprimento ainda não estendido: desenhada clara/translúcida, como guia. */
  alemDaPonta: boolean
}) {
  return (
    <mesh position={[x, 0, 0]}>
      <boxGeometry args={[0.1, espessura * 1.5, espessura * 1.5]} />
      <meshStandardMaterial
        color={ativa ? '#ffffff' : alemDaPonta ? '#8b97a5' : '#111417'}
        emissive={ativa ? '#1f5fbf' : '#000000'}
        emissiveIntensity={ativa ? 0.6 : 0}
        transparent={alemDaPonta}
        opacity={alemDaPonta ? 0.35 : 1}
      />
    </mesh>
  )
}

/** Um segmento de lança (principal ou JIB): a barra + o gancho na ponta, opcionalmente arrastável. */
export function SegmentoLanca({
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
        <MarcaDeEncaixe
          key={valorM}
          x={valorM}
          espessura={espessura}
          ativa={Math.abs(valorM - comprimentoM) < 0.05}
          alemDaPonta={valorM > comprimentoM + 0.05}
        />
      ))}
      {/* Épico 12 — guia tracejada da ponta até o maior comprimento real, onde ficam as marcas ainda não estendidas */}
      {marcasComprimentoM && marcasComprimentoM[marcasComprimentoM.length - 1] > comprimentoM + 0.05 && (
        <Line
          points={[
            [comprimentoM, 0, 0],
            [marcasComprimentoM[marcasComprimentoM.length - 1], 0, 0],
          ]}
          color="#8b97a5"
          lineWidth={1}
          dashed
          dashSize={0.4}
          gapSize={0.4}
          transparent
          opacity={0.6}
        />
      )}

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

