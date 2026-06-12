import { Mission } from './mission'
import { LatLng, LatLngAlt } from '@libs/world/latlng'
import {
  DialectCommand,
  DialectCommandDescription,
  MissionCommand,
  RFCommand
} from '@libs/commands/command'
import { Result } from '@libs/util/try-catch'
import { Vehicle } from '@libs/vehicle/types'
import { VehicleCommand } from '@libs/vehicle/commands'
import { VehicleState } from '@libs/vehicle/state'

/** Per-connection stateful runtime for a dialect. Owns the stream parser,
 *  upload handshake, and heartbeat timers for one vehicle connection. */
export type ITelemetrySession = {
  /** Process an incoming binary frame. Returns any state fields that changed. */
  handleTelemetryMessage(data: Uint8Array): Partial<VehicleState>
  /** Encode and send a vehicle command over the captured sendPacket. */
  handleSendTelemetryMessage(msg: VehicleCommand): void
  /** Begin the mission upload for a given mission. */
  uploadMission(mission: Mission<DialectCommandDescription>): void
  /** Cancel all timers and release resources. Call on disconnect. */
  destroy(): void
}

/**
 * Represents a dialect—i.e., a specific command language or format—that can
 * convert missions into dialect‑specific commands, provide metadata about
 * those commands, and import/export mission files.
 *
 * @template CD - The command description type supported by this dialect.
 */

export type Dialect<CD extends DialectCommandDescription> = {
  /**
   * Human readable name of the dialect
   */
  name: string

  /**
   * Convert a mission into a lsit of dialect specific commands.
   *
   * @param mission - The mission to convert
   * @returns An array of dialect commands
   */
  convert: (mission: Mission<CD>) => DialectCommand<CD>[] // idk if we'll need something like this ?? maybe just another format but with an "internal" flag

  /**
   * A lookup table indicating which RF command types this dialect supports
   * Keys are RFCommand types; values as booleans
   */
  supportedRFCommands: { [K in RFCommand['type']]: boolean }

  /**
   * The command description definitions supported by this dialect
   */
  commandDescriptions: CD[]

  /**
   * Retrieves the geographic location (lat/lng) associated with a command,
   * if the command has one
   *
   * @param command - The dialect command
   * @returns A LatLng or null if the command has no location
   */
  getCommandLocation: (command: MissionCommand<CD>) => LatLng | null

  /**
   * Retrieves the geographic location including altitude associated with a command,
   * if the command has one.
   *
   * @param command - The dialect command
   * @returns A LatLngAlt or null if the command has no altitude data
   */
  getCommandLocationAlt: (command: MissionCommand<CD>) => LatLngAlt | null

  /**
   * Produces a human readable label for a command
   *
   * @param command The dialect command
   * @returns A string label
   */
  getCommandLabel: (command: DialectCommand<CD>) => string

  /**
   * File formats that this dialect can import and export.
   * Each format defines its own import/export handlers
   */
  fileFormats: {
    name: string
    id: string
    export?: (mission: Mission<CD>, vehicle: Vehicle) => Result<Blob> //notably this takes a mission as we want to preseve as much info as possible when converting
    import?: (mission: Blob) => Promise<Result<{ mission: Mission<CD>; vehicle: Vehicle }>>
    ext: string
  }[]

  /** Create a new per-connection session. sendPacket is captured for the
   *  session's lifetime; onPatch is called for async state changes (e.g.
   *  heartbeat loss) that cannot be returned from handleTelemetryMessage. */
  createSession: (
    sendPacket: (buf: ArrayBuffer) => void,
    onPatch: (patch: Partial<VehicleState>) => void
  ) => ITelemetrySession
}
