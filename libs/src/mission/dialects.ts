import { Dialect } from './dialect'
import { DialectCommandDescription } from '@libs/commands/command'
import { ardupilotCopter, ardupilotPlane } from './ardupilot/ardupilot'

/**
 * Static registry of all available dialects.
 * To add a new dialect, import it and append it to this array.
 * The first entry with id matching DEFAULT_DIALECT_ID is used as the default.
 */
export const dialects: Dialect<DialectCommandDescription>[] = [
  ardupilotPlane,
  ardupilotCopter
]

export const DEFAULT_DIALECT_ID = 'ardupilot-plane'
