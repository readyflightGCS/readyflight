import { convertArdupilot, exportQGCWaypoints, MAV2MAVparam, MavCommand } from './export'
import { importQGCWaypoints } from './import'
import { Dialect } from '../dialect'
import { mavCmdDescription } from './commands'
import { exportRFJSON1 } from '../format/readyflight/json1/export'
import { importRFJSON1 } from '../format/readyflight/json1/import'
import { decodePacket } from './mavlink-decoder'
import { encodePacket } from './mavlink-encoder'
import { Attitude } from './mavlink-assets/messages/attitude'
import { GlobalPositionInt } from './mavlink-assets/messages/global-position-int'
import { GpsRawInt } from './mavlink-assets/messages/gps-raw-int'
import { Statustext } from './mavlink-assets/messages/statustext'
import { VfrHud } from './mavlink-assets/messages/vfr-hud'
import { rad2deg } from '@libs/math/geometry'
import { Wind } from './mavlink-assets/messages/wind'
import { BatteryStatus } from './mavlink-assets/messages/battery-status'
import { AoaSsa } from './mavlink-assets/messages/aoa-ssa'
import { MissionCurrent } from './mavlink-assets/messages/mission-current'
import { NavControllerOutput } from './mavlink-assets/messages/nav-controller-output'
import { EkfStatusReport } from './mavlink-assets/messages/ekf-status-report'
import { CommandLong } from './mavlink-assets/messages/command-long'
import { SetMode } from './mavlink-assets/messages/set-mode'
import { MissionCount } from './mavlink-assets/messages/mission-count'
import { MissionItemInt } from './mavlink-assets/messages/mission-item-int'
import { MissionRequest } from './mavlink-assets/messages/mission-request'
import { MissionRequestInt } from './mavlink-assets/messages/mission-request-int'
import { MissionAck } from './mavlink-assets/messages/mission-ack'
import { MavCmd } from './mavlink-assets/enums/mav-cmd'
import { MavModeFlag } from './mavlink-assets/enums/mav-mode-flag'
import { MavMode } from './mavlink-assets/enums/mav-mode'
import { MavMissionType } from './mavlink-assets/enums/mav-mission-type'
import { makeCommand } from '@libs/commands/helpers'
import { Mission } from '../mission'
import { Heartbeat } from './mavlink-assets/messages/heartbeat'
import { RequestDataStream } from './mavlink-assets/messages/request-data-stream'
import { MavLinkStreamParser } from './mavlink-stream-parser'
import { VehicleState } from '@libs/vehicle/state'
import { toast } from 'sonner'
import { getSeverityName } from './mavlink-assets/enums/mav-message-severity'
import { objectKeys } from '@libs/util/types'
import { ITelemetrySession } from '../dialect'
import { VehicleCommand } from '@libs/vehicle/commands'

// Deduplication window for React StrictMode / brief double-connection: the
// backend broadcasts one MISSION_REQUEST to all WebSocket subscribers, so two
// clients can both respond. Suppress the same seq within this window.
const DEDUP_MS = 100

function buildMissionItemInt(item: MavCommand, seq: number): MissionItemInt {
  const msg = new MissionItemInt(0, 0)
  msg.target_system = 1
  msg.target_component = 1
  msg.seq = seq
  msg.frame = item.frame
  msg.command = item.type as unknown as MavCmd
  msg.current = seq === 0 ? 1 : 0
  msg.autocontinue = item.autocontinue
  msg.param1 = item.param1
  msg.param2 = item.param2
  msg.param3 = item.param3
  msg.param4 = item.param4
  msg.x = Math.round(item.param5 * 1e7) // lat → int32 (deg * 1e7)
  msg.y = Math.round(item.param6 * 1e7) // lon → int32 (deg * 1e7)
  msg.z = item.param7 // alt stays as float
  return msg
}

class ArduPilotSession implements ITelemetrySession {
  private streamParser = new MavLinkStreamParser()
  private pendingUpload: MavCommand[] | null = null
  private dedupSeq = -1
  private dedupTime = 0
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null
  private connected = false

