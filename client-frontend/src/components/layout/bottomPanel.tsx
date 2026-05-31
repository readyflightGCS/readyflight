import { cn } from '@/lib/utils'
import { useEditor } from '@libs/stores/configurator'
import { ReactNode } from 'react'
export default function BottomPanel({ children, actionBump }: { children?: ReactNode, actionBump?: ReactNode }) {
  const sidePanelOpen = useEditor(s => s.sidePanelOpen)

  return (
    <div className={cn(`absolute bottom-0 left-0 w-full z-20 flex justify-center mb-4`)}>
      <div className={cn(`pb-2 w-fit transition-all duration-300`, sidePanelOpen ? 'pl-60' : '')}>
        {actionBump !== undefined ? (
          <div className="flex justify-center">
            <svg height="32" width="43">
              <path d=" M 43 0 C 27 0, 16 32, 0 32 L 43 32 Z " fill="var(--background)" />
            </svg>
            <div className="h-[32px] bg-background px-2 flex items-center">
              {actionBump}
            </div>
            <svg height="32" width="43">
              <path d="M 0 0 C 16 0, 27 32, 43 32 L 0 32 Z " fill="var(--background)" />
            </svg>
          </div>
        ) : null}
        <div className="h-60 w-fit p-2 bg-background rounded-lg">
          {children}
        </div>
      </div>
    </div >
  )
}
