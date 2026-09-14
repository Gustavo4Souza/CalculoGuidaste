import { expect, test, type Locator } from '@playwright/test'
import * as THREE from 'three'
import { CAMERA_ALVO, CAMERA_FOV, CAMERA_POSICAO, GANCHO_OFFSET_Y } from '../src/components/CenaGuindaste3D'

// Ângulos de recuo/geometria replicados aqui só para computar o alvo exato
// do arrasto (mesma fórmula de engine/geometriaLanca.ts) — não reimplementa
// o motor de cálculo, só a geometria de conversão raio ⇄ ângulo.
function anguloParaRaio(comprimentoLancaM: number, recuoPeDaLancaM: number, raioAlvoM: number): number {
  const cosAngulo = (raioAlvoM + recuoPeDaLancaM) / comprimentoLancaM
  return (Math.acos(Math.min(1, Math.max(-1, cosAngulo))) * 180) / Math.PI
}

/**
 * Projeta um ponto 3D (coordenadas de mundo, metros) em pixels relativos ao
 * canvas, usando a MESMA câmera fixa (posição/alvo/fov) exportada por
 * CenaGuindaste3D.tsx — assim o teste não precisa adivinhar coordenadas de
 * tela, e continua exato mesmo que o tamanho do canvas mude (ele recebe a
 * largura/altura reais do boundingBox no momento do teste).
 */
function projetarPontoNaTela(
  ponto3D: [number, number, number],
  larguraPx: number,
  alturaPx: number,
): { x: number; y: number } {
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, larguraPx / alturaPx, 0.1, 1000)
  camera.position.set(...CAMERA_POSICAO)
  camera.lookAt(...CAMERA_ALVO)
  camera.updateProjectionMatrix()
  // Vector3.project() usa matrixWorldInverse, que só é recalculado aqui —
  // sem isso a câmera "solta" (fora da árvore da cena) projeta qualquer
  // ponto para fora do NDC válido.
  camera.updateMatrixWorld(true)

  const ndc = new THREE.Vector3(...ponto3D).project(camera)
  return {
    x: ((ndc.x + 1) / 2) * larguraPx,
    y: ((1 - ndc.y) / 2) * alturaPx,
  }
}

/**
 * Posição 3D (mundo) da MESH do gancho, replicando exatamente a árvore de
 * objetos de CenaGuindaste3D: o grupo principal fica em (0, alturaPeDaLancaM, 0)
 * rotacionado no eixo Z por anguloGraus, e dentro dele o gancho (dentro de
 * SegmentoLanca) fica no ponto local (comprimentoLancaM, GANCHO_OFFSET_Y, 0)
 * — ou seja, é a ponta da lança deslocada verticalmente pelo offset do
 * gancho, tudo rotacionado junto pelo mesmo ângulo. Usada só para calcular
 * onde CLICAR (pointerdown precisa acertar a mesh do gancho).
 */
function posicaoGancho3D(
  alturaPeDaLancaM: number,
  comprimentoLancaM: number,
  anguloGraus: number,
): [number, number, number] {
  const anguloRad = (anguloGraus * Math.PI) / 180
  const localX = comprimentoLancaM
  const localY = GANCHO_OFFSET_Y
  const rotX = localX * Math.cos(anguloRad) - localY * Math.sin(anguloRad)
  const rotY = localX * Math.sin(anguloRad) + localY * Math.cos(anguloRad)
  return [rotX, alturaPeDaLancaM + rotY, 0]
}

/**
 * Ponto 3D "cru" (sem o offset do gancho) usado como ALVO do arrasto: uma
 * vez capturado o ponteiro, CenaGuindaste3D recalcula o ângulo a partir da
 * interseção do mouse com o PlanoDeArrasto via
 * `anguloDoPonto(e.point.x - pivotX, e.point.y - pivotY)` — ou seja, trata
 * o ponto de interseção diretamente como (comprimento×cos, comprimento×sin),
 * SEM subtrair o GANCHO_OFFSET_Y. Por isso o alvo do arrasto (para onde
 * movemos o mouse depois do pointerdown) deve usar este ponto cru, não a
 * posição da mesh do gancho.
 */
