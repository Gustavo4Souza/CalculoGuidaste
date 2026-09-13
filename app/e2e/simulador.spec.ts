import { expect, test } from '@playwright/test'

// Smoke test — confirma que a tela de simulação carrega e reage a uma
// configuração exata conhecida. Expandir para o fluxo completo do UC02
// (arrasto no canvas) quando o Épico 3 estiver pronto.
test('carrega a tela de simulação e calcula a capacidade para uma configuração exata do MD-300L', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Simulador de Tabela de Carga/i })).toBeVisible()

  await page.getByLabel('Comprimento de lança (m)').fill('17.7')
  await page.getByLabel('Raio de trabalho (m)').fill('6')

  await expect(page.getByText('20.000 kg')).toBeVisible()
  await expect(page.getByText('Dentro do limite')).toBeVisible()
})
