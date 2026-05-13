import { AttitudeIndicator, HeadingIndicator, Airspeed, Altimeter, Variometer, TurnCoordinator } from 'react-typescript-flight-indicators'

import { useVehicle } from '@libs/stores/vehicle'
import { ResponsiveIndicator } from './responsiveIndicator'

export default function TelemetryIndicators() {
  const [airspeed, heading, pitch, roll, relativeAltitude, climb, ssa] = useVehicle((v) => [
    v.airspeed,
    v.heading,
    v.pitch,
    v.roll,
    v.relativeAlt,
    v.climb,
    v.SSA
  ])

  return (
    <div className="grid grid-cols-3 gap-2 w-full h-full">
        <ResponsiveIndicator>
            {(size) => (
                <Airspeed
                speed={airspeed || 0}
                size={size}
                showBox={false}
                />
            )}
        </ResponsiveIndicator>

        <ResponsiveIndicator>
            {(size) => (
                <HeadingIndicator
                heading={heading || 0}
                size={size}
                showBox={false}
                />
            )}
        </ResponsiveIndicator>

        <ResponsiveIndicator>
            {(size) => (
                <AttitudeIndicator
                pitch={pitch || 0}
                roll={roll || 0}
                size={size}
                showBox={false}
                />
            )}
        </ResponsiveIndicator>

        <ResponsiveIndicator>
            {(size) => (
            <Altimeter
                altitude={relativeAltitude * 10 || 0}
                size={size}
                showBox={false}
            />
            )}
      </ResponsiveIndicator>

        <ResponsiveIndicator>
            {(size) => (
                <Variometer
                vario={climb * 40 || 0}
                size={size}
                showBox={false}
                />
            )}
        </ResponsiveIndicator>

        <ResponsiveIndicator>
            {(size) => (
            <TurnCoordinator
                turn={ssa || 0}
                size={size}
                showBox={false}
            />
            )}
      </ResponsiveIndicator>
    </div>
  )
}
