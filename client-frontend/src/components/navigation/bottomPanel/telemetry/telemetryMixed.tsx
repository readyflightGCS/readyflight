import {
  Airspeed,
  HeadingIndicator,
  AttitudeIndicator,
  Altimeter
} from 'react-typescript-flight-indicators'
import { ResponsiveIndicator } from './responsiveIndicator'
import { useVehicle } from '@libs/stores/vehicle'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

export default function TelemetryMixed() {
  return (
    <div className="grid grid-cols-2 gap-2 w-full h-full">
      <div className="row-span-2 grid grid-cols-2  w-full h-full">
        <AirspeedTelemetryIndicator />

        <HeadingTelemetryIndicator />

        <AttitudeTelemetryIndicator />

        <AltitudeTelemetryIndicator />
      </div>

      <div className=" row-span-2">
        <table className="table-fixed w-full">
          <tbody>
            <tr>
              <td>Airspeed : </td>
              <td>
                <AirspeedText />
              </td>

              <td>Rel Alt : </td>
              <td>
                <RelativeAltText />
              </td>
            </tr>

            <tr>
              <td>Heading : </td>
              <td>
                <HeadingText />
              </td>

              <td>Climb : </td>
              <td>
                <ClimbText />
              </td>
            </tr>

            <tr>
              <td>Throttle: </td>
              <td colSpan={3}>
                <ThrottleIndicator />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AirspeedText() {
  const airspeed = useVehicle((v) => v.airspeed)

  if (airspeed !== null) {
    return <>{Math.round(airspeed)}m</>
  } else {
    ; <>Unknown</>
  }
}

function RelativeAltText() {
  const relativeAlt = useVehicle((v) => v.relativeAlt)
  const weightedRelative = (relativeAlt || 0.1) / 10

  if (weightedRelative !== null) {
    return <>{Math.round(weightedRelative)}m</>
  } else {
    ; <>Unknown</>
  }
}

function HeadingText() {
  const heading = useVehicle((v) => v.heading)

  if (heading !== null) {
    return (
      <>
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
      </>
    )
  } else {
    ; <>Unknown</>
  }
}

function ClimbText() {
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

function ThrottleIndicator() {
  const throttle = useVehicle((v) => v.throttle)

  return (
    <>
      <div className="w-full bg-neutral-quaternary rounded-full">
        <div
          className="bg-blue-900 text-xs font-medium text-white text-center p-0.5 leading-none rounded-full h-4 flex items-center justify-center"
          style={{ width: `${throttle}%`, transition: `width 1s linear` }}
        >
          {' '}
          {throttle}%
        </div>
      </div>
    </>
  )
}

function AirspeedTelemetryIndicator() {
  const airspeed = useVehicle((v) => v.airspeed)

  return (
    <ResponsiveIndicator>
      {(size) => <Airspeed speed={airspeed} size={size} showBox={false} />}
    </ResponsiveIndicator>
  )
}

function HeadingTelemetryIndicator() {
  const heading = useVehicle((v) => v.heading)

  return (
    <ResponsiveIndicator>
      {(size) => <HeadingIndicator heading={heading} size={size} showBox={false} />}
    </ResponsiveIndicator>
  )
}

function AttitudeTelemetryIndicator() {
  const [pitch, roll] = useVehicle((v) => [v.pitch, v.roll])

  return (
    <ResponsiveIndicator>
      {(size) => <AttitudeIndicator pitch={pitch} roll={roll} size={size} showBox={false} />}
    </ResponsiveIndicator>
  )
}

function AltitudeTelemetryIndicator() {
  const altitude = useVehicle((v) => v.alt)

  return (
    <ResponsiveIndicator>
      {(size) => <Altimeter altitude={altitude * 10} size={size} showBox={false} />}
    </ResponsiveIndicator>
  )
}
