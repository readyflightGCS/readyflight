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

export default function TelemetrySidePanel() {
  const [sendMessage] = useVehicle((v) => [v.sendMessage])
  const availableModes = useDialect((d) => d.activeDialect.availableModes)

  const commonModes = availableModes.filter((m) => m.common)

  return (
    <div className="flex flex-col gap-3">
      <ConnectionsPanel />

      <div className="flex flex-col gap-1">
        <ArmDisarmSection />

        {commonModes.map((mode) => {
          const IconComponent = mode.icon ? rfIconMap[mode.icon] : null
          return (
            <Button key={mode.id} onClick={() => sendMessage?.({ type: 'setMode', mode: mode.id })}>
              {IconComponent && <IconComponent />}
              {mode.label}
            </Button>
          )
        })}

        <Button onClick={() => sendMessage?.({ type: 'launch', height: 10 })}>Takeoff</Button>
      </div>
    </div>
  )
}

function ArmDisarmSection() {
  const [isArmed, sendMessage] = useVehicle((v) => [v.isArmed, v.sendMessage])

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

        <Button disabled={isArmed !== true} className="flex-1" onClick={() => sendMessage?.({ type: 'disarm' })}>
          Disarm
        </Button>
      </div>
    </SidePanelSection>
  )
}
