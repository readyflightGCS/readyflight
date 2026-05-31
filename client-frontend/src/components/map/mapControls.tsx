import { Eye, Minus, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { mapElements, useRFMap } from '@libs/stores/map'
import { capitalise } from '@libs/util/text'

export default function MapControls() {
  const { mapRef, viewable, setViewable } = useRFMap()

  const toggle = (name: (typeof mapElements)[number]) => {
    setViewable({ ...viewable, [name]: !viewable[name] })
  }

  return (
    <div className="w-fit rounded-lg shadow-lg bg-card flex p-1">
      <span
        className="cursor-pointer hover:bg-muted rounded-lg p-1"
        onClick={() => mapRef?.current?.zoomIn()}
      >
        <Plus className="h-5 w-5" />
      </span>
      <span
        className="cursor-pointer hover:bg-muted rounded-lg p-1"
        onClick={() => mapRef?.current?.zoomOut()}
      >
        <Minus className="h-5 w-5" />
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer hover:bg-muted rounded-lg p-1">
          <Eye className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {mapElements.map((element, i) => (
            <DropdownMenuCheckboxItem
              key={i}
              checked={viewable[element]}
              onCheckedChange={() => toggle(element)}
            >
              {capitalise(element)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