function pontoAlvoArrasto3D(
  alturaPeDaLancaM: number,
  comprimentoLancaM: number,
  anguloGraus: number,
): [number, number, number] {
  const anguloRad = (anguloGraus * Math.PI) / 180
  return [comprimentoLancaM * Math.cos(anguloRad), alturaPeDaLancaM + comprimentoLancaM * Math.sin(anguloRad), 0]
}

/**
 * O React Three Fiber redimensiona o `<canvas>` via ResizeObserver depois
 * do primeiro paint — ler `boundingBox()` cedo demais (antes desse resize
 * TERMINAR, não só começar) pode gerar coordenadas de arrasto calculadas
 * para um tamanho de canvas que já mudou de novo por baixo dos pés do
 * teste. Sintoma sem erro visível: o "clique" acerta um alvo fino (a barra
 * da lança, ao contrário do gancho — uma esfera bem maior) por pouco, então
 * o teste às vezes passa e às vezes não. Por isso não basta esperar o
 * canvas passar de 300×150 (tamanho padrão do HTML) uma vez — espera duas
 * leituras consecutivas, com um intervalo entre elas, baterem exatamente,
 * confirmando que o layout já parou de se mover.
 */
async function canvasEstavel(canvas: Locator) {
  let ultima = { w: -1, h: -1 }
  await expect
    .poll(
      async () => {
        const box = await canvas.boundingBox()
        const atual = { w: box?.width ?? 0, h: box?.height ?? 0 }
        const estabilizou = atual.w > 400 && atual.w === ultima.w && atual.h === ultima.h
        ultima = atual
        return estabilizou
      },
      { message: 'canvas nunca ficou com tamanho estável (R3F ainda redimensionando)', intervals: [150] },
    )
    .toBe(true)
  const box = await canvas.boundingBox()
  if (!box) throw new Error('canvas não encontrado')
  return box
}

/**
 * Move o mouse até (px, py) e só confirma o pointerdown depois do raycasting
 * do WebGL realmente ter registrado o hover sobre um alvo arrastável (cursor
 * `ew-resize`, aplicado via onPointerOver em `SegmentoLanca`/`PlanoDeArrasto`).
 *
 * Sem isso, um mousedown que erre o raycast (renderização por software em
 * ambiente headless, sem GPU — instabilidade já documentada nestes testes)
 * ainda assim é um pointerdown válido no `<canvas>`, e o OrbitControls (que
 * escuta pointerdown/pointermove nativos no MESMO elemento, sem saber que
 * esse gesto "era" para a lança) começa a ORBITAR a câmera durante todo o
 * arrasto simulado — um bug real de contenção entre os dois, não só de
 * teste: a câmera fixa, usada por `projetarPontoNaTela` para calcular todo
 * o resto do arrasto, fica fora de sincronia, e mesmo uma tentativa seguinte
 * que acerte o raycast corretamente já parte de pixels que não correspondem
 * mais à câmera original. Esperar o cursor confirmar o hover antes do
 * `mouse.down()` evita disparar esse gesto errado.
 */
async function moverEArrastarComHover(
  page: import('@playwright/test').Page,
  origemPx: { x: number; y: number },
  destinoPx: { x: number; y: number },
) {
  // Uma única leitura de hover pode cair "entre" dois frames de raycasting
  // do renderizador por software — em vez de esperar parado, insiste com um
  // pequeno "chacoalhar" do mouse a cada tentativa, forçando novos frames de
  // raycast até o cursor confirmar (ou o timeout global do `expect.poll`
  // esgotar, sinal de que o alvo realmente não está sob o ponteiro).
  await expect
    .poll(
      async () => {
        await page.mouse.move(origemPx.x - 2, origemPx.y - 2)
        await page.mouse.move(origemPx.x, origemPx.y, { steps: 3 })
        return page.evaluate(() => document.body.style.cursor)
      },
      {
        message: 'cursor nunca virou ew-resize — raycast não achou a lança',
        timeout: 8000,
        intervals: [50],
      },
    )
    .toBe('ew-resize')
  await page.mouse.down()
  await page.mouse.move(destinoPx.x, destinoPx.y, { steps: 12 })
  await page.mouse.up()
}

