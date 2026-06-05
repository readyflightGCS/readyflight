import { cn } from '@/lib/utils'
import { useEditor } from '@libs/stores/configurator'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

export default function SidePanel({ children, className }: { children?: ReactNode, className?: string }) {
  const sidePanelOpen = useEditor((state) => state.sidePanelOpen)
  const setSidePanelOpen = useEditor((state) => state.setSidePanelOpen)

  return (
    <div className="absolute top-0 left-0 bottom-0 flex items-center z-10 pointer-events-none">
      {sidePanelOpen ? (
        <div className={cn("h-full bg-background p-2 w-60 pointer-events-auto", className)}>
          {children}
        </div>
      ) : null}

      <button
        className="h-14 w-8 bg-background rounded-r-lg pointer-events-auto"
        onClick={() => setSidePanelOpen(!sidePanelOpen)}
      >
        {sidePanelOpen ? <ArrowLeft /> : <ArrowRight />}
      </button>
    </div>
  )
}
