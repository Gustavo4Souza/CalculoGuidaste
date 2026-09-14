import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * Task 4.2 (revisão de usabilidade) — corrige um bug encontrado no campo
 * "Raio de trabalho": como o valor exibido é *derivado* (raio ⇄ ângulo via
 * geometriaLanca.ts) e formatado com toFixed a cada render, um campo
 * totalmente controlado reformata o texto a cada tecla digitada e "engole"
 * o que o usuário está digitando (ex.: escrever "8." vira "8.00" antes de
 * completar a casa decimal).
 *
 * Este hook mantém um texto local livre enquanto o campo está focado —
 * só resincroniza com o valor externo (vindo do arrasto no canvas, por
 * exemplo) quando o campo perde o foco ou o valor muda fora dele.
 */
export function useCampoNumericoSincronizado(
  valorExterno: number,
  aoConfirmar: (valor: number) => void,
  casasDecimais = 2,
) {
  const [texto, setTexto] = useState(valorExterno.toFixed(casasDecimais))
  const focado = useRef(false)

  useEffect(() => {
    if (!focado.current) {
      setTexto(valorExterno.toFixed(casasDecimais))
    }
  }, [valorExterno, casasDecimais])

  return {
    texto,
    onFocus: () => {
      focado.current = true
    },
    onBlur: () => {
      focado.current = false
      setTexto(valorExterno.toFixed(casasDecimais))
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setTexto(e.target.value)
      // `Number(...)`, não `e.target.valueAsNumber`: os campos que usam este
      // hook hoje vivem dentro de um <Html> do react-three-fiber (Task 9.2)
      // — um <input type="number"> ali sofre um problema real do navegador:
      // ao React re-aplicar um valor intermediário inválido (ex.: "8.", no
      // meio de digitar "8.5") via a propriedade `.value`, o próprio input
      // numérico SANITIZA isso para "" (a digitação natural do usuário não
      // sofre disso — só a escrita programática via React). `Number("8.")`
      // já retorna 8 corretamente, sem essa armadilha.
      // `Number('')` é 0, não NaN — sem este guard, apagar o campo para
      // digitar de novo confirmaria um zero indesejado no meio do caminho.
      if (e.target.value.trim() === '') return
      const v = Number(e.target.value)
      if (!Number.isNaN(v)) aoConfirmar(v)
    },
  }
}
