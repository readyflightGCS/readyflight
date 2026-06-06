import { Button } from '@/components/ui/button'
import { useVehicle } from '@libs/stores/vehicle'
import { useDialect } from '@libs/stores/dialect'
import ConnectionsPanel from '@/components/telemetry/ConnectionsPanel'
import { BicepsFlexed } from 'lucide-react'
import { rfIconMap } from '@/lib/rfIcons'

export default function TelemetrySidePanel() {
  const [sendMessage] = useVehicle((v) => [v.sendMessage])
  const availableModes = useDialect((d) => d.activeDialect.availableModes)

  const commonModes = availableModes.filter((m) => m.common)

  return (
    <div className="flex flex-col gap-3">
      <ConnectionsPanel />

      <div className="flex flex-col gap-1">
        <UavConnectedIndicator />
      </div>

      <div className="flex flex-col gap-1">
        <ArmButton />
        <DisarmButton />

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

function UavConnectedIndicator() {
  const connected = useVehicle((v) => v.connected)

  return <div>{connected ? 'UAV Connected' : 'UAV Not Connected'}</div>
}

function ArmButton() {
  const [isArmed, sendMessage] = useVehicle((v) => [v.isArmed, v.sendMessage])

  return (
    <>
      <Button
        disabled={isArmed !== null ? (isArmed ? true : false) : false}
        className={isArmed !== null ? (isArmed ? 'text-red-400' : '') : ''}
        onClick={() => sendMessage?.({ type: 'arm' })}
      >
        <BicepsFlexed /> Arm
      </Button>
    </>
  )
}

function DisarmButton() {
  const [isArmed, sendMessage] = useVehicle((v) => [v.isArmed, v.sendMessage])

  return (
    <>
      <Button
        disabled={isArmed !== null ? (isArmed ? false : true) : false}
        className={isArmed !== null ? (isArmed ? '' : 'text-green-400') : ''}
        onClick={() => sendMessage?.({ type: 'disarm' })}
      >
        Disarm
      </Button>
    </>
  )
}
