import { useRef, useState, useEffect, ReactNode } from 'react'

export function ResponsiveIndicator({ children }: { children: (size: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(115)

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize(Math.min(width, height))
    })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full h-full flex items-center justify-center">
      {children(size)}
    </div>
  )
}
