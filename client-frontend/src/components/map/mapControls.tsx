import { Crosshair, Eye, Minus, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { mapElements, useRFMap } from '@libs/stores/map'
import { capitalise } from '@libs/util/text'
import { useVehicle } from '@libs/stores/vehicle'

export default function MapControls() {
  const { mapRef, viewable, setViewable } = useRFMap()
  const { connected, lat, lon } = useVehicle()

  const centerOnVehicle = () => {
    if (lat != null && lon != null) {
      mapRef?.current?.setView([lat, lon])
    }
  }

  const toggle = (name: (typeof mapElements)[number]) => {
    setViewable({ ...viewable, [name]: !viewable[name] })
  }

  return (
    <div className="w-fit rounded-lg shadow-lg bg-card flex p-1 absolute top-4 right-4 z-2">
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
      <span
        className={`rounded-lg p-1 ${connected && lat != null ? 'cursor-pointer hover:bg-muted' : 'opacity-30 cursor-not-allowed'}`}
        onClick={centerOnVehicle}
        title="Center on UAV"
      >
        <Crosshair className="h-5 w-5" />
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
