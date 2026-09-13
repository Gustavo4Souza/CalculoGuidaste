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
