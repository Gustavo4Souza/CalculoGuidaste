import { expect, test, type Locator } from '@playwright/test'
import * as THREE from 'three'
// Importa só módulos sem dados (JSON): o carregador do Playwright não aceita
// importar os JSON do catálogo sem "import attributes".
import { CAMERA_FOV, VISTA_ISOMETRICA } from '../src/components/cena/ControladorDeVista'
import { GANCHO_OFFSET_Y } from '../src/components/geometriaCanvas'

const CAMERA_POSICAO = VISTA_ISOMETRICA.posicao
const CAMERA_ALVO = VISTA_ISOMETRICA.alvo

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
  recuoPeDaLancaM = 0,
): [number, number, number] {
  const anguloRad = (anguloGraus * Math.PI) / 180
  const localX = comprimentoLancaM
  const localY = GANCHO_OFFSET_Y
  const rotX = localX * Math.cos(anguloRad) - localY * Math.sin(anguloRad)
  const rotY = localX * Math.sin(anguloRad) + localY * Math.cos(anguloRad)
  // Épico 13 — origem do mundo no centro de giro; o pé da lança fica em x = -recuo.
  return [rotX - recuoPeDaLancaM, alturaPeDaLancaM + rotY, 0]
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
  recuoPeDaLancaM = 0,
): [number, number, number] {
  const anguloRad = (anguloGraus * Math.PI) / 180
  return [
    comprimentoLancaM * Math.cos(anguloRad) - recuoPeDaLancaM,
    alturaPeDaLancaM + comprimentoLancaM * Math.sin(anguloRad),
    0,
  ]
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
  cursorEsperado = 'ew-resize',
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
        message: `cursor nunca virou ${cursorEsperado} — raycast não achou o alvo`,
        timeout: 8000,
        intervals: [50],
      },
    )
    .toBe(cursorEsperado)
  await page.mouse.down()
  await page.mouse.move(destinoPx.x, destinoPx.y, { steps: 12 })
  await page.mouse.up()
}


type Pagina = import('@playwright/test').Page

/**
 * Épico 17 — os campos ficam no PropertyManager de cada nó da árvore. Volta
 * para a árvore (o que confirma uma edição aberta, como o ✔ do SolidWorks)
 * e abre o nó pedido.
 */
async function editar(page: Pagina, no: string) {
  const abaArvore = page.getByRole('tab', { name: 'Árvore' })
  if ((await abaArvore.getAttribute('aria-selected')) !== 'true') await abaArvore.click()
  await page.getByRole('navigation', { name: 'Árvore do cenário' }).getByRole('button', { name: no, exact: true }).click()
  await expect(page.getByRole('region', { name: `Propriedades: ${no}` })).toBeVisible()
}

