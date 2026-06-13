import { DialectCommand } from '@libs/commands/command'
import { Mission } from '@libs/mission/mission'
import { mavCmdDescription } from './commands'
import { Result } from '@libs/util/try-catch'
import { Vehicle } from '@libs/vehicle/types'
import { Dialect } from '../dialect'

const QGC_HEADER = 'QGC WPL 110'

export async function importQGCWaypoints(
  blob: Blob,
  dialect: Dialect<(typeof mavCmdDescription)[number]>
): Promise<Result<{ mission: Mission<(typeof mavCmdDescription)[number]>; vehicle: Vehicle }>> {
  let text: string
  try {
    text = await blob.text()
  } catch (e) {
    return { data: null, error: e as Error }
  }

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  if (lines.length === 0 || lines[0] !== QGC_HEADER) {
    return { data: null, error: new Error('Not a valid QGC WPL 110 file') }
  }

  const commands: DialectCommand<(typeof mavCmdDescription)[number]>[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split('\t')
    if (fields.length < 12) {
      return { data: null, error: new Error(`Malformed waypoint line ${i + 1}: "${lines[i]}"`) }
    }

    const seq = parseInt(fields[0], 10)
    // seq 0 is the reference/home point — skip it
    if (seq === 0) continue

    const frame = parseInt(fields[2], 10)
    const cmdValue = parseInt(fields[3], 10)
    const paramValues = [
      parseFloat(fields[4]),
      parseFloat(fields[5]),
      parseFloat(fields[6]),
      parseFloat(fields[7]),
      parseFloat(fields[8]),
      parseFloat(fields[9]),
      parseFloat(fields[10])
    ]

    const cmdDesc = mavCmdDescription.find((x) => x.value === cmdValue)
    if (!cmdDesc) {
      return {
        data: null,
        error: new Error(`Unknown MAVLink command value ${cmdValue} on line ${i + 1}`)
      }
    }

    const params: Record<string, number> = {}
    cmdDesc.parameters.forEach((param, idx) => {
      if (param !== null) {
        params[param.label.toLowerCase()] = paramValues[idx] ?? 0
      }
    })

    commands.push({
      type: cmdDesc.type,
      frame,
      // @ts-ignore — params built dynamically from command description
      params
    } as DialectCommand<(typeof mavCmdDescription)[number]>)
  }

  const mission = new Mission(
    dialect,
    new Map([
      ['Main', commands],
      ['Geofence', []],
      ['Markers', []]
    ])
  )

  return {
    data: {
      mission,
      vehicle: { type: 'Copter' }
    },
    error: null
  }
}
