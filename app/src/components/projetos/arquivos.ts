import type { ArquivoDeProjeto } from '../../types/projeto'

/** Nome de arquivo seguro a partir de cliente e obra. */
function nomeDoArquivo(arquivo: ArquivoDeProjeto): string {
  const base = `${arquivo.projeto.cliente}-${arquivo.projeto.obra}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `projeto-${base || 'guindastes-ribas'}.json`
}

/** Baixa o projeto exportado como arquivo JSON (RF25). */
export function baixarArquivoDeProjeto(arquivo: ArquivoDeProjeto): void {
  const blob = new Blob([JSON.stringify(arquivo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeDoArquivo(arquivo)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