  constructor(
    private readonly sendPacket: (buf: ArrayBuffer) => void,
    private readonly onPatch: (patch: Partial<VehicleState>) => void
  ) { }

  handleTelemetryMessage(data: Uint8Array): Partial<VehicleState> {
    const patch: Partial<VehicleState> = {}
    for (const frame of this.streamParser.feed(data)) {
      Object.assign(patch, this.processFrame(frame))
    }
    return patch
  }

  handleSendTelemetryMessage(msg: VehicleCommand): void {
    if (msg.type === 'arm' || msg.type === 'disarm') {
      const cmd = new CommandLong(0, 0)
      cmd.target_system = 1
      cmd.target_component = 1
      cmd.command = MavCmd.MAV_CMD_COMPONENT_ARM_DISARM
      cmd.confirmation = 0
      cmd.param1 = msg.type === 'arm' ? 1 : 0
      cmd.param2 = 0
      cmd.param3 = 0
      cmd.param4 = 0
      cmd.param5 = 0
      cmd.param6 = 0
      cmd.param7 = 0
      this.sendPacket(encodePacket(cmd))
      return
    }

    if (msg.type === 'launch') {
      const cmd = new CommandLong(0, 0)
      cmd.target_system = 1
      cmd.target_component = 1
      cmd.command = MavCmd.MAV_CMD_NAV_TAKEOFF
      cmd.param1 = 0
      cmd.param2 = 0
      cmd.param3 = 0
      cmd.param4 = 0
      cmd.param5 = 0
      cmd.param6 = 0
      cmd.param7 = msg.height || 10
      this.sendPacket(encodePacket(cmd))
      return
    }

    if (msg.type === 'setMode') {
      const cmd = new SetMode(0, 0)
      cmd.target_system = 1
      cmd.base_mode = MavModeFlag.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED as unknown as MavMode
      cmd.custom_mode = msg.mode
      this.sendPacket(encodePacket(cmd))
      return
    }

    throw new Error(`[ardupilot] Unknown command type: ${(msg as any).type}`)
  }

  uploadMission(mission: unknown): void {
    const typedMission = mission as Mission<(typeof mavCmdDescription)[number]>
    const reference = typedMission.getReferencePoint()

    const homeItem = MAV2MAVparam(
      //@ts-ignore
      makeCommand(
        'D.MAV_CMD_NAV_WAYPOINT',
        {
          latitude: reference.lat,
          longitude: reference.lng,
          altitude: 0
        },
        ardupilot
      )
    )
    homeItem.frame = 0 // MAV_FRAME_GLOBAL — absolute altitude for home

    const missionItems = convertArdupilot(typedMission).map(MAV2MAVparam)

    this.resetUploadState()
    this.pendingUpload = [homeItem, ...missionItems]

    console.log(`[mavlink] Starting mission upload: ${this.pendingUpload.length} items`)

    const countMsg = new MissionCount(0, 0)
    countMsg.target_system = 1
    countMsg.target_component = 1
    countMsg.count = this.pendingUpload.length
    countMsg.mission_type = MavMissionType.MAV_MISSION_TYPE_MISSION
    this.sendPacket(encodePacket(countMsg))
  }

