import { expect, test } from '@playwright/test'
import { pontaDaLanca } from '../src/components/geometriaCanvas'

// Ângulos de recuo/geometria replicados aqui só para computar o alvo exato
// do arrasto (mesma fórmula de engine/geometriaLanca.ts) — não reimplementa
// o motor de cálculo, só a geometria de conversão raio ⇄ ângulo.
function anguloParaRaio(comprimentoLancaM: number, recuoPeDaLancaM: number, raioAlvoM: number): number {
  const cosAngulo = (raioAlvoM + recuoPeDaLancaM) / comprimentoLancaM
  return (Math.acos(Math.min(1, Math.max(-1, cosAngulo))) * 180) / Math.PI
}

// Smoke test — confirma que a tela de simulação carrega e reage a uma
// configuração exata conhecida.
test('carrega a tela de simulação e calcula a capacidade para uma configuração exata do MD-300L', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Simulador de Tabela de Carga/i })).toBeVisible()

  await page.getByLabel('Comprimento de lança (m)').selectOption('14.1')
  await page.getByLabel('Raio de trabalho (m)').fill('4')

  await expect(page.getByText('20.000 kg')).toBeVisible()
  await expect(page.getByText('Dentro do limite')).toBeVisible()
})

test('indicador visual de status (Task 4.1 / RF03) muda entre dentro do limite e excede a capacidade', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByLabel('Comprimento de lança (m)').selectOption('14.1')
  await page.getByLabel('Raio de trabalho (m)').fill('4')

  await page.getByLabel('Carga içada (kg)').fill('15000')
  await expect(page.locator('.status-chip--good')).toContainText('Dentro do limite seguro')
  await expect(page.locator('.status-chip--good')).toContainText('Margem de segurança: 25.0%')

  await page.getByLabel('Carga içada (kg)').fill('25000')
  await expect(page.locator('.status-chip--critical')).toContainText('Carga excede a capacidade máxima')
  await expect(page.locator('.status-chip--critical')).toContainText('Excedente de 25.0%')

  await page.getByLabel('Raio de trabalho (m)').fill('999')
  await expect(page.locator('.status-chip--warning')).toContainText('fora da faixa operável')
})

test('Task 4.2 — digitar no campo "Raio de trabalho" tecla por tecla não reformata/engole o texto', async ({
  page,
}) => {
  await page.goto('/')

  const campoRaio = page.getByLabel('Raio de trabalho (m)')
  await campoRaio.click()
  await campoRaio.fill('')
  // Digitação tecla por tecla (não .fill()) — é isso que expõe o bug de um
  // campo controlado por um valor derivado e reformatado a cada render.
  await campoRaio.pressSequentially('8.5')

  await expect(campoRaio).toHaveValue('8.5')

  // Ao perder o foco, o campo resincroniza com o raio real (2 casas decimais).
  await campoRaio.blur()
  await expect(campoRaio).toHaveValue('8.50')
})

test('toggle de JIB (RF12) aparece só para o MD-300L e calcula contra a tabela de JIB', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByLabel(/Usar lança JIB/i)).toBeVisible()
  await page.getByLabel(/Usar lança JIB/i).check()

  await page.getByLabel('Comprimento do JIB (m)').selectOption('9')
  await page.getByLabel('Ângulo do JIB (°)').selectOption('10')
  await page.getByLabel('Raio de trabalho (m)').fill('6')

  await expect(page.getByText('3.000 kg')).toBeVisible()

  // TM-130 não tem JIB — o toggle não deve existir para ele.
  await page.getByRole('combobox').first().selectOption('TM-130')
  await expect(page.getByLabel(/Usar lança JIB/i)).toHaveCount(0)
})

test('UC02 (MD-300L) — arrastar o gancho no canvas muda o raio e a capacidade calculada', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Comprimento de lança (m)').selectOption('14.1')
  // Parte de um raio conhecido (4,00m) para calcular a posição inicial exata do gancho.
  await page.getByLabel('Raio de trabalho (m)').fill('4')
  await page.getByLabel('Raio de trabalho (m)').blur()

  const canvas = page.locator('.canvas-lanca canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('canvas não encontrado')

  const recuoMD300L = 1.4
  const anguloInicial = anguloParaRaio(14.1, recuoMD300L, 4)
  const origem = pontaDaLanca(14.1, anguloInicial)
  const anguloAlvo = 60 // dentro do range de arrasto (5°–85°)
  const destino = pontaDaLanca(14.1, anguloAlvo)

  await page.mouse.move(box.x + origem.x, box.y + origem.y)
  await page.mouse.down()
  await page.mouse.move(box.x + destino.x, box.y + destino.y, { steps: 10 })
  await page.mouse.up()

  // raio esperado a 60°: 14,1×cos(60°) − 1,4 ≈ 5,65 m (tolerância por
  // arredondamento de pixel do mouse do navegador)
  const raioEsperado = 14.1 * Math.cos((anguloAlvo * Math.PI) / 180) - recuoMD300L
  const raioObtido = Number(await page.getByLabel('Raio de trabalho (m)').inputValue())
  expect(Math.abs(raioObtido - raioEsperado)).toBeLessThan(0.1)

  // no raio novo (~5,65m), a capacidade tabelada mudou em relação ao raio inicial (20.000 kg)
  await expect(page.getByText('20.000 kg')).not.toBeVisible()
})

test('UC02 (TM-130) — arrastar o gancho no canvas muda o ângulo e a capacidade calculada (Zona I)', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('combobox').first().selectOption('TM-130')
  await page.getByLabel('Zona de giro').selectOption('I')

  const anguloInicial = 30
  await page.getByLabel('Ângulo da lança (°)').fill(String(anguloInicial))

  const canvas = page.locator('.canvas-lanca canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('canvas não encontrado')

  // TM-130 não tem comprimento real na tabela — o canvas usa 12m só como
  // referência visual (COMPRIMENTO_VISUAL_TM130 na store), sem afetar o cálculo.
  // Alvo de 65° (não 70°, o máximo da tabela) para dar folga ao arredondamento
  // de pixel do mouse — passar de 70° cairia em "fora da faixa".
  const comprimentoVisual = 12
  const origem = pontaDaLanca(comprimentoVisual, anguloInicial)
  const anguloAlvo = 65
  const destino = pontaDaLanca(comprimentoVisual, anguloAlvo)

  await page.mouse.move(box.x + origem.x, box.y + origem.y)
  await page.mouse.down()
  await page.mouse.move(box.x + destino.x, box.y + destino.y, { steps: 10 })
  await page.mouse.up()

  const anguloFinal = await page.getByLabel('Ângulo da lança (°)').inputValue()
  expect(Number(anguloFinal)).toBeGreaterThan(60) // arrastado para perto de 70°, longe do 30° inicial

  // De 40° a 70° a Zona I é um platô de 3.800 kg (confirmado em Tabelas_Zonas_Giro.xlsx) —
  // qualquer ângulo final nesse intervalo deve cair exatamente nesse valor.
  const capacidadeTexto = await page.locator('.resultado .capacidade').innerText()
  const capacidadeKg = Number(capacidadeTexto.replace(/[^\d]/g, ''))
  expect(capacidadeKg).toBe(3800)
})

test('busca reversa por peso (RF05/RF15) lista o TM-130 antes do MD-300L', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Peso a içar (kg)').fill('2000')

  const lista = page.locator('.busca-reversa__lista li')
  await expect(lista).toHaveCount(2)
  await expect(lista.nth(0)).toContainText('TM-130')
  await expect(lista.nth(1)).toContainText('MD-300L')
})
