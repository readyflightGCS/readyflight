import { cn } from '@/lib/utils'
import { useEditor } from '@libs/stores/configurator'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

export default function SidePanel({
  children,
  className
}: {
  children?: ReactNode
  className?: string
}) {
  const sidePanelOpen = useEditor((state) => state.sidePanelOpen)
  const setSidePanelOpen = useEditor((state) => state.setSidePanelOpen)

  return (
    <div className="absolute top-0 left-0 bottom-0 flex items-center z-10 pointer-events-none">
      {sidePanelOpen ? (
        <div className={cn('h-full bg-background p-2 w-60 pointer-events-auto', className)}>
          {children}
        </div>
      ) : null}

      <button
        className="h-12 w-6 bg-background rounded-r-md pointer-events-auto flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150 shadow-sm"
        onClick={() => setSidePanelOpen(!sidePanelOpen)}
      >
        {sidePanelOpen ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
      </button>
    </div>
  )
}