  destroy(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout)
    this.heartbeatTimer = null
    this.heartbeatTimeout = null
  }

  private resetUploadState() {
    this.pendingUpload = null
    this.dedupSeq = -1
    this.dedupTime = 0
  }

  private processFrame(data: ArrayBuffer): Partial<VehicleState> {
    const msg = decodePacket(data)
    if (!msg) return {}

    if (msg instanceof Heartbeat) {
      if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = setTimeout(() => {
        console.log('No heartbeat, disconnecting')
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
        this.connected = false
        this.onPatch({ connected: false })
      }, 3000)

      const isArmed = (msg.base_mode & MavModeFlag.MAV_MODE_FLAG_SAFETY_ARMED) !== 0
      const patch: Partial<VehicleState> = { mode: msg.custom_mode, isArmed }

      if (!this.connected) {
        this.connected = true
        patch.connected = true

        const cmd = new CommandLong(0, 0)
        cmd.command = MavCmd.MAV_CMD_REQUEST_MESSAGE
        cmd.param1 = 148
        cmd.target_system = 1
        cmd.target_component = 1
        this.sendPacket(encodePacket(cmd))

        const cmd2 = new RequestDataStream(0, 0)
        cmd2.target_system = 1
        cmd2.target_component = 1
        cmd2.req_stream_id = 0
        cmd2.start_stop = 1
        cmd2.req_message_rate = 32
        this.sendPacket(encodePacket(cmd2))

        this.heartbeatTimer = setInterval(() => {
          const hb = new Heartbeat(0, 0)
          this.sendPacket(encodePacket(hb))
        }, 1000)
      }

      return patch
    }

    if (msg instanceof GlobalPositionInt) {
      return {
        alt: msg.alt / 1000,
        heading: msg.hdg / 100,
        lat: msg.lat / 10000000,
        lon: msg.lon / 10000000,
        relativeAlt: msg.relative_alt / 100
      }
    }

    if (msg instanceof Attitude) {
      return {
        roll: rad2deg(msg.roll),
        pitch: rad2deg(msg.pitch),
        yaw: rad2deg(msg.yaw),
        pitchRate: msg.pitchspeed,
        rollRate: msg.rollspeed,
        yawRate: msg.yawspeed
      }
    }

    if (msg instanceof GpsRawInt) {
      return {
        gpsSatellites: msg.satellites_visible,
        gpsFixType: msg.fix_type,
        groundspeed: msg.vel !== 65535 ? msg.vel / 100 : null,
        hdop: msg.eph
      }
    }

    if (msg instanceof BatteryStatus) {
      return {
        batteryVoltage: msg.voltages / 1000,
        batteryCurrent: msg.current_battery,
        batteryRemaining: msg.time_remaining,
        batteryConsumedmAh: msg.current_consumed
      }
    }

    if (msg instanceof VfrHud) {
      return {
        airspeed: msg.airspeed,
        climb: msg.climb,
        groundspeed: msg.groundspeed,
        throttle: msg.throttle
      }
    }

    if (msg instanceof Wind) {
      return {
        windDirection: msg.direction,
        windHSpeed: msg.speed,
        windZSpeed: msg.speed_z
      }
    }

    if (msg instanceof AoaSsa) {
      return { AOA: msg.AOA, SSA: msg.SSA }
    }

    if (msg instanceof MissionCurrent) {
      return {
        missionId: msg.mission_id,
        missionSeq: msg.seq,
        missionMode: msg.mission_mode,
        missionState: msg.mission_state,
        missionTotal: msg.total
      }
    }

    if (msg instanceof NavControllerOutput) {
      return {
        altError: msg.alt_error,
        aspdError: msg.aspd_error,
        navBearing: msg.nav_bearing,
        navPitch: msg.nav_pitch,
        navRoll: msg.nav_roll,
        targetBearing: msg.target_bearing,
        wpDist: msg.wp_dist,
        xtrackError: msg.xtrack_error
      }
    }

    if (msg instanceof EkfStatusReport) {
      return {
        airspeedVariance: msg.airspeed_variance,
        compassVariance: msg.compass_variance,
        posHorizVariance: msg.pos_horiz_variance,
        posVertVariance: msg.pos_vert_variance,
        velocityVariance: msg.velocity_variance
      }
    }

    if (msg instanceof Statustext) {
      switch (msg.severity) {
        case 0:
        case 1:
        case 2:
        case 3:
          toast.error(getSeverityName(msg.severity), { description: `${msg.text}` })
          break
        case 4:
        case 5:
          toast.warning(getSeverityName(msg.severity), { description: `${msg.text}` })
          break
        case 6:
        case 7:
          toast.info(getSeverityName(msg.severity), { description: `${msg.text}` })
          break
      }
      return {}
    }

    // ------------------------------------------------------------------
    // Mission upload handshake — respond to both legacy MISSION_REQUEST
    // and the preferred MISSION_REQUEST_INT with MISSION_ITEM_INT.
    // Modern ArduPilot (4.x) always expects MISSION_ITEM_INT and will log
    // a warning if it receives the float MISSION_ITEM variant.
    // ------------------------------------------------------------------
    if (msg instanceof MissionRequest || msg instanceof MissionRequestInt) {
      if (!this.pendingUpload) return {}

      const seq = msg.seq
      const item = this.pendingUpload[seq]
      if (!item) {
        console.warn(
          `[mavlink] request for unknown seq ${seq} (upload has ${this.pendingUpload.length} items)`
        )
        return {}
      }

      const now = Date.now()
      if (seq === this.dedupSeq && now - this.dedupTime < DEDUP_MS) return {}
      this.dedupSeq = seq
      this.dedupTime = now

      console.log(`[mavlink] Sending MISSION_ITEM_INT seq=${seq}`)
      this.sendPacket(encodePacket(buildMissionItemInt(item, seq)))
      return {}
    }

    if (msg instanceof MissionAck) {
      if (msg.type === 0 /* MAV_MISSION_ACCEPTED */) {
        console.log('[mavlink] Mission upload accepted')
        toast.success('Mission Upload Accepted', {
          description: 'The vehicle has accepted your mission upload'
        })
      } else {
        console.error(`[mavlink] Mission upload failed, result=${msg.type}`)
        toast.error('Mission Upload Failed', {
          description: `The upload has failed with the following result: ${msg.type}`
        })
      }
      this.resetUploadState()
      return {}
    }

    return {}
  }
}

