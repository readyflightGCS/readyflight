import NumericInput from '@/components/ui/numericInput'
import { capitalise } from '@libs/util/text'

export default function Parameter({
  name,
  onChange,
  value,
  min,
  max,
  step
}: {
  name: string
  value: number
  onChange?: (event: { target: { name: string; value: number } }) => void
  min: number | null
  max: number | null
  step: number | null
}) {
  return (
    <div className="p-2">
      <label>
        <span className="block">{capitalise(name)}</span>
        <NumericInput className="w-40 border-input" name={name} onChange={onChange} value={value} min={min} max={max} step={step} />
      </label>
    </div>
  )
}
