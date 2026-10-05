import { useId } from 'react'
import { useCampoNumericoSincronizado } from './useCampoNumericoSincronizado'

/**
 * Campo de parâmetro padrão (Épico 11, RF16): todo parâmetro aparece com
 * rótulo, unidade e faixa válida visíveis, e com o selo "≈" quando o valor
 * de referência NÃO vem das fichas técnicas (fonte "aproximado").
 *
 * Usa `type="text" inputMode="decimal"` (não `type="number"`) pelo mesmo
 * motivo dos campos embutidos na cena (Task 9.2): o navegador sanitiza
 * valores intermediários como "8." quando o React os reaplica.
 */
export function CampoParametro({
  rotulo,
  unidade,
  valor,
  aoMudar,
  aoLimpar,
  min,
  max,
  casas = 2,
  aproximado = false,
  dica,
  desabilitado = false,
}: {
  rotulo: string
  unidade: string
  valor: number | null
  aoMudar: (valor: number) => void
  /** Presente → o campo pode ficar vazio (valor null = "não informado"). */
  aoLimpar?: () => void
  min?: number
  max?: number
  casas?: number
  aproximado?: boolean
  dica?: string
  desabilitado?: boolean
}) {
  const id = useId()
  const campo = useCampoNumericoSincronizado(valor, aoMudar, casas, aoLimpar)
  const faixa =
    min !== undefined && max !== undefined
      ? `${formatar(min, casas)}–${formatar(max, casas)} ${unidade}`
      : min !== undefined
        ? `≥ ${formatar(min, casas)} ${unidade}`
        : null

  return (
    <div className="campo-parametro">
      <label htmlFor={id} className="campo-parametro__rotulo">
        {rotulo} ({unidade})
        {aproximado && (
          <span className="selo-aproximado" title="Valor de referência aproximado — não consta nas fichas técnicas">
            ≈
          </span>
        )}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={campo.texto}
        placeholder={aoLimpar ? 'não informado' : undefined}
        disabled={desabilitado}
        onFocus={campo.onFocus}
        onBlur={campo.onBlur}
        onChange={campo.onChange}
      />
      {(faixa || dica) && (
        <span className="campo-parametro__faixa">
          {faixa && <>faixa {faixa}</>}
          {faixa && dica && ' · '}
          {dica}
        </span>
      )}
    </div>
  )
}

function formatar(v: number, casas: number): string {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}
