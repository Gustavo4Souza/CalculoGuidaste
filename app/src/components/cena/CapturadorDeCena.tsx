import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Color, PerspectiveCamera, SRGBColorSpace, WebGLRenderTarget } from 'three'
import { cameraLateral, cameraSuperior } from '../../relatorio/camerasDeCaptura'
import { registrarCapturador, type VistaDeCaptura } from '../../relatorio/capturas'
import { CAMERA_FOV } from './ControladorDeVista'

const LARGURA = 1200
const ALTURA = 800
const FUNDO = '#f3f5f8'

export interface DadosDeCaptura {
  giroGraus: number
  raioM: number
  alturaPontaM: number
  raioTraseiroM: number
  /** Pontos do chão (x, z) que a planta precisa enquadrar: caminhão, sapatas, carga, mapa. */
  pontosXZ: [number, number][]
}

/**
 * Capturas da cena para o relatório PDF (Épico 16): renderiza a cena ATUAL
 * num alvo fora da tela, com uma câmera própria — a câmera do usuário não se
 * mexe. Os rótulos e cotas em <Html> são DOM sobre o canvas e não entram na
 * imagem (os valores deles estão nas tabelas do relatório).
 */
export function CapturadorDeCena({ dados }: { dados: DadosDeCaptura }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const dadosRef = useRef(dados)
  dadosRef.current = dados

  useEffect(() => {
    registrarCapturador((vista: VistaDeCaptura) => {
      const d = dadosRef.current
      const aspecto = LARGURA / ALTURA
      const { posicao, alvo } =
        vista === 'lateral'
          ? cameraLateral({ ...d, fovGraus: CAMERA_FOV, aspecto })
          : cameraSuperior({ pontosXZ: d.pontosXZ, alturaMaximaM: d.alturaPontaM, fovGraus: CAMERA_FOV, aspecto })
      const camera = new PerspectiveCamera(CAMERA_FOV, aspecto, 0.1, 2000)
      camera.position.set(...posicao)
      camera.lookAt(...alvo)
      camera.updateMatrixWorld()

      const alvoRender = new WebGLRenderTarget(LARGURA, ALTURA, { samples: 4 })
      alvoRender.texture.colorSpace = SRGBColorSpace
      const fundoAnterior = scene.background
      scene.background = new Color(FUNDO)
      const pixels = new Uint8Array(LARGURA * ALTURA * 4)
      try {
        gl.setRenderTarget(alvoRender)
        gl.render(scene, camera)
        gl.readRenderTargetPixels(alvoRender, 0, 0, LARGURA, ALTURA, pixels)
      } finally {
        gl.setRenderTarget(null)
        scene.background = fundoAnterior
        alvoRender.dispose()
        invalidate()
      }

      // O WebGL lê de baixo para cima: inverte as linhas ao montar a imagem.
      const canvas = document.createElement('canvas')
      canvas.width = LARGURA
      canvas.height = ALTURA
      const ctx = canvas.getContext('2d')!
      const imagem = ctx.createImageData(LARGURA, ALTURA)
      const linha = LARGURA * 4
      for (let y = 0; y < ALTURA; y++) {
        imagem.data.set(pixels.subarray((ALTURA - 1 - y) * linha, (ALTURA - y) * linha), y * linha)
      }
      ctx.putImageData(imagem, 0, 0)
      return canvas.toDataURL('image/jpeg', 0.88)
    })
    return () => registrarCapturador(null)
  }, [gl, scene, invalidate])

  return null
}
