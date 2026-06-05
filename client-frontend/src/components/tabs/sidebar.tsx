import { cn } from '@/lib/utils'
import { useEditor } from '@libs/stores/configurator'
import { LucideIcon } from 'lucide-react'
import { Fragment } from 'react'
import { tabRegistry } from './tabRegistry'


export default function SideBar() {
  const currentTab = useEditor((state) => state.currentTab)
  const setTab = useEditor((state) => state.setTab)

  return (
    <div className="flex flex-col h-full bg-sidebar shrink-0 w-20">
      {tabRegistry.map((tab) => (
        <Fragment key={tab.name}>
          {
            // Make some space above settings to put it at the bottom
            tab.name === 'Settings' ?
              <div className="flex-grow" /> : null
          }
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

export function Item({
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
    <button name={name} className="p-2" onMouseDown={onClick}>
      <div className={cn('rounded-lg', active ? 'bg-foreground' : 'bg-background')}>
        <Icon className={cn('w-full h-full p-2', active ? 'text-accent' : 'text-foreground')} />
      </div>
    </button>
  )
}