/** Campo pelo início do rótulo: o selo "≈" de valor aproximado fica dentro do rótulo. */
function campo(page: Pagina, rotulo: string) {
  return page.getByLabel(new RegExp(`^${rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
}

/** Preenche um campo do PropertyManager do nó (abrindo o nó antes). */
async function preencher(page: Pagina, no: string, rotulo: string, valor: string) {
  await editar(page, no)
  const alvo = campo(page, rotulo)
  await alvo.fill(valor)
  await alvo.blur()
}

/** Lê o valor de um campo do PropertyManager do nó. */
async function ler(page: Pagina, no: string, rotulo: string): Promise<number> {
  await editar(page, no)
  return Number(await campo(page, rotulo).inputValue())
}

const LANCA = 'Comprimento da lança (m)'
const RAIO = 'Raio de trabalho — do centro de giro (m)'

/** MD-300L com a lança de 14,10 m e o gancho no raio de 4 m (20.000 kg frontal, ponto exato). */
async function md14m4m(page: Pagina) {
  await preencher(page, 'Lança', LANCA, '14.1')
  await preencher(page, 'Lança', RAIO, '4')
}

// Smoke test — confirma que a tela de simulação carrega e reage a uma
// configuração exata conhecida.
test('carrega a tela de simulação e calcula a capacidade para uma configuração exata do MD-300L', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Guindastes Ribas/i })).toBeVisible()
  await expect(page.getByText('Simulador de Tabela de Carga')).toBeVisible()

  await md14m4m(page)
  await expect(page.locator('.resultado .capacidade')).toHaveText('20.000 kg')
  // Épico 11 — massa linear do cabo não consta nas fichas: sem ela, "não validada" (regra de ouro).
  await expect(page.locator('.status-chip--semdado')).toContainText('Operação não validada')
  await expect(page.locator('.status-chip--semdado')).toContainText('Massa linear do cabo')
  await preencher(page, 'Cabo e moitão', 'Massa linear do cabo (kg/m)', '1.1')
  await expect(page.locator('.status-chip--good')).toContainText('Operação aprovada')
})

test('Épico 17 — o veredito leva ao nó que corrige a pendência, e ✖ desfaz a edição', async ({ page }) => {
  await page.goto('/')

  // "Corrigir em Cabo e moitão" abre o PropertyManager certo.
  await page.locator('.status-chip--semdado').getByRole('button', { name: 'Corrigir em Cabo e moitão' }).click()
  await expect(page.getByRole('region', { name: 'Propriedades: Cabo e moitão' })).toBeVisible()
  await page.getByLabel('Massa linear do cabo (kg/m)').fill('1.1')
  await expect(page.locator('.status-chip--good')).toBeVisible()

  // ✖ (Cancelar) desfaz tudo o que mudou desde que o nó foi aberto.
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('.status-chip--semdado')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Árvore do cenário' })).toBeVisible()

  // ✔ (Confirmar) mantém.
  await editar(page, 'Cabo e moitão')
  await page.getByLabel('Massa linear do cabo (kg/m)').fill('1.1')
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.locator('.status-chip--good')).toBeVisible()

  // Sem dado, as verificações aparecem como parciais (um ✔ ali enganaria).
  await preencher(page, 'Sapatas', 'Sapata dianteira esquerda (m)', '2')
  await expect(page.locator('.resultado__detalhe summary', { hasText: 'Verificações parciais' })).toBeVisible()
})

test('indicador visual de status (Task 4.1 / RF03) muda entre dentro do limite e excede a capacidade', async ({
  page,
}) => {
  await page.goto('/')

  await md14m4m(page)
  // Massa do cabo informada à mão (0 kg) para o somatório ficar exatamente igual à carga.
  await preencher(page, 'Cabo e moitão', 'Massa do cabo — valor manual (kg)', '0')

  await preencher(page, 'Carga', 'Peso da carga (kg)', '15000')
  await expect(page.locator('.status-chip--good')).toContainText('Operação aprovada')
  await expect(page.locator('.status-chip--good')).toContainText('Utilização de 75,0%')

  await preencher(page, 'Limites e operação', 'Limite de utilização (%)', '70')
  await expect(page.locator('.status-chip--warning')).toContainText('Aprovada com atenção')
  await expect(page.locator('.status-chip--warning')).toContainText('acima do limite de 70%')

  await preencher(page, 'Carga', 'Peso da carga (kg)', '25000')
  await expect(page.locator('.status-chip--critical')).toContainText('Carga excede a capacidade da tabela')
  await expect(page.locator('.status-chip--critical')).toContainText('utilização de 125,0%')

  // Raio inalcançável → lança deitada (raio 12,70 m), além da última célula da coluna 14,10 m (12 m).
  await preencher(page, 'Lança', RAIO, '999')
  await expect(page.locator('.status-chip--semdado')).toContainText('sem célula na coluna 14,10 m')
})

test('Task 4.2 — digitar no campo "Raio de trabalho" tecla por tecla não reformata/engole o texto', async ({
  page,
}) => {
  await page.goto('/')
  await editar(page, 'Lança')

  const campoRaio = page.getByLabel(RAIO)
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

  const jib = page.getByRole('button', { name: 'Lança JIB' })
  await expect(jib).toBeEnabled()
  await jib.click()
  await expect(jib).toHaveAttribute('aria-pressed', 'true')

  await editar(page, 'JIB')
  await page.getByLabel('Comprimento do JIB (m)').selectOption('9')
  await page.getByLabel('Ângulo do JIB (°)').fill('10')
  await page.getByLabel(RAIO).fill('6')
  await expect(page.locator('.resultado .capacidade')).toHaveText('3.000 kg')

  // Offset intermediário (17,5°, raio 8 m) é interpolado entre as tabelas de 10° e 25°: 3.000 e 2.050 → 2.525 kg.
  await page.getByLabel('Ângulo do JIB (°)').fill('17.5')
  await page.getByLabel(RAIO).fill('8')
  await expect(page.locator('.resultado .capacidade')).toHaveText('2.525 kg')

  // TM-130: o JIB da ficha fica desligado até a Ribas confirmar — comando desabilitado, com o motivo.
  await page.getByRole('button', { name: 'TM-130' }).click()
  await expect(jib).toBeDisabled()
  await expect(jib).toHaveAttribute('title', /JIB desligado para o TM-130/)
})

test('UC02 (MD-300L) — arrastar o gancho na cena 3D muda o raio e a capacidade calculada', async ({ page }) => {
  await page.goto('/')
  // Parte de um raio conhecido (4,00 m) para calcular a posição inicial exata do gancho.
  await md14m4m(page)

  const canvas = page.locator('.cena-3d canvas')
  const box = await canvasEstavel(canvas)

  const alturaPeDaLancaM = 3.0
  const recuoMD300L = 1.4
  const comprimentoLancaM = 14.1
  const anguloInicial = anguloParaRaio(comprimentoLancaM, recuoMD300L, 4)
  const anguloAlvo = 60 // dentro do range de arrasto (5°–85°)

  const origem3D = posicaoGancho3D(alturaPeDaLancaM, comprimentoLancaM, anguloInicial, recuoMD300L)
  // O alvo do arrasto usa o ponto "cru" (sem GANCHO_OFFSET_Y): é assim que
  // CenaGuindaste3D converte a interseção do arrasto em ângulo (ver
  // pontoAlvoArrasto3D acima).
  const destino3D = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoLancaM, anguloAlvo, recuoMD300L)
  const origem = projetarPontoNaTela(origem3D, box.width, box.height)
  const destino = projetarPontoNaTela(destino3D, box.width, box.height)

  await page.mouse.move(box.x + origem.x, box.y + origem.y)
  await page.mouse.down()
  await page.mouse.move(box.x + destino.x, box.y + destino.y, { steps: 12 })
  await page.mouse.up()

  // raio esperado a 60°: 14,1×cos(60°) − 1,4 ≈ 5,65 m
  const raioEsperado = comprimentoLancaM * Math.cos((anguloAlvo * Math.PI) / 180) - recuoMD300L
  const raioObtido = await ler(page, 'Lança', RAIO)
  expect(Math.abs(raioObtido - raioEsperado)).toBeLessThan(0.05)

  // no raio novo (~5,65 m), a capacidade tabelada mudou em relação ao raio inicial (20.000 kg)
  await expect(page.locator('.resultado .capacidade')).not.toHaveText('20.000 kg')
})

test('Task 8.2 — arrastar a própria lança (não o gancho) na cena 3D muda o comprimento', async ({ page }) => {
  await page.goto('/')
  await md14m4m(page)

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

  // Clica na estrutura a 9 m do pivot (não o gancho, na ponta) — não pode ser
  // uma fração do comprimento atual, porque desde a Task 9.2 o próprio
  // pointerdown já confirma um valor (clique direto = pulo exato numa marca),
  // então o comprimento pode mudar entre tentativas; um ponto fixo sempre cai
  // dentro da lança (mínimo real da tabela é 10,50 m). O alvo do arrasto é um
  // ponto mais adiante, na MESMA direção/ângulo, à distância do novo
  // comprimento desejado (é assim que `projetarComprimento` em
  // components/geometriaCanvas.ts interpreta o arrasto).
  const pontoNaBarra = pontoAlvoArrasto3D(alturaPeDaLancaM, 9, anguloAtual, recuoMD300L)
  const pontoAlvo = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoAlvoM, anguloAtual, recuoMD300L)
  const origem = projetarPontoNaTela(pontoNaBarra, box.width, box.height)
  const destino = projetarPontoNaTela(pontoAlvo, box.width, box.height)

  await moverEArrastarComHover(
    page,
    { x: box.x + origem.x, y: box.y + origem.y },
    { x: box.x + destino.x, y: box.y + destino.y },
  )
  const comprimentoObtido = await ler(page, 'Lança', LANCA)
  expect(Math.abs(comprimentoObtido - comprimentoAlvoM)).toBeLessThan(0.3)

  // arrastar a lança não deve ter mexido no ângulo — o raio muda só porque
  // o comprimento mudou, na mesma direção de antes
  const raioEsperado = comprimentoAlvoM * Math.cos((anguloAtual * Math.PI) / 180) - recuoMD300L
  const raioObtido = await ler(page, 'Lança', RAIO)
  expect(Math.abs(raioObtido - raioEsperado)).toBeLessThan(0.3)
})

test('Task 9.2 — clicar numa marca de encaixe pula exatamente para aquele comprimento real', async ({ page }) => {
  await page.goto('/')
  await md14m4m(page)

  const canvas = page.locator('.cena-3d canvas')
  const box = await canvasEstavel(canvas)

  const alturaPeDaLancaM = 3.0
  const recuoMD300L = 1.4
  const comprimentoInicialM = 14.1
  const anguloAtual = anguloParaRaio(comprimentoInicialM, recuoMD300L, 4)
  const comprimentoAlvoM = 21.3 // uma das 7 marcas reais da tabela

  // Ponto de agarre fixo a 9 m do pivot (ver comentário no teste anterior).
  const pontoNaBarra = pontoAlvoArrasto3D(alturaPeDaLancaM, 9, anguloAtual, recuoMD300L)
  // Alvo exatamente sobre a marca — o ímã leva ao valor exato.
  const pontoNaMarca = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoAlvoM, anguloAtual, recuoMD300L)
  const origem = projetarPontoNaTela(pontoNaBarra, box.width, box.height)
  const destino = projetarPontoNaTela(pontoNaMarca, box.width, box.height)

  await moverEArrastarComHover(
    page,
    { x: box.x + origem.x, y: box.y + origem.y },
    { x: box.x + destino.x, y: box.y + destino.y },
  )
  // Diferente do teste anterior (valor livre) — aqui o resultado deve bater
  // EXATO com o ponto real da tabela, não só "perto" (é o ímã em ação).
  expect(await ler(page, 'Lança', LANCA)).toBe(comprimentoAlvoM)
})

test('UC02 (TM-130) — arrastar o gancho muda o ângulo e a capacidade vem do diagrama polar da lança principal', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'TM-130' }).click()

  // Épico 11 — o TM-130 tem comprimento real (5,9–12,4 m) e o ângulo fica no painel de parâmetros.
  const comprimentoM = 12
  const anguloInicial = 30
  await preencher(page, 'Lança', LANCA, String(comprimentoM))
  await preencher(page, 'Lança', 'Ângulo da lança (°)', String(anguloInicial))

  const canvas = page.locator('.cena-3d canvas')
  const box = await canvasEstavel(canvas)

  const alturaPeDaLancaM = 2.8
  const anguloAlvo = 65 // abaixo dos 70° máximos da ficha, com folga para arredondamento de pixel

  const origem3D = posicaoGancho3D(alturaPeDaLancaM, comprimentoM, anguloInicial)
  const destino3D = pontoAlvoArrasto3D(alturaPeDaLancaM, comprimentoM, anguloAlvo)
  const origem = projetarPontoNaTela(origem3D, box.width, box.height)
  const destino = projetarPontoNaTela(destino3D, box.width, box.height)

  await page.mouse.move(box.x + origem.x, box.y + origem.y)
  await page.mouse.down()
  await page.mouse.move(box.x + destino.x, box.y + destino.y, { steps: 12 })
  await page.mouse.up()

  expect(await ler(page, 'Lança', 'Ângulo da lança (°)')).toBeCloseTo(65, 0)

  // Task 10.1 — lança principal pelo diagrama polar (Zona I, giro 0°): 12 m a ~65° → raio ~5,07 m, entre
  // 5 m (26.000 kg) e 6 m (21.600 kg) da tabela real → interpolado, arredondado para baixo.
  const capacidadeTexto = await page.locator('.resultado .capacidade').innerText()
  const capacidadeKg = Number(capacidadeTexto.replace(/[^\d]/g, ''))
  expect(capacidadeKg).toBeGreaterThan(21600)
  expect(capacidadeKg).toBeLessThanOrEqual(26000)
  await expect(page.locator('.resultado__origem')).toContainText('interpolado')
  await expect(page.locator('.resultado__origem')).toContainText('Zona I')
  // Segue "não validada" só pelo que falta informar (nº de pernas e massas do cabo e do moitão não constam na ficha).
  await expect(page.locator('.status-chip--semdado')).toContainText('Nº de pernas do cabo não informado')
})

test('RF18 — a área de operação é derivada do giro (MD-300L, critério ±55° confirmado)', async ({ page }) => {
  await page.goto('/')

  // Estado inicial: 17,70 m, raio 8 m, giro 0° → frontal, 7.500 kg (ponto exato).
  await expect(page.locator('.resultado .capacidade')).toHaveText('7.500 kg')
  await expect(page.getByTestId('regiao-derivada')).toContainText('área frontal')
  await expect(page.locator('.barra-status .selo-provisorio')).toHaveCount(0)

  await preencher(page, 'Giro', 'Giro da superestrutura (°)', '90')
  await expect(page.getByTestId('regiao-derivada')).toContainText('áreas lateral e traseira')
  await expect(page.locator('.resultado .capacidade')).toHaveText('10.500 kg')

  // Fronteira exata (55°): avalia as duas áreas e fica com a menor.
  await preencher(page, 'Giro', 'Giro da superestrutura (°)', '55')
  await expect(page.getByTestId('regiao-derivada')).toContainText('área frontal / áreas lateral e traseira')
  await expect(page.locator('.resultado .capacidade')).toHaveText('7.500 kg')
})

test('RF17 — sapata em extensão parcial: sem dado do fabricante, com o motivo', async ({ page }) => {
  await page.goto('/')

  await preencher(page, 'Cabo e moitão', 'Massa linear do cabo (kg/m)', '1.1')
  await expect(page.locator('.status-chip--good')).toBeVisible()

  await preencher(page, 'Sapatas', 'Sapata dianteira esquerda (m)', '2')
  await expect(page.locator('.resultado .capacidade')).toHaveText('Sem dado do fabricante')
  await expect(page.locator('.status-chip--semdado')).toContainText('Sapata dianteira esquerda')
  // O ícone de estado do nó mostra onde está a pendência.
  await page.getByRole('tab', { name: 'Árvore' }).click()
  await expect(page.getByRole('button', { name: 'Sapatas', exact: true })).toContainText('falta dado')
})

test('busca reversa por peso (RF05/RF15) lista o TM-130 antes do MD-300L (menor guindaste primeiro)', async ({ page }) => {
  await page.goto('/')

  // Épico 17 — a busca reversa fica na aba "Avaliar" do CommandManager.
  await page.getByRole('tab', { name: 'Avaliar' }).click()
  await page.getByRole('button', { name: 'Buscar por peso' }).click()
  await expect(page.getByRole('dialog', { name: 'Buscar por peso' })).toBeVisible()

  await page.getByLabel('Peso a içar (kg)').fill('2000')

  // Task 10.7 — com a tabela da lança principal do TM-130 (diagrama polar), ele vem
  // primeiro: 26.000 kg nominais contra 30.000 kg do MD-300L (regra do RF15).
  const lista = page.locator('.busca-reversa__lista li')
  await expect(lista).toHaveCount(2)
  await expect(lista.nth(0)).toContainText('TM-130')
  await expect(lista.nth(0)).toContainText('Zona I')
  await expect(lista.nth(1)).toContainText('MD-300L')
  await expect(page.getByText(/Fora da busca/)).toHaveCount(0)
})

test('Épico 12/17 — layout CAD: barra de status, cotas na cena, vistas padrão e unidade kg/t (RF14)', async ({ page }) => {
  await page.goto('/')

  // Barra de status sempre visível com o resultado resumido e a versão das tabelas.
  await expect(page.getByTestId('status-barra')).toHaveText('Operação não validada')
  await expect(page.locator('.barra-status')).toContainText('Capacidade da tabela: 7.500 kg (ponto exato)')
  await expect(page.locator('.barra-status__versao')).toHaveText(/^tabelas-[0-9a-f]{8}$/)

  // Cotas desenhadas na cena, com os valores do motor (agora também o comprimento L).
  await expect(page.locator('.cena-3d__cota--raio')).toHaveText('R = 8,00 m')
  await expect(page.locator('.cena-3d__cota--angulo')).toContainText('α = 57,')
  await expect(page.locator('.cena-3d__cota--comprimento')).toHaveText('L = 17,70 m')
  await preencher(page, 'Limites e operação', 'Altura de içamento necessária (m)', '5')
  await expect(page.locator('.cena-3d__cota--icamento')).toHaveText('içamento 5,00 m')

  // Cotas liga/desliga pela barra de vista.
  await page.getByRole('button', { name: 'Cotas' }).click()
  await expect(page.locator('.cena-3d__cota--raio')).toHaveCount(0)
  await page.getByRole('button', { name: 'Cotas' }).click()

  // Vistas padrão: o botão fica marcado e a cena continua desenhando (cotas presentes).
  const vistas = page.getByRole('toolbar', { name: 'Vistas padrão' })
  for (const vista of ['Lateral', 'Superior', 'Frontal', 'Isométrica']) {
    await vistas.getByRole('button', { name: vista }).click()
    await expect(vistas.getByRole('button', { name: vista })).toHaveAttribute('aria-pressed', 'true')
  }
  await expect(page.locator('.cena-3d__cota--raio')).toHaveText('R = 8,00 m')

  // RF14 — kg ⇄ t é só de exibição.
  await page.getByRole('button', { name: 't', exact: true }).click()
  await expect(page.locator('.resultado .capacidade')).toHaveText('7,500 t')
  await expect(page.locator('.barra-status')).toContainText('Capacidade da tabela: 7,500 t')
  await page.getByRole('button', { name: 'kg', exact: true }).click()
  await expect(page.locator('.resultado .capacidade')).toHaveText('7.500 kg')

  await expect(page.getByRole('button', { name: 'Exportar PDF' })).toBeEnabled()
})

test('Épico 13 — arrastar o anel de giro no chão gira a superestrutura e troca a área derivada', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('regiao-derivada')).toContainText('área frontal')

  const box = await canvasEstavel(page.locator('.cena-3d canvas'))
  // Anel em volta do centro de giro: raio traseiro da superestrutura (3,016 m, ficha p.4) + 1,4 m.
  const raioAnel = 3.016 + 1.4
  const origem = projetarPontoNaTela([raioAnel, 0.06, 0], box.width, box.height) // giro 0°
  const destino = projetarPontoNaTela([0, 0.06, raioAnel], box.width, box.height) // giro 90° (+Z)

  await moverEArrastarComHover(
    page,
    { x: box.x + origem.x, y: box.y + origem.y },
    { x: box.x + destino.x, y: box.y + destino.y },
    'grab',
  )

  const giro = await ler(page, 'Giro', 'Giro da superestrutura (°)')
  expect(Math.abs(giro - 90)).toBeLessThan(3)
  await expect(page.getByTestId('regiao-derivada')).toContainText('áreas lateral e traseira')
})

test('Épico 13 — arrastar o pé de uma sapata muda só a extensão dela (e cai em "sem dado")', async ({ page }) => {
  await page.goto('/')
  await preencher(page, 'Cabo e moitão', 'Massa linear do cabo (kg/m)', '1.1')
  await expect(page.locator('.status-chip--good')).toBeVisible()

  const box = await canvasEstavel(page.locator('.cena-3d canvas'))
  // Sapata dianteira esquerda do MD-300L: 4,2 m à frente do centro de giro (≈), 3,25 m para a esquerda (-Z).
  const origem = projetarPontoNaTela([4.2, 0.4, -3.25], box.width, box.height)
  const destino = projetarPontoNaTela([4.2, 0.4, -2.0], box.width, box.height)

  await moverEArrastarComHover(
    page,
    { x: box.x + origem.x, y: box.y + origem.y },
    { x: box.x + destino.x, y: box.y + destino.y },
    'ns-resize',
  )

  const extensao = await ler(page, 'Sapatas', 'Sapata dianteira esquerda (m)')
  expect(Math.abs(extensao - 2.0)).toBeLessThan(0.2)
  await expect(campo(page, 'Sapata dianteira direita (m)')).toHaveValue('3.25')
  await expect(page.locator('.status-chip--semdado')).toContainText('Sapata dianteira esquerda')
})

test('Épico 13 — carga desenhada em escala com o centro de gravidade', async ({ page }) => {
  await page.goto('/')
  await preencher(page, 'Carga', 'Comprimento da carga (m)', '4')
  await expect(page.locator('.cena-3d__cota--cg')).toHaveText('CG')
  await expect(page.locator('.cena-3d__fontes')).toContainText('medidas da ficha')
})

test('Épico 14 — mapa da área de operação no chão (RF22): legenda, recálculo e liga/desliga', async ({ page }) => {
  await page.goto('/')
  const legenda = page.getByTestId('legenda-mapa')
  const pct = (status: string) => legenda.locator(`[data-status="${status}"] .legenda-mapa__pct`)

  // Cenário inicial: sem a massa linear do cabo nada é validado — 100% "sem dado", com aviso.
  await expect(pct('sem_dado')).toHaveText('100%')
  await expect(legenda.locator('.legenda-mapa__aviso')).toBeVisible()

  // Com o cabo informado e 9.000 kg na lança de 17,70 m, há regiões OK e NOK
  // (frontal: 7 m = 10.800 kg passa; 8 m = 7.500 kg não passa — tabela real).
  await preencher(page, 'Cabo e moitão', 'Massa linear do cabo (kg/m)', '1.1')
  await preencher(page, 'Carga', 'Peso da carga (kg)', '9000')
  await expect(legenda.locator('.legenda-mapa__aviso')).toHaveCount(0)
  await expect(pct('ok')).not.toHaveText('0%')
  await expect(pct('nok')).not.toHaveText('0%')

  // Sapata parcial → nenhuma posição validada (regra de ouro).
  await preencher(page, 'Sapatas', 'Sapata traseira esquerda (m)', '2')
  await expect(pct('sem_dado')).toHaveText('100%')

  // Liga/desliga pela barra de vista.
  await page.getByRole('button', { name: 'Área de operação' }).click()
  await expect(legenda).toHaveCount(0)
  await page.getByRole('button', { name: 'Área de operação' }).click()
  await expect(legenda).toBeVisible()
})

// ------------------------------------------------------------------ Épico 15

/** Salva a simulação atual como cenário novo, criando projeto e orçamento na hora. */
async function salvarComoCenarioNovoProjeto(page: Pagina, nome: string) {
  await page.getByRole('button', { name: 'Salvar como cenário' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Salvar como cenário' })
  await dialogo.getByLabel('Cliente').fill('Indústria Alfa')
  await dialogo.getByLabel('Obra').fill('Troca do transformador')
  await dialogo.getByLabel('Local').fill('Caxias do Sul/RS')
  await dialogo.getByLabel('Responsável técnico').fill('Eng. Fulano')
  await dialogo.getByLabel('Nome do novo orçamento').fill('Orçamento A')
  await dialogo.getByLabel('Nome do cenário').fill(nome)
  await dialogo.getByRole('button', { name: 'Salvar cenário' }).click()
  await expect(dialogo).toBeHidden()
}

test('Épico 15 — salvar, alterar, salvar como novo, recarregar a página, reabrir idêntico e comparar', async ({ page }) => {
  await page.goto('/')
  await preencher(page, 'Cabo e moitão', 'Massa linear do cabo (kg/m)', '1.1')
  await preencher(page, 'Carga', 'Peso da carga (kg)', '6000')

  await salvarComoCenarioNovoProjeto(page, 'Frontal 17,70 m')
  const aberto = page.getByTestId('cenario-aberto')
  await expect(aberto).toContainText('Indústria Alfa — Troca do transformador › Orçamento A')
  await expect(aberto).toContainText('Frontal 17,70 m')
  await expect(aberto).not.toContainText('alterações não salvas')
  // Épico 17 — o documento aberto também aparece na barra de título.
  await expect(page.locator('.barra-titulo__documento')).toContainText('Indústria Alfa › Orçamento A › Frontal 17,70 m')

  // Alterar marca o cenário como não salvo; "Salvar como cenário" no mesmo orçamento.
  await preencher(page, 'Giro', 'Giro da superestrutura (°)', '90')
  await expect(aberto).toContainText('alterações não salvas')
  await expect(page.locator('.barra-titulo__documento')).toContainText('alterações não salvas')
  await page.getByRole('button', { name: 'Salvar como cenário' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Salvar como cenário' })
  await dialogo.getByLabel('Nome do cenário').fill('Lateral 17,70 m')
  await dialogo.getByRole('button', { name: 'Salvar cenário' }).click()
  await expect(aberto).toContainText('Lateral 17,70 m')

  // Recarregar a página: os dados vivem no IndexedDB do navegador.
  await page.reload()
  await expect(page.getByTestId('cenario-aberto')).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir', exact: true }).click()
  const gerenciador = page.getByRole('dialog', { name: 'Projetos e cenários' })
  await gerenciador.getByRole('button', { name: /Indústria Alfa/ }).click()
  await gerenciador.getByRole('button', { name: 'Orçamento A' }).click()
  const linhaFrontal = gerenciador.getByRole('row', { name: /Frontal 17,70 m/ })
  await expect(linhaFrontal).toContainText('Aprovada')
  await linhaFrontal.getByRole('button', { name: 'Abrir' }).click()

  // Reaberto exatamente como foi salvo: giro 0°, 6.000 kg, 7.500 kg de capacidade (frontal, ponto exato).
  await expect(page.getByTestId('cenario-aberto')).toContainText('Frontal 17,70 m')
  await expect(page.getByTestId('cenario-aberto')).not.toContainText('alterações não salvas')
  expect(await ler(page, 'Giro', 'Giro da superestrutura (°)')).toBe(0)
  expect(await ler(page, 'Carga', 'Peso da carga (kg)')).toBe(6000)
  await expect(page.locator('.resultado .capacidade')).toHaveText('7.500 kg')

  // Comparar os dois lado a lado.
  await page.getByRole('button', { name: 'Abrir', exact: true }).click()
  await gerenciador.getByLabel('Comparar Frontal 17,70 m').check()
  await gerenciador.getByLabel('Comparar Lateral 17,70 m').check()
  await gerenciador.getByRole('button', { name: /Comparar selecionados \(2\)/ }).click()
  const comparacao = page.getByRole('dialog', { name: 'Comparar cenários' })
  await expect(comparacao.getByRole('columnheader', { name: 'Frontal 17,70 m' })).toBeVisible()
  await expect(comparacao.getByRole('columnheader', { name: 'Lateral 17,70 m' })).toBeVisible()
  await expect(comparacao.getByRole('row', { name: /Capacidade da tabela/ })).toContainText('7.500 kg')
  await expect(comparacao.getByRole('row', { name: /Capacidade da tabela/ })).toContainText('10.500 kg')
})

test('Épico 15 — exportar o projeto em JSON e importar de volta (como cópia); arquivo inválido é recusado', async ({ page }) => {
  await page.goto('/')
  await salvarComoCenarioNovoProjeto(page, 'Cenário exportado')

  // Épico 17 — Exportar JSON fica no menu Arquivo.
  await page.getByRole('button', { name: 'Arquivo' }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem', { name: 'Exportar JSON' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('projeto-industria-alfa-troca-do-transformador.json')
  const caminho = await download.path()

  await page.getByTestId('importar-json').setInputFiles(caminho!)
  const gerenciador = page.getByRole('dialog', { name: 'Projetos e cenários' })
  await expect(gerenciador.getByRole('status')).toContainText('importado (como cópia)')
  await expect(gerenciador.getByRole('button', { name: /Indústria Alfa/ })).toHaveCount(2)
  await gerenciador.getByRole('button', { name: 'Fechar', exact: true }).click()

  await page.getByTestId('importar-json').setInputFiles({
    name: 'invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ formato: 'outra-coisa' })),
  })
  await expect(gerenciador.getByRole('status')).toContainText('não é um projeto do simulador')
  await expect(gerenciador.getByRole('button', { name: /Indústria Alfa/ })).toHaveCount(2)
})

test('Épico 15 — excluir projeto (com confirmação) leva orçamentos e cenários junto', async ({ page }) => {
  page.on('dialog', (d) => void d.accept())
  await page.goto('/')
  await salvarComoCenarioNovoProjeto(page, 'Para excluir')
  await expect(page.getByTestId('cenario-aberto')).toBeVisible()

  await page.getByRole('button', { name: 'Abrir', exact: true }).click()
  const gerenciador = page.getByRole('dialog', { name: 'Projetos e cenários' })
  await gerenciador.getByRole('button', { name: /Indústria Alfa/ }).click()
  await gerenciador.getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(gerenciador.getByText('Nenhum projeto.')).toBeVisible()
  await gerenciador.getByRole('button', { name: 'Fechar', exact: true }).click()
  // O cenário que estava aberto deixou de existir: a simulação fica desvinculada.
  await expect(page.getByTestId('cenario-aberto')).toHaveCount(0)
  await expect(page.locator('.barra-titulo__documento')).toContainText('Cenário não salvo')
})

test('bug da tela branca (05/10/2026) — especificação desatualizada mostra o erro pelo nome, sem tela em branco', async ({
  page,
}) => {
  // Reproduz o relato: o navegador recebe o código novo com o JSON da especificação ANTIGO (sem o bloco
  // "caminhao" do Épico 13). Antes, isso virava "Cannot read properties of undefined (reading 'dianteiraM')"
  // dentro da cena 3D e a tela ficava em branco.
  await page.route('**/src/data/especificacoes/md-300l.json*', async (rota) => {
    const resposta = await rota.fetch()
    const modulo = await resposta.text()
    // O Vite entrega o JSON como módulo JS; no `export default` a chave aparece abreviada ("  caminhao,").
    const semCaminhao = modulo.replace(/^(\s*)caminhao,$/m, '$1caminhaoAntigo: caminhao,')
    expect(semCaminhao).not.toBe(modulo)
    await rota.fulfill({ response: resposta, body: semCaminhao })
  })
  await page.goto('/')
  const erro = page.getByRole('alert')
  await expect(erro).toContainText('Os dados do simulador estão incompletos ou desatualizados')
  await expect(erro).toContainText('Especificação do MD-300L: "caminhao.dianteiraM" ausente ou inválido')
  await expect(erro).toContainText('Ctrl+Shift+R')
})

// ------------------------------------------------------------------ Épico 16

const PASTA_PDFS = process.env.PASTA_PDFS_E2E

/** Gera o PDF pelo diálogo e devolve o conteúdo bruto do arquivo baixado. */
async function gerarPdf(page: Pagina, tipo: 'Cenário atual' | 'Orçamento completo', salvarComo?: string) {
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Exportar relatório PDF' })
  await dialogo.getByLabel(new RegExp(`^${tipo}`)).check()
  const [download] = await Promise.all([page.waitForEvent('download'), dialogo.getByRole('button', { name: 'Gerar PDF' }).click()])
  await expect(dialogo).toBeHidden()
  if (PASTA_PDFS && salvarComo) await download.saveAs(`${PASTA_PDFS}/${salvarComo}`)
  const fs = await import('node:fs')
  return { nome: download.suggestedFilename(), conteudo: fs.readFileSync((await download.path())!) }
}

test('Épico 16 — relatório PDF do cenário atual (não salvo)', async ({ page }) => {
  await page.goto('/')
  await preencher(page, 'Cabo e moitão', 'Massa linear do cabo (kg/m)', '1.1')
  await preencher(page, 'Carga', 'Peso da carga (kg)', '6000')
  await expect(page.locator('.status-chip--good')).toBeVisible()

  const { nome, conteudo } = await gerarPdf(page, 'Cenário atual', 'relatorio-cenario.pdf')
  expect(nome).toMatch(/^relatorio-md-300l-cenario-nao-salvo-\d{4}-\d{2}-\d{2}\.pdf$/)
  expect(conteudo.subarray(0, 5).toString()).toBe('%PDF-')
  expect(conteudo.length).toBeGreaterThan(60_000) // com as duas capturas da cena (JPEG)

  // A tela continua exatamente como estava (o relatório não altera a simulação).
  await expect(page.locator('.resultado .capacidade')).toHaveText('7.500 kg')
  expect(await ler(page, 'Carga', 'Peso da carga (kg)')).toBe(6000)
})

test('Épico 16 — relatório PDF do orçamento (comparativo + um capítulo por cenário) restaura a tela', async ({ page }) => {
  await page.goto('/')
  await preencher(page, 'Cabo e moitão', 'Massa linear do cabo (kg/m)', '1.1')
  await preencher(page, 'Carga', 'Peso da carga (kg)', '6000')
  await salvarComoCenarioNovoProjeto(page, 'Frontal 17,70 m')
  await preencher(page, 'Giro', 'Giro da superestrutura (°)', '90')
  await page.getByRole('button', { name: 'Salvar como cenário' }).click()
  const dialogoSalvar = page.getByRole('dialog', { name: 'Salvar como cenário' })
  await dialogoSalvar.getByLabel('Nome do cenário').fill('Lateral 17,70 m')
  await dialogoSalvar.getByRole('button', { name: 'Salvar cenário' }).click()
  await expect(dialogoSalvar).toBeHidden()
  // Desligar o mapa: o relatório liga para capturar e depois volta como estava.
  await page.getByRole('button', { name: 'Área de operação' }).click()

  const { nome, conteudo } = await gerarPdf(page, 'Orçamento completo', 'relatorio-orcamento.pdf')
  expect(nome).toMatch(/^relatorio-industria-alfa-orcamento-a-\d{4}-\d{2}-\d{2}\.pdf$/)
  expect(conteudo.subarray(0, 5).toString()).toBe('%PDF-')

  // Para capturar, cada cenário passou pela cena; no fim, a tela volta ao cenário aberto, sem "alterações".
  const aberto = page.getByTestId('cenario-aberto')
  await expect(aberto).toContainText('Lateral 17,70 m')
  await expect(aberto).not.toContainText('alterações não salvas')
  await expect(page.locator('.resultado .capacidade')).toHaveText('10.500 kg')
  await expect(page.getByRole('button', { name: 'Área de operação' })).toHaveAttribute('aria-pressed', 'false')
})