// Smoke test — confirma que a tela de simulação carrega e reage a uma
// configuração exata conhecida.
test('carrega a tela de simulação e calcula a capacidade para uma configuração exata do MD-300L', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Guindastes Ribas/i })).toBeVisible()
  await expect(page.getByText('Simulador de Tabela de Carga')).toBeVisible()

  await page.getByLabel('Comprimento (m)').fill('14.1')
  await page.getByLabel('Comprimento (m)').blur()
  await page.getByLabel('Raio de trabalho (m)').fill('4')

  await expect(page.getByText('20.000 kg')).toBeVisible()
  await expect(page.getByText('Dentro do limite')).toBeVisible()
})

test('indicador visual de status (Task 4.1 / RF03) muda entre dentro do limite e excede a capacidade', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByLabel('Comprimento (m)').fill('14.1')
  await page.getByLabel('Comprimento (m)').blur()
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

test('UC02 (MD-300L) — arrastar o gancho na cena 3D muda o raio e a capacidade calculada', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Comprimento (m)').fill('14.1')
  await page.getByLabel('Comprimento (m)').blur()
  // Parte de um raio conhecido (4,00m) para calcular a posição inicial exata do gancho.
  await page.getByLabel('Raio de trabalho (m)').fill('4')
  await page.getByLabel('Raio de trabalho (m)').blur()

  const canvas = page.locator('.cena-3d canvas')
  const box = await canvasEstavel(canvas)

  const alturaPeDaLancaM = 3.0
  const recuoMD300L = 1.4
  const comprimentoLancaM = 14.1
  const anguloInicial = anguloParaRaio(comprimentoLancaM, recuoMD300L, 4)
  const anguloAlvo = 60 // dentro do range de arrasto (5°–85°)

  const origem3D = posicaoGancho3D(alturaPeDaLancaM, comprimentoLancaM, anguloInicial)
  // O alvo do arrasto usa o ponto "cru" (sem GANCHO_OFFSET_Y): é assim que
  // CenaGuindaste3D converte a interseção do arrasto em ângulo (ver
  // pontoAlvoArrasto3D acima).
  const destino3D = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoLancaM, anguloAlvo)
  const origem = projetarPontoNaTela(origem3D, box.width, box.height)
  const destino = projetarPontoNaTela(destino3D, box.width, box.height)

  await page.mouse.move(box.x + origem.x, box.y + origem.y)
  await page.mouse.down()
  await page.mouse.move(box.x + destino.x, box.y + destino.y, { steps: 12 })
  await page.mouse.up()

  // raio esperado a 60°: 14,1×cos(60°) − 1,4 ≈ 5,65 m
  const raioEsperado = comprimentoLancaM * Math.cos((anguloAlvo * Math.PI) / 180) - recuoMD300L
  const raioObtido = Number(await page.getByLabel('Raio de trabalho (m)').inputValue())
  expect(Math.abs(raioObtido - raioEsperado)).toBeLessThan(0.05)

  // no raio novo (~5,65m), a capacidade tabelada mudou em relação ao raio inicial (20.000 kg)
  await expect(page.getByText('20.000 kg')).not.toBeVisible()
})

