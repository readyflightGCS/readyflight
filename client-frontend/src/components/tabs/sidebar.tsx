import { cn } from '@/lib/utils'
import { useEditor } from '@libs/stores/configurator'
import { LucideIcon } from 'lucide-react'
import { Fragment } from 'react'
import { tabRegistry } from './tabRegistry'

export default function SideBar() {
  const currentTab = useEditor((state) => state.currentTab)
  const setTab = useEditor((state) => state.setTab)

  return (
    <div className="flex flex-col h-full bg-muted shrink-0 w-14 py-2 gap-1">
      {tabRegistry.map((tab) => (
        <Fragment key={tab.name}>
          {tab.name === 'Settings' ? <div className="flex-grow" /> : null}
          <Item
            name={tab.name}
            Icon={tab.Icon}
            active={tab.name == currentTab}
            onClick={() => setTab(tab.name)}
          />
        </Fragment>
      ))}
    </div>
  )
}

function Item({
  name,
  Icon,
  onClick,
  active
}: {
  name: string
  Icon: LucideIcon
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      name={name}
      onMouseDown={onClick}
      className={cn(
        'flex items-center justify-center w-full aspect-square rounded-lg transition-colors duration-150',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
      )}
    >
      <Icon className="size-8" />
    </button>
  )
}