export const ardupilot: Dialect<(typeof mavCmdDescription)[number]> = {
  name: 'mavlink-ardupilot',
  commandDescriptions: mavCmdDescription,
  convert: convertArdupilot,

  getCommandLocation: (cmd) => {
    const a = mavCmdDescription.find((x) => x.type == cmd.type)
    if (!a.hasLocation) {
      return null
    }
    //@ts-ignore
    const b = objectKeys(cmd.params).includes('latitude') ? cmd.params.latitude : null
    //@ts-ignore
    const c = objectKeys(cmd.params).includes('longitude') ? cmd.params.longitude : null
    if (b === null || c === null) {
      return null
    }
    return { lat: b, lng: c }
  },

  getCommandLocationAlt: (cmd) => {
    const a = mavCmdDescription.find((x) => x.type == cmd.type)
    if (!a.hasLocation) {
      return null
    }
    //@ts-ignore
    const b = objectKeys(cmd.params).includes('latitude') ? cmd.params.latitude : null
    //@ts-ignore
    const c = objectKeys(cmd.params).includes('longitude') ? cmd.params.longitude : null
    //@ts-ignore
    const d = objectKeys(cmd.params).includes('altitude') ? cmd.params.altitude : null
    if (b === null || c === null || d === null) {
      return null
    }
    return { lat: b, lng: c, alt: d }
  },

  getCommandLabel: (cmd) => {
    const a = mavCmdDescription.find((x) => x.type == cmd.type)
    return a.label
  },

  fileFormats: [
    {
      name: 'Readyflight JSON',
      id: 'RFJSON1',
      export: (mission, vehicle) => exportRFJSON1(mission, vehicle, ardupilot),
      // @ts-ignore
      import: (blob) => importRFJSON1(blob),
      ext: '.json'
    },
    {
      name: '.waypoints',
      id: 'QGCmission',
      export: (mission, _) => exportQGCWaypoints(mission),
      import: (blob) => importQGCWaypoints(blob, ardupilot),
      ext: '.waypoints'
    }
  ],

  supportedRFCommands: {
    'RF.DubinsPath': true,
    'RF.Group': true,
    'RF.SetServo': true,
    'RF.Land': true,
    'RF.Takeoff': true,
    'RF.Waypoint': true
  },

  createSession: (sendPacket, onPatch) => new ArduPilotSession(sendPacket, onPatch)
}