test('Task 8.2 — arrastar a própria lança (não o gancho) na cena 3D muda o comprimento', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Comprimento (m)').fill('14.1')
  await page.getByLabel('Comprimento (m)').blur()
  await page.getByLabel('Raio de trabalho (m)').fill('4')
  await page.getByLabel('Raio de trabalho (m)').blur()

  const canvas = page.locator('.cena-3d canvas')
  const box = await canvasEstavel(canvas)

  const alturaPeDaLancaM = 3.0
  const recuoMD300L = 1.4
  const comprimentoInicialM = 14.1
  const anguloAtual = anguloParaRaio(comprimentoInicialM, recuoMD300L, 4)
  // 20,0 m: dentro do domínio real (10,50–32,10 m), longe o bastante de
  // qualquer um dos 7 comprimentos reais (marcas de encaixe, Task 9.2) para
  // não ser "grudado" pelo ímã — testa o valor livre/contínuo mesmo.
  const comprimentoAlvoM = 20.0

  // Clica na estrutura a 9m do pivot (não o gancho, na ponta) — não pode ser
  // uma fração do comprimento atual, porque desde a Task 9.2 o próprio
  // pointerdown já confirma um valor (clique direto = pulo exato numa
  // marca), então o comprimento pode mudar entre tentativas; um ponto fixo
  // sempre cai dentro da lança (mínimo real da tabela é 10,50m). 9m também
  // fica FORA da área de tela ocupada pelos campos embutidos "Comprimento"
  // e "Raio de trabalho" (Task 9.2) — cliques entre ~4m e ~8m nesta mesma
  // configuração caem em cima desses <Html> (DOM real, sobreposto ao
  // canvas), que capturam o clique antes de chegar no WebGL. O alvo do
  // arrasto é um ponto mais adiante, na MESMA direção/ângulo, à distância do
  // novo comprimento desejado (é assim que `projetarComprimento` em
  // components/geometriaCanvas.ts interpreta o arrasto).
  const pontoNaBarra = pontoAlvoArrasto3D(alturaPeDaLancaM, 9, anguloAtual)
  const pontoAlvo = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoAlvoM, anguloAtual)
  const origem = projetarPontoNaTela(pontoNaBarra, box.width, box.height)
  const destino = projetarPontoNaTela(pontoAlvo, box.width, box.height)
  const campoComprimento = page.getByLabel('Comprimento (m)')

  await moverEArrastarComHover(
    page,
    { x: box.x + origem.x, y: box.y + origem.y },
    { x: box.x + destino.x, y: box.y + destino.y },
  )
  const comprimentoObtido = Number(await campoComprimento.inputValue())

  expect(Math.abs(comprimentoObtido - comprimentoAlvoM)).toBeLessThan(0.3)

  // arrastar a lança não deve ter mexido no ângulo — o raio muda só porque
  // o comprimento mudou, na mesma direção de antes
  const raioEsperado = comprimentoAlvoM * Math.cos((anguloAtual * Math.PI) / 180) - recuoMD300L
  const raioObtido = Number(await page.getByLabel('Raio de trabalho (m)').inputValue())
  expect(Math.abs(raioObtido - raioEsperado)).toBeLessThan(0.3)
})

