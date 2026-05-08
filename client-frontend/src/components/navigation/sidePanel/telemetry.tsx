import { Button } from '@/components/ui/button'
import { useVehicle } from '@libs/stores/vehicle'
import { PlaneMode } from '@libs/mission/ardupilot/mavlink-assets/enums/plane-mode'
import ConnectionsPanel from '@/components/telemetry/ConnectionsPanel'
import { BicepsFlexed } from 'lucide-react'
import { CopterMode } from '@libs/mission/ardupilot/mavlink-assets/enums/copter-mode'

export default function Telemetry() {
  const [sendMessage] = useVehicle((v) => [
    v.sendMessage
  ])
  return (
    <div className="flex flex-col gap-3">
      <ConnectionsPanel />

      <div className="flex flex-col gap-1">
        {/* <div>{connected ? 'UAV Connected' : 'UAV Not Connected'}</div> */}
        <UavConnectedIndicator/>
      </div>

      <div className="flex flex-col gap-1">
        {/* <Button
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
        </Button> */}

        <ArmButton/>
        <DisarmButton/>
        <Button
          onClick={() => sendMessage?.({ type: 'setMode', mode: CopterMode.COPTER_MODE_GUIDED })}
        >
          Guided
        </Button>
        <Button onClick={() => sendMessage?.({ type: 'setMode', mode: CopterMode.COPTER_MODE_AUTO })}>
          Auto
        </Button>
        <Button
          onClick={() => sendMessage?.({ type: 'setMode', mode: CopterMode.COPTER_MODE_ACRO })}
        >
          Manual
        </Button>
        <Button
          onClick={() => sendMessage?.({ type: 'setMode', mode: CopterMode.COPTER_MODE_LAND })}
        >
          Land
        </Button>
        
        <Button
          onClick={() => sendMessage?.({ type: 'launch', height: 10 })}
        >
          Takeoff
        </Button>
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