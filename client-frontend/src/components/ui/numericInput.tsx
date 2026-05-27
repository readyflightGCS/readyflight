import { cn } from '@/lib/utils'
import { useState, useRef, useEffect, useCallback } from 'react'

interface NumericInputProps {
  value?: number | null
  name: string
  onChange?: (event: { target: { name: string; value: number; delta: number } }) => void
  className?: string
  min?: number | null
  max?: number | null
  step?: number | null
}

export default function NumericInput({
  value: externalValue = null,
  name,
  onChange,
  className = 'w-40',
  min = -Infinity,
  max = Infinity,
  step = 1
}: NumericInputProps) {
  const [textValue, setTextValue] = useState<string>(
    externalValue == null ? '' : String(externalValue)
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // The numeric value most recently emitted (or last synced from the parent).
  // `delta` on each onChange is computed as newValue - lastValueRef.current,
  // so callers that apply `cmd.params += delta` always see the incremental change.
  const lastValueRef = useRef<number>(externalValue ?? 0)

  const dragRef = useRef<{ startX: number; startY: number; startValue: number } | null>(null)

  // Sync the editable buffer to the external value when the user isn't
  // actively editing or dragging.
  useEffect(() => {
    if (isEditing || isDragging) return
    const next = externalValue == null ? '' : String(externalValue)
    /* eslint-disable */
    setTextValue((prev) => (prev === next ? prev : next))
    lastValueRef.current = externalValue ?? 0
  }, [externalValue, isEditing, isDragging])

  const clamp = useCallback(
    (n: number) => {
      const lo = min ?? -Infinity
      const hi = max ?? Infinity
      return Math.min(Math.max(lo, n), hi)
    },
    [min, max]
  )

  const emit = useCallback(
    (value: number) => {
      const delta = value - lastValueRef.current
      lastValueRef.current = value
      onChange?.({ target: { name, value, delta } })
    },
    [name, onChange]
  )

  // ---- Drag-to-scrub -------------------------------------------------------
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return

      const dx = e.clientX - d.startX
      const dy = d.startY - e.clientY
      const pixels = Math.abs(dx) > Math.abs(dy) ? dx : dy

      const s = step || 1
      const next = clamp(d.startValue + Math.round(pixels / 2) * s)

      if (next === lastValueRef.current) return
      setTextValue(String(next))
      emit(next)
    },
    [clamp, emit, step]
  )

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsDragging(false)
    document.body.style.cursor = 'default'
  }, [])

  useEffect(() => {
    if (!isDragging) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleMouseDown = (e: React.MouseEvent) => {
    const parsed = Number(textValue)
    const start = Number.isFinite(parsed) ? parsed : 0
    dragRef.current = { startX: e.clientX, startY: e.clientY, startValue: start }
    lastValueRef.current = start
    setIsDragging(true)
    document.body.style.cursor = 'move'
  }

  // ---- Typing --------------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setTextValue(next)

    if (next.trim() === '') return

    const parsed = Number(next)
    if (!Number.isFinite(parsed)) return

    const clamped = clamp(parsed)
    if (clamped === lastValueRef.current) return
    emit(clamped)
  }

  const handleBlur = () => {
    setIsEditing(false)

    let final: number
    if (textValue.trim() === '') {
      final = 0
    } else {
      const parsed = Number(textValue)
      final = Number.isFinite(parsed) ? clamp(parsed) : 0
    }

    setTextValue(String(final))
    if (final !== lastValueRef.current) emit(final)
  }

  return (
    <>
      <input
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
          'relative inline-block bg-card rounded-lg pl-2 border-2 cursor-move text-foreground text-sm h-8',
          className,
          textValue.trim() === '' ? 'text-center' : ''
        )}
      />
      {isDragging && <div className="fixed inset-0 z-50 cursor-move" />}
    </>
  )
}
