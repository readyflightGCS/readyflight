import { Button } from '@/components/ui/button'
import { useVehicle } from '@libs/stores/vehicle'
import { useDialect } from '@libs/stores/dialect'
import ConnectionsPanel from '@/components/telemetry/ConnectionsPanel'
import { rfIconMap } from '@/lib/rfIcons'
import SidePanelSection from '@/components/ui/sidePanelSection'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function TelemetrySidePanel() {
  return (
    <div className="flex flex-col gap-3">
      <ConnectionsPanel />
      <ArmDisarmSection />
      <FlightModesSection />
      <ActionsSection />
    </div>
  )
}

function ArmDisarmSection() {
  const isArmed = useVehicle((v) => v.isArmed)
  const sendMessage = useVehicle((v) => v.sendMessage)

  return (
    <SidePanelSection title="Arm / Disarm">
      <p className="text-muted-foreground text-xs">
        Arming enables the motors. Ensure the area around the vehicle is clear before proceeding.
      </p>
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={isArmed === true} className="flex-1">
              Arm
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Arm the vehicle?</DialogTitle>
              <DialogDescription>
                This will enable the motors immediately. Keep well clear of the propellers and
                confirm the area around the vehicle is safe before proceeding.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="default">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={() => sendMessage?.({ type: 'arm' })}>
                  Arm vehicle
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          disabled={isArmed !== true}
          className="flex-1"
          onClick={() => sendMessage?.({ type: 'disarm' })}
        >
          Disarm
        </Button>
      </div>
    </SidePanelSection>
  )
}

function FlightModesSection() {
  const sendMessage = useVehicle((v) => v.sendMessage)
  const availableModes = useDialect((d) => d.activeDialect.availableModes)

  const primaryModes = availableModes.filter((m) => m.common)
  const secondaryModes = availableModes.filter((m) => !m.common)

  function setMode(modeId: string) {
    sendMessage?.({ type: 'setMode', mode: modeId })
  }

  return (
    <SidePanelSection title="Flight Modes">
      <div className="grid grid-cols-2">
        {primaryModes.map((mode) => {
          const IconComponent = mode.icon ? rfIconMap[mode.icon] : null
          return (
            <Button className="w-full" key={mode.id} onClick={() => setMode(mode.id)}>
              {IconComponent && <IconComponent />}
              {mode.label}
            </Button>
          )
        })}
      </div>

      {secondaryModes.length > 0 && (
        <Select value="" onValueChange={(id) => setMode(id)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="More modes..." />
          </SelectTrigger>
          <SelectContent>
            {secondaryModes.map((mode) => (
              <SelectItem key={mode.id} value={mode.id}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </SidePanelSection>
  )
}

function ActionsSection() {
  const triggerAction = useVehicle((v) => v.triggerAction)
  const actions = useDialect((d) => d.activeDialect.actions)

  if (actions.length === 0) return null

  return (
    <SidePanelSection title="Actions">
      <div className="flex flex-col gap-1">
        {actions.map((action) => {
          const IconComponent = action.icon ? rfIconMap[action.icon] : null
          return (
            <Button className="w-full" key={action.id} onClick={() => triggerAction?.(action.id)}>
              {IconComponent && <IconComponent />}
              {action.label}
            </Button>
          )
        })}
      </div>
    </SidePanelSection>
  )
}
