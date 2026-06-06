import { cn } from '@/lib/utils'
import { useVehicle } from '@libs/stores/vehicle'
import { gpsFixLabel, gpsFixQuality } from '@libs/vehicle/gps'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

export default function TelemetryTable() {
  return (
    <div className="overflow-x-auto max-w-full">
      <table className="table-fixed w-full">
        <tbody>
          <tr>
            <td className="p-1">Airspeed</td>
            <Airspeed />

            <td className="p-1">Altitude</td>
            <Altitude />

            <td className="p-1">Heading</td>
            <Heading />
          </tr>

          <tr>
            <td className="p-1">Groundspeed</td>
            <GroundSpeed />
            <td className="p-1">Batt Voltage</td>
            <BattVoltage />
            <td className="p-1">Relative Alt</td>
            <RelativeAlt />
          </tr>

          <tr>
            <td className="p-1">Throttle</td>
            <Throttle />
          </tr>

          <tr>
            <td className="p-1">GPS Fix Type</td>
            <GpsFix />
            <td className="p-1">GPS Satellites</td>
            <GpsSatellites />
            <td className="p-1">GPS HDOP</td>
            <GpsHdop />
          </tr>

          <tr>
            <td className="p-1">Vehicle Mode</td>
            <VehicleMode />
            <td className="p-1">Armed State:</td>
            <ArmedStatus />
            <td className="p-1">Climb</td>
            <Climb />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Airspeed() {
  const airspeedValue = useVehicle((v) => v.airspeed)

  return (
    <>
      <td className="p-1">{airspeedValue !== null ? `${Math.round(airspeedValue)}m/s` : '-'}</td>
    </>
  )
}

function Altitude() {
  const altitude = useVehicle((v) => v.alt)

  return (
    <>
      <td className="p-1">{altitude !== null ? `${Math.round(altitude)}m` : '-'}</td>
    </>
  )
}

function Heading() {
  const heading = useVehicle((v) => v.heading)

  return (
    <>
      <td className="p-1">
        <span className="inline-block w-10 text-center">
          {heading !== null ? Math.round(heading) : '-'}&deg;
        </span>
        <ArrowUp
          className="inline-block w-4 h-4"
          style={{
            transform: `rotate(${Math.round(heading || 0)}deg)`,
            transition: `transform 0.5s ease`
          }}
        />
      </td>
    </>
  )
}

function GroundSpeed() {
  const groundSpeed = useVehicle((v) => v.groundspeed)

  return <td className="p-1">{groundSpeed !== null ? `${Math.round(groundSpeed)}m/s` : '-'} </td>
}

function BattVoltage() {
  const voltage = useVehicle((v) => v.batteryVoltage)

  return <td className="p-1">{voltage !== null ? `${voltage.toFixed(2)}v` : '-'}</td>
}

function RelativeAlt() {
  const relativeAlt = useVehicle((v) => v.relativeAlt)
  const weightedRelative = (relativeAlt || 0.1) / 10

  return (
    <>
      <td className="p-1">
        {weightedRelative !== null ? `${Math.round(weightedRelative)}m` : '-'}
        <ClimbArrow />
      </td>
    </>
  )
}

function Throttle() {
  const throttle = useVehicle((v) => v.throttle)

  if (throttle != null) {
    if (throttle === 0) {
      return (
        <td colSpan={5}>
          <div className="w-full bg-neutral-quaternary rounded-full">
            <span className="text-white">{throttle}%</span>
          </div>
        </td>
      )
    } else {
      return (
        <td colSpan={5}>
          <div className="w-full bg-neutral-quaternary rounded-full">
            <div
              className="bg-blue-900 text-xs font-medium text-white text-center p-0.5 leading-none rounded-full h-4 flex items-center justify-center"
              style={{ width: `${throttle}%`, transition: `width 1s linear` }}
            >
              {' '}
              {throttle}%
            </div>
          </div>
        </td>
      )
    }
  }

  return (
    <td colSpan={5}>
      <div className="w-full bg-neutral-quaternary rounded-full">
        <div
          className="bg-blue-900 text-xs font-medium text-foreground text-center p-0.5 leading-none rounded-full h-4 flex items-center justify-center"
          style={{ width: `${throttle}%`, transition: `width 1s linear` }}
        >
          {' '}
          {throttle}%
        </div>
      </div>
    </td>
  )
}

function GpsFix() {
  const gpsFixType = useVehicle((v) => v.gpsFixType)
  const quality = gpsFixType !== null ? gpsFixQuality(gpsFixType) : 'none'

  return (
    <td
      className={cn(
        'p-1',
        quality === 'none'
          ? 'text-red-400'
          : quality === 'poor'
            ? 'text-orange-400'
            : 'text-green-400'
      )}
    >
      {gpsFixType !== null ? gpsFixLabel(gpsFixType) : 'Unknown'}
    </td>
  )
}

function GpsSatellites() {
  const gpsSatellites = useVehicle((v) => v.gpsSatellites)
  return <td className="p-1">{gpsSatellites !== null ? Math.round(gpsSatellites) : '-'}</td>
}

function GpsHdop() {
  const hdop = useVehicle((v) => v.hdop)
  return <td className="p-1">{hdop !== null ? `${hdop / 100}` : '-'}</td>
}

// function BatteryRemaining() {
//     const batteryRemaining = useVehicle((v) => v.batteryRemaining)
//     return <td className="p-1">{batteryRemaining !== null ? `${batteryRemaining}s` : '-'}</td>
//}

function VehicleMode() {
  const mode = useVehicle((v) => v.mode)

  return <td className="p-1">{mode ?? ''}</td>
}

function ArmedStatus() {
  const isArmed = useVehicle((v) => v.isArmed)

  let isArmedText = ''

  if (isArmedText !== null) {
    if (isArmed) {
      isArmedText = 'Armed'
    } else {
      isArmedText = 'Disarmed'
    }
  } else {
    isArmedText = 'May be armed'
  }

  return <td className={cn('p-1', isArmed ? 'text-red-400' : 'text-green-400')}>{isArmedText}</td>
}

function Climb() {
  const climb = useVehicle((v) => v.climb)

  return (
    <td className="p-1">
      <span className="inline">{climb !== null ? `${climb.toFixed(2)}m/s` : '-'}</span>{' '}
      <ClimbArrow />
    </td>
  )
}

function ClimbArrow() {
  const climb = useVehicle((v) => v.climb)

  if (climb) {
    const roundedClimb = parseFloat(climb.toFixed(2))

    if (roundedClimb === 0) {
      return <Minus className="inline w-4 h-4" />
    } else if (roundedClimb > 0) {
      return <ArrowUp className="inline w-4 h-4" />
    } else {
      return <ArrowDown className="inline w-4 h-4" />
    }
  }
}
