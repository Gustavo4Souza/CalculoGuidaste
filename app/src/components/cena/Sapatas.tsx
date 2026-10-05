import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { POSICOES_SAPATA, type PosicaoSapata } from '../../types/cenario'
import type { EspecificacaoGuindaste } from '../../types/especificacao'
import { ladoZDaSapata, posicaoDaSapata } from './geometriaCena'
import { COR_DESTAQUE_ARRASTO, COR_SAPATA, cursor, SEM_PONTEIRO } from './primitivas'

const ALTURA_VIGA_M = 0.36 // seção da viga da sapata do TM-130 (ficha p.2, 361 mm) — usada para os dois só no desenho
const PE_M = 0.6

/**
 * As 4 sapatas (Épico 13, RF16): viga saindo do chassi até a extensão
 * configurada e o pé de apoio no chão. Cada pé é arrastável (muda só a
 * extensão daquela sapata). Extensão diferente da máxima → o motor responde
 * "sem dado do fabricante" (RF17); o pé fica laranja para chamar atenção.
 */
export function Sapatas({
  esp,
  extensoes,
  arrastando,
  aoIniciarArrasto,
}: {
  esp: EspecificacaoGuindaste
  extensoes: Record<PosicaoSapata, number>
  arrastando: PosicaoSapata | null
  aoIniciarArrasto: (posicao: PosicaoSapata, e: ThreeEvent<PointerEvent>) => void
}) {
  const meiaLargura = esp.caminhao.larguraM.valor / 2
  const yViga = esp.caminhao.alturaChassiM.valor - 0.25

  return (
    <group>
      {POSICOES_SAPATA.map((posicao) => {
        const extensao = extensoes[posicao]
        const [x, , z] = posicaoDaSapata(esp, posicao, extensao)
        const lado = ladoZDaSapata(esp, posicao)
        const par = posicao.startsWith('dianteira') ? esp.sapatas.dianteiras : esp.sapatas.traseiras
        const naMaxima = Math.abs(extensao - par.estendidaM.valor) < 1e-3
        const comprimentoViga = Math.max(0.05, extensao - meiaLargura)
        const ativa = arrastando === posicao
        const corPe = ativa ? COR_DESTAQUE_ARRASTO : naMaxima ? COR_SAPATA : '#d9822b'

        return (
          <group key={posicao}>
            {/* viga horizontal, do chassi até a sapata */}
            <mesh position={[x, yViga, lado * (meiaLargura + comprimentoViga / 2)]}>
              <boxGeometry args={[0.25, ALTURA_VIGA_M * 0.6, comprimentoViga]} />
              <meshStandardMaterial color={COR_SAPATA} />
            </mesh>
            {/* cilindro vertical até o chão */}
            <mesh position={[x, yViga / 2, z]}>
              <boxGeometry args={[0.18, yViga, 0.18]} />
              <meshStandardMaterial color={COR_SAPATA} />
            </mesh>
            {/* pé de apoio */}
            <mesh position={[x, 0.06, z]}>
              <boxGeometry args={[PE_M, 0.12, PE_M]} />
              <meshStandardMaterial color={corPe} />
            </mesh>
            {/* alça de arrasto invisível, maior que o pé (mesma técnica da Task 8.2) */}
            <mesh
              position={[x, 0.4, z]}
              onPointerDown={(e) => aoIniciarArrasto(posicao, e)}
              onPointerOver={() => cursor('ns-resize')}
              onPointerOut={() => cursor('auto')}
            >
              <boxGeometry args={[1.2, 0.9, 1.2]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {(ativa || !naMaxima) && (
              <Html style={SEM_PONTEIRO} position={[x, 0.9, z]} center distanceFactor={22} zIndexRange={[20, 0]}>
                <div className={`cena-3d__cota ${naMaxima ? '' : 'cena-3d__cota--alerta'}`}>
                  {extensao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}
