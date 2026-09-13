import { expect, test } from '@playwright/test'

// Smoke test — confirma que a tela de simulação carrega e reage a uma
// configuração exata conhecida. Expandir para o fluxo completo do UC02
// (arrasto no canvas) quando o Épico 3 estiver pronto.
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

test('busca reversa por peso (RF05/RF15) lista o TM-130 antes do MD-300L', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Peso a içar (kg)').fill('2000')

  const lista = page.locator('.busca-reversa__lista li')
  await expect(lista).toHaveCount(2)
  await expect(lista.nth(0)).toContainText('TM-130')
  await expect(lista.nth(1)).toContainText('MD-300L')
})