test('Task 9.2 — clicar numa marca de encaixe pula exatamente para aquele comprimento real', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Comprimento (m)').fill('14.1')
  await page.getByLabel('Comprimento (m)').blur()
  await page.getByLabel('Raio de trabalho (m)').fill('4')
  await page.getByLabel('Raio de trabalho (m)').blur()

  const canvas = page.locator('.cena-3d canvas')
  const box = await canvasEstavel(canvas)

  const alturaPeDaLancaM = 3.0
  const recuoMD300L = 1.4
  const comprimentoInicialM = 14.1
  const anguloAtual = anguloParaRaio(comprimentoInicialM, recuoMD300L, 4)
  const comprimentoAlvoM = 21.3 // uma das 7 marcas reais da tabela

  // Ponto de agarre fixo a 9m do pivot (ver comentário no teste anterior —
  // fora da área ocupada pelos campos embutidos "Comprimento"/"Raio de
  // trabalho", e não uma fração do comprimento atual).
  const pontoNaBarra = pontoAlvoArrasto3D(alturaPeDaLancaM, 9, anguloAtual)
  // Alvo exatamente sobre a marca — um clique simples (down+up sem mover)
  // já deve pular para esse valor exato (ver `onPointerDownEstrutura`).
  const pontoNaMarca = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoAlvoM, anguloAtual)
  const origem = projetarPontoNaTela(pontoNaBarra, box.width, box.height)
  const destino = projetarPontoNaTela(pontoNaMarca, box.width, box.height)
  const campoComprimento = page.getByLabel('Comprimento (m)')

  await moverEArrastarComHover(
    page,
    { x: box.x + origem.x, y: box.y + origem.y },
    { x: box.x + destino.x, y: box.y + destino.y },
  )
  const comprimentoObtido = Number(await campoComprimento.inputValue())

  // Diferente do teste anterior (valor livre) — aqui o resultado deve bater
  // EXATO com o ponto real da tabela, não só "perto" (é o ímã em ação).
  expect(comprimentoObtido).toBe(comprimentoAlvoM)
})

test('UC02 (TM-130) — arrastar o gancho na cena 3D muda o ângulo e a capacidade calculada (Zona I)', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('combobox').first().selectOption('TM-130')
  await page.getByLabel('Zona de giro').selectOption('I')

  const anguloInicial = 30
  await page.getByLabel('Ângulo da lança (°)').fill(String(anguloInicial))

  const canvas = page.locator('.cena-3d canvas')
  const box = await canvasEstavel(canvas)

  // TM-130 não tem comprimento real na tabela — a cena usa 12m só como
  // referência visual (COMPRIMENTO_VISUAL_TM130 na store), sem afetar o cálculo.
  // Alvo de 65° (não 70°, o máximo da tabela) para dar folga a qualquer
  // arredondamento de pixel — passar de 70° cairia em "fora da faixa".
  const alturaPeDaLancaM = 2.8
  const comprimentoVisual = 12
  const anguloAlvo = 65

  const origem3D = posicaoGancho3D(alturaPeDaLancaM, comprimentoVisual, anguloInicial)
  const destino3D = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoVisual, anguloAlvo)
  const origem = projetarPontoNaTela(origem3D, box.width, box.height)
  const destino = projetarPontoNaTela(destino3D, box.width, box.height)

  await page.mouse.move(box.x + origem.x, box.y + origem.y)
  await page.mouse.down()
  await page.mouse.move(box.x + destino.x, box.y + destino.y, { steps: 12 })
  await page.mouse.up()

  const anguloFinal = await page.getByLabel('Ângulo da lança (°)').inputValue()
  expect(Number(anguloFinal)).toBeCloseTo(65, 0) // arrastado para 65°, longe do 30° inicial

  // De 40° a 70° a Zona I é um platô de 3.800 kg (confirmado em Tabelas_Zonas_Giro.xlsx) —
  // qualquer ângulo final nesse intervalo deve cair exatamente nesse valor.
  const capacidadeTexto = await page.locator('.resultado .capacidade').innerText()
  const capacidadeKg = Number(capacidadeTexto.replace(/[^\d]/g, ''))
  expect(capacidadeKg).toBe(3800)
})

test('busca reversa por peso (RF05/RF15) lista o TM-130 antes do MD-300L', async ({ page }) => {
  await page.goto('/')

  // Busca reversa agora é uma aba própria, separada da tela de Simulação
  // (pedido do usuário: fluxo principal sempre visível, busca numa aba).
  await page.getByRole('tab', { name: 'Buscar por peso' }).click()

  await page.getByLabel('Peso a içar (kg)').fill('2000')

  const lista = page.locator('.busca-reversa__lista li')
  await expect(lista).toHaveCount(2)
  await expect(lista.nth(0)).toContainText('TM-130')
  await expect(lista.nth(1)).toContainText('MD-300L')
})
