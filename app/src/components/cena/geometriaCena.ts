/**
 * Geometria pura da cena 3D (Épico 13) — converte a especificação do
 * guindaste (data/especificacoes/*.json) em posições de desenho, sem React.
 *
 * Convenção de eixos do MUNDO (metros):
 * - origem = CENTRO DE GIRO, ao nível do solo; Y = altura;
 * - o caminhão fica parado ao longo do eixo X; a superestrutura gira em Y;
 * - giro 0° aponta para +X: no MD-300L isso é a FRENTE do caminhão (setor
 *   frontal), no TM-130 é a TRASEIRA (ver config/criteriosDeGiro.ts) — por
 *   isso a frente do caminhão fica em +X num e em -X no outro;
 * - giro positivo = sentido horário visto de cima, ou seja, de +X para +Z.
 *
 * Dentro da superestrutura (referencial que gira), o plano de operação da
 * lança é o plano local XY: centro de giro em x = 0, pé da lança em
 * x = -recuo (RF11), raio de trabalho = x local do gancho.
 */
import type { PosicaoSapata } from '../../types/cenario'
import type { EspecificacaoGuindaste } from '../../types/especificacao'

type V3 = [number, number, number]

/** +1 quando a frente do caminhão (cabine) fica em +X; -1 quando fica em -X. */
export function sinalDaFrente(esp: EspecificacaoGuindaste): 1 | -1 {
  return esp.giroZeroApontaPara === 'frente' ? 1 : -1
}

/** Posição X no mundo de um ponto do caminhão dado ao longo do eixo (positivo = sentido da frente). */
export function xNoMundo(esp: EspecificacaoGuindaste, posicaoNoEixoM: number): number {
  return sinalDaFrente(esp) * posicaoNoEixoM
}

/**
 * Lado Z da sapata no mundo: olhando para a frente do caminhão, a direita é
 * (frente × cima) — com a frente em +X a direita é +Z; com a frente em -X a
 * direita é -Z.
 */
export function ladoZDaSapata(esp: EspecificacaoGuindaste, posicao: PosicaoSapata): 1 | -1 {
  const direita = sinalDaFrente(esp)
  return posicao.endsWith('direita') ? direita : (-direita as 1 | -1)
}

/** Centro do pé (sapata) de apoio no chão, para a extensão informada. */
export function posicaoDaSapata(esp: EspecificacaoGuindaste, posicao: PosicaoSapata, extensaoM: number): V3 {
  const noEixo = posicao.startsWith('dianteira') ? esp.caminhao.sapataDianteiraM.valor : esp.caminhao.sapataTraseiraM.valor
  return [xNoMundo(esp, noEixo), 0, ladoZDaSapata(esp, posicao) * extensaoM]
}

/** Rotação Y (radianos) da superestrutura para um giro em graus — horário visto de cima. */
export function rotacaoDoGiro(giroGraus: number): number {
  return (-giroGraus * Math.PI) / 180
}

/** Giro (graus, -180..180) que aponta a lança para o ponto (x, z) do chão. */
export function giroDoPonto(x: number, z: number): number {
  return (Math.atan2(z, x) * 180) / Math.PI
}

/** Direção horizontal da lança no mundo para um giro (vetor unitário no plano XZ). */
export function direcaoDoGiro(giroGraus: number): V3 {
  const g = (giroGraus * Math.PI) / 180
  return [Math.cos(g), 0, Math.sin(g)]
}

/** Extremos do caminhão no eixo X do mundo (para enquadrar as vistas). */
export function extremosDoCaminhao(esp: EspecificacaoGuindaste): { xMin: number; xMax: number } {
  const a = xNoMundo(esp, esp.caminhao.dianteiraM.valor)
  const b = xNoMundo(esp, esp.caminhao.traseiraM.valor)
  return { xMin: Math.min(a, b), xMax: Math.max(a, b) }
}
