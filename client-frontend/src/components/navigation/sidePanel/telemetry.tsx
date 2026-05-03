import { Button } from '@/components/ui/button'
import { useVehicle } from '@libs/stores/vehicle'
import { PlaneMode } from '@libs/mission/ardupilot/mavlink-assets/enums/plane-mode'
import ConnectionsPanel from '@/components/telemetry/ConnectionsPanel'
import { BicepsFlexed } from 'lucide-react'

export default function Telemetry() {
  const [connected, isArmed, sendMessage] = useVehicle((v) => [
    v.connected,
    v.isArmed,
    v.sendMessage
  ])
  return (
    <div className="flex flex-col gap-3">
      <ConnectionsPanel />

      <div className="flex flex-col gap-1">
        <div>{connected ? 'UAV Connected' : 'UAV Not Connected'}</div>
      </div>

      <div className="flex flex-col gap-1">
        <Button
          disabled={isArmed !== null ? (isArmed ? true : false) : false}
          className={isArmed !== null ? (isArmed ? 'text-red-400' : '') : ''}
          onClick={() => sendMessage?.({ type: 'arm' })}
        >
          <BicepsFlexed /> Arm
        </Button>
        <Button
          disabled={isArmed !== null ? (isArmed ? false : true) : false}
          className={isArmed !== null ? (isArmed ? '' : 'text-green-400') : ''}
          onClick={() => sendMessage?.({ type: 'disarm' })}
        >
          Disarm
        </Button>
        <Button
          onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_GUIDED })}
        >
          Guided
        </Button>
        <Button onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_AUTO })}>
          Auto
        </Button>
        <Button
          onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_MANUAL })}
        >
          Manual
        </Button>
        <Button
          onClick={() => sendMessage?.({ type: 'setMode', mode: PlaneMode.PLANE_MODE_TAKEOFF })}
        >
          Takeoff
        </Button>
      </div>
    </div>
  )
}
