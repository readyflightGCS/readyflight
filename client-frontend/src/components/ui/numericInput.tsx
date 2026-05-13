import { cn } from '@/lib/utils'
import { useState, useRef, useEffect, useCallback } from 'react'

interface NumericInputProps {
  value?: number
  name: string
  onChange?: (event: { target: { name: string; value: number } }) => void
  className?: string
  min?: number | null
  max?: number | null
}

export default function NumericInput({
  value: externalValue = null,
  name,
  onChange,
  className = 'w-40',
  min = -Infinity,
  max = Infinity
}: NumericInputProps) {
  const [textValue, setTextValue] = useState<string>(
    externalValue === null ? '' : String(externalValue)
  )
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startValue, setStartValue] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the editable buffer in sync with the external value when the user
  // isn't actively editing/dragging. Do it asynchronously to avoid the
  // "setState-in-effect" lint that warns about cascading renders.
  useEffect(() => {
    if (isEditing || isDragging) return
    const id = window.setTimeout(() => {
      setTextValue(externalValue === null ? '' : String(externalValue))
    }, 0)
    return () => window.clearTimeout(id)
  }, [externalValue, isDragging, isEditing])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      document.body.style.cursor = 'default'
    }
  }, [isDragging])

  const clamp = useCallback(
    (n: number) => {
      const lo = min ?? -Infinity
      const hi = max ?? Infinity
      return Math.min(Math.max(lo, n), hi)
    },
    [min, max]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const dx = e.clientX - startPos.x
      const dy = startPos.y - e.clientY
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy

      const currentValue = startValue || 0

      const newValue = clamp(currentValue + Math.round(delta / 2))
      setTextValue(String(newValue))
      onChange?.({
        target: {
          name: name,
          value: newValue
        }
      })
    },
    [isDragging, startPos, startValue, clamp, name, onChange]
  )

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
    const parsed = Number(textValue)
    setStartValue(Number.isFinite(parsed) ? parsed : 0)
    document.body.style.cursor = 'move'
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = e.target.value
    setTextValue(nextText)

    // While blank, the internal value should be zero.
    if (nextText.trim() === '') {
      onChange?.({ target: { name, value: 0 } })
      return
    }

    const parsed = Number(nextText)
    if (!Number.isFinite(parsed)) return
    onChange?.({ target: { name, value: clamp(parsed) } })
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (textValue.trim() === '') {
      setTextValue('0')
      onChange?.({ target: { name, value: 0 } })
      return
    }

    const parsed = Number(textValue)
    if (!Number.isFinite(parsed)) {
      setTextValue('0')
      onChange?.({ target: { name, value: 0 } })
      return
    }

    const clamped = clamp(parsed)
    setTextValue(String(clamped))
    onChange?.({ target: { name, value: clamped } })
  }

  return (
    <div className="relative inline-block">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        name={name}
        value={textValue}
        onChange={handleInputChange}
        onMouseDown={handleMouseDown}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        placeholder="--"
        className={cn(
          `bg-card rounded-lg pl-2 border-2 cursor-move text-foreground text-sm h-8`,
          className,
          textValue.trim() === '' ? 'text-center' : ''
        )}
      />
      {isDragging && <div className="fixed inset-0 z-50 cursor-move" />}
    </div>
  )
}
