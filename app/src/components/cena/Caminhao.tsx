import type { EspecificacaoGuindaste } from '../../types/especificacao'
import { sinalDaFrente, xNoMundo } from './geometriaCena'
import { COR_CABINE, COR_CHASSI, COR_RODA } from './primitivas'

const RAIO_RODA_M = 0.55

/**
 * Caminhão (parte FIXA do guindaste, Épico 13): chassi, cabine e eixos nas
 * posições da especificação (data/especificacoes/*.json — o que veio da
 * ficha e o que é aproximado está marcado lá, campo a campo). O raio das
 * rodas é só de desenho.
 */
export function Caminhao({ esp }: { esp: EspecificacaoGuindaste }) {
  const c = esp.caminhao
  const frente = sinalDaFrente(esp)
  const xDianteira = xNoMundo(esp, c.dianteiraM.valor)
  const xTraseira = xNoMundo(esp, c.traseiraM.valor)
  const cabine = c.cabineComprimentoM.valor
  const largura = c.larguraM.valor
  const alturaChassi = c.alturaChassiM.valor

  // Chassi: da traseira até o fundo da cabine.
  const xFundoCabine = xDianteira - frente * cabine
  const chassiComprimento = Math.abs(xFundoCabine - xTraseira)
  const chassiCentroX = (xFundoCabine + xTraseira) / 2
  const cabineCentroX = xDianteira - (frente * cabine) / 2
  const alturaLongarina = 0.45

  return (
    <group>
      {/* longarinas/plataforma do chassi */}
      <mesh position={[chassiCentroX, alturaChassi - alturaLongarina / 2, 0]}>
        <boxGeometry args={[chassiComprimento, alturaLongarina, largura]} />
        <meshStandardMaterial color={COR_CHASSI} />
      </mesh>

      {/* cabine do caminhão, na frente */}
      <mesh position={[cabineCentroX, (RAIO_RODA_M + c.cabineAlturaM.valor) / 2, 0]}>
        <boxGeometry args={[cabine, c.cabineAlturaM.valor - RAIO_RODA_M, largura]} />
        <meshStandardMaterial color={COR_CABINE} />
      </mesh>
      {/* para-brisa */}
      <mesh position={[xDianteira + frente * 0.02, c.cabineAlturaM.valor - 0.7, 0]}>
        <boxGeometry args={[0.04, 0.8, largura * 0.85]} />
        <meshStandardMaterial color="#b9d3ea" />
      </mesh>

      {/* eixos com as rodas (bitola da especificação) */}
      {c.eixosM.map((eixo) => (
        <group key={eixo.valor}>
          {[1, -1].map((lado) => (
            <mesh
              key={lado}
              position={[xNoMundo(esp, eixo.valor), RAIO_RODA_M, (lado * c.bitolaM.valor) / 2]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[RAIO_RODA_M, RAIO_RODA_M, 0.45, 18]} />
              <meshStandardMaterial color={COR_RODA} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
