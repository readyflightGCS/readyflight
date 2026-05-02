import { cn } from '@/lib/utils'
import { useVehicle } from '@libs/stores/vehicle'
import { CopterMode } from '@libs/mission/ardupilot/mavlink-assets/enums/copter-mode'
import { GpsFixType } from '@libs/mission/ardupilot/mavlink-assets/enums/gps-fix-type'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

export default function Telemetry() {
  const [
    alt,
    airspeed,
    heading,
    groundspeed,
    voltage,
    throttle,
    relativealt,
    gpsfixtype,
    hdop,
    batteryremaining,
    mode,
    isarmed,
    climb
  ] = useVehicle((v) => [
    v.alt,
    v.airspeed,
    v.heading,
    v.groundspeed,
    v.batteryVoltage,
    v.throttle,
    v.relativeAlt,
    v.gpsFixType,
    v.hdop,
    v.batteryRemaining,
    v.mode,
    v.isArmed,
    v.climb
  ])

  const weightedRelative = (relativealt || 0.1) / 10

  let isarmedText = ''

  if (isarmed !== null) {
    if (isarmed) {
      isarmedText = 'Armed'
    } else {
      isarmedText = 'Disarmed'
    }
  } else {
    isarmedText = 'May be armed'
  }

  let arrowName

  if (climb) {
    const roundedClimb = Math.round(climb)

    if (roundedClimb === 0) {
      arrowName = <Minus className="inline" />
    } else if (roundedClimb > 0) {
      arrowName = <ArrowUp className="inline" />
    } else {
      arrowName = <ArrowDown className="inline" />
    }
  }

  return (
    <div className="w-4xl flex justify-center">
      {/* //<Airspeed speed={airspeed || 0} showBox={false} /> */}
      {/* //<HeadingIndicator heading={heading || 0} showBox={false} /> */}
      {/* <Altimeter altitude={alt || 0} showBox={false}/> */}

      <table>
        <tbody>
          <tr>
            <td className="p-1">Airspeed</td>
            <td className="p-1">{airspeed !== null ? `${Math.round(airspeed)}m/s` : '-'}</td>
            <td className="p-1">Altitude</td>
            <td className="p-1">{alt !== null ? `${Math.round(alt)}m` : '-'}</td>
            <td className="p-1">Heading</td>
            <td className="p-1">
              <span className="inline">{heading !== null ? Math.round(heading) : '-'}&deg;</span>
              <ArrowUp
                className="inline"
                style={{
                  transform: `rotate(${Math.round(heading || 0)}deg)`,
                  transition: `transform 0.5s ease`
                }}
              />
            </td>
          </tr>

          <tr>
            <td className="p-1">Groundspeed</td>
            <td className="p-1">{groundspeed !== null ? `${Math.round(groundspeed)}m/s` : '-'} </td>
            <td className="p-1">Batt Voltage</td>
            <td className="p-1">{voltage !== null ? `${Math.round(voltage)}v` : '-'}</td>
            <td className="p-1">Relative Alt</td>
            <td className="p-1">
              {weightedRelative !== null ? `${Math.round(weightedRelative)}m` : '-'}
            </td>
          </tr>

          <tr>
            <td className="p-1">Throttle</td>
            <td colSpan={5}>
              {/* <progress value={throttle || 0} max={100}>{throttle}</progress> */}

              <div className="w-full bg-neutral-quaternary rounded-full">
                <div
                  className="bg-violet-600 text-xs font-medium text-white text-center p-0.5 leading-none rounded-full h-4 flex items-center justify-center"
                  style={{ width: `${throttle}%`, transition: `width 1s linear` }}
                >
                  {' '}
                  {throttle}%
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-1">GPS Fix Type</td>
            <td
              className={cn(
                'p-1',
                gpsfixtype !== null
                  ? gpsfixtype <= 1
                    ? 'text-red-400'
                    : gpsfixtype <= 3
                      ? 'text-orange-400'
                      : 'text-green-400'
                  : 'text-red-400'
              )}
            >
              {GpsFixType[gpsfixtype || 0]}
            </td>
            <td className="p-1">GPS Satellites</td>
            <td className="p-1">{alt !== null ? Math.round(alt) : '-'}</td>
            <td className="p-1">GPS HDOP</td>
            <td className="p-1">{hdop !== null ? `${Math.round(hdop)}m` : '-'}</td>
          </tr>

          <tr>
            <td className="p-1">Battery remaining</td>
            <td className="p-1">{batteryremaining !== null ? `${batteryremaining}s` : '-'}</td>
            <td className="p-1">Vehicle Mode</td>
            <td className="p-1">{CopterMode[mode || 0]}</td>
            <td className="p-1">Armed State:</td>
            <td className={cn('p-1', isarmed ? 'text-red-400' : 'text-green-400')}>
              {isarmedText}
            </td>
          </tr>

          <tr>
            <td className="p-1">Climb</td>
            <td className="p-1">
              <span className="inline">{climb !== null ? `${climb.toFixed(2)}m/s` : '-'}</span>{' '}
              {arrowName}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
