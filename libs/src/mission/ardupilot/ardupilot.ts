import { convertArdupilot, exportQGCWaypoints, MAV2MAVparam, MavCommand } from "./export"
import { Dialect } from "../dialect"
import { mavCmdDescription } from "./commands"
import { exportRFJSON1 } from "../format/readyflight/json1/export"
import { importRFJSON1 } from "../format/readyflight/json1/import"
import { decodePacket } from "./mavlink-decoder"
import { encodePacket } from "./mavlink-encoder"
import { Attitude } from "./mavlink-assets/messages/attitude"
import { GlobalPositionInt } from "./mavlink-assets/messages/global-position-int"
import { GpsRawInt } from "./mavlink-assets/messages/gps-raw-int"
import { Statustext } from "./mavlink-assets/messages/statustext"
import { VfrHud } from "./mavlink-assets/messages/vfr-hud"
import { rad2deg } from "@libs/math/geometry"
import { Wind } from "./mavlink-assets/messages/wind"
import { BatteryStatus } from "./mavlink-assets/messages/battery-status"
import { AoaSsa } from "./mavlink-assets/messages/aoa-ssa"
import { MissionCurrent } from "./mavlink-assets/messages/mission-current"
import { NavControllerOutput } from "./mavlink-assets/messages/nav-controller-output"
import { EkfStatusReport } from "./mavlink-assets/messages/ekf-status-report"
import { CommandLong } from "./mavlink-assets/messages/command-long"
import { SetMode } from "./mavlink-assets/messages/set-mode"
import { MissionCount } from "./mavlink-assets/messages/mission-count"
import { MissionItemInt } from "./mavlink-assets/messages/mission-item-int"
import { MissionRequest } from "./mavlink-assets/messages/mission-request"
import { MissionRequestInt } from "./mavlink-assets/messages/mission-request-int"
import { MissionAck } from "./mavlink-assets/messages/mission-ack"
import { MavCmd } from "./mavlink-assets/enums/mav-cmd"
import { MavModeFlag } from "./mavlink-assets/enums/mav-mode-flag"
import { MavMissionType } from "./mavlink-assets/enums/mav-mission-type"
import { makeCommand } from "@libs/commands/helpers"
import { Mission } from "../mission"
import { Heartbeat } from "./mavlink-assets/messages/heartbeat"
import { useVehicle } from "@/stores/vehicle"
import { RequestDataStream } from "./mavlink-assets/messages/request-data-stream"

// ---------------------------------------------------------------------------
// Mission upload state — one active upload at a time.
// Stored at module scope so that handleTelemetryMessage (called on every
// incoming frame) can respond to MISSION_REQUEST/MISSION_REQUEST_INT without
// any extra wiring in the connection handler.
// ---------------------------------------------------------------------------
let pendingUpload: MavCommand[] | null = null

// Deduplication for React StrictMode / brief double-connection window.
// Two WebSocket connections can race on the same MISSION_REQUEST packet (the
// backend broadcasts to all subscribers). Track the last seq we actually sent
// and suppress any repeat within a short window.
const DEDUP_MS = 200
let dedupSeq = -1
let dedupTime = 0

function resetUploadState() {
  pendingUpload = null
  dedupSeq = -1
  dedupTime = 0
}

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
  msg.x = Math.round(item.param5 * 1e7)  // lat → int32 (deg * 1e7)
  msg.y = Math.round(item.param6 * 1e7)  // lon → int32 (deg * 1e7)
  msg.z = item.param7                     // alt stays as float
  return msg
}

let heartbeatTimer = null
let heartbeatTimeout = null

export const ardupilot: Dialect<typeof mavCmdDescription[number]> = {
  name: "mavlink-ardupilot",
  commandDescriptions: mavCmdDescription,
  convert: convertArdupilot,

  getCommandLocation: (cmd) => {
    let a = mavCmdDescription.find(x => x.type == cmd.type)
    if (!a.hasLocation) {
      return null
    }
    //@ts-ignore
    let b = objectKeys(cmd.params).includes("latitude") ? cmd.params.latitude : null
    //@ts-ignore
    let c = objectKeys(cmd.params).includes("longitude") ? cmd.params.longitude : null
    if (b === null || c === null) {
      return null
    }
    return { lat: b, lng: c }
  },

  getCommandLocationAlt: (cmd) => {
    let a = mavCmdDescription.find(x => x.type == cmd.type)
    if (!a.hasLocation) {
      return null
    }
    //@ts-ignore
    let b = objectKeys(cmd.params).includes("latitude") ? cmd.params.latitude : null
    //@ts-ignore
    let c = objectKeys(cmd.params).includes("longitude") ? cmd.params.longitude : null
    //@ts-ignore
    let d = objectKeys(cmd.params).includes("altitude") ? cmd.params.altitude : null
    if (b === null || c === null || d === null) {
      return null
    }
    return { lat: b, lng: c, alt: d }
  },

  getCommandLabel: (cmd) => {
    let a = mavCmdDescription.find(x => x.type == cmd.type)
    return a.label
  },

  fileFormats: [
    {
      name: "Readyflight JSON",
      id: "RFJSON1",
      export: (mission, vehicle) => exportRFJSON1(mission, vehicle, ardupilot),
      import: (blob) => importRFJSON1(blob),
      ext: ".json"
    },
    {
      name: ".waypoints",
      id: "QGCmission",
      export: (mission, _) => exportQGCWaypoints(mission),
      ext: ".waypoints"
    }
  ],

  supportedRFCommands: {
    "RF.DubinsPath": true,
    "RF.Group": true,
    "RF.SetServo": true,
    "RF.Land": true,
    "RF.Takeoff": true,
    "RF.Waypoint": true,
  },

  handleTelemetryMessage: (data, setVehicleState, sendPacket) => {
    const msg = decodePacket(data)
    if (!msg) return

    if (msg instanceof Heartbeat) {
      if (heartbeatTimeout) {
        clearTimeout(heartbeatTimeout);
      }
      heartbeatTimeout = setTimeout(() => {
        console.log("No heartbeat, disconecting");
        useVehicle.setState({ connected: false })
        clearTimeout(heartbeatTimer)
      }, 3000);
      const connected = useVehicle.getState().connected
      if (!connected) {
        const cmd = new CommandLong(0, 0)
        cmd.command = MavCmd.MAV_CMD_REQUEST_MESSAGE
        cmd.param1 = 148
        cmd.target_system = 1
        cmd.target_component = 1
        sendPacket(encodePacket(cmd))

        const cmd2 = new RequestDataStream(0, 0)
        cmd2.target_system = 1
        cmd2.target_component = 1
        cmd2.req_stream_id = 0
        cmd2.start_stop = 1
        cmd2.req_message_rate = 32
        sendPacket(encodePacket(cmd2))



        heartbeatTimer = setInterval(() => {
          const cmd = new Heartbeat(0, 0)
          sendPacket(encodePacket(cmd))
        }, 1000)
        useVehicle.setState({ connected: true })

      }
    } else if (msg instanceof GlobalPositionInt) {
      setVehicleState({
        alt: msg.alt / 1000,
        heading: msg.hdg / 100,
        lat: msg.lat / 10000000,
        lon: msg.lon / 10000000,
        relativeAlt: msg.relative_alt / 100
      })
    } else if (msg instanceof Attitude) {
      setVehicleState({
        roll: rad2deg(msg.roll),
        pitch: rad2deg(msg.pitch),
        yaw: rad2deg(msg.yaw),
        pitchRate: msg.pitchspeed,
        rollRate: msg.rollspeed,
        yawRate: msg.yawspeed
      })
    } else if (msg instanceof GpsRawInt) {
      setVehicleState({
        gpsSatellites: msg.satellites_visible,
        gpsFixType: msg.fix_type,
        groundspeed: msg.vel !== 65535 ? msg.vel / 100 : null,
      })
    } else if (msg instanceof BatteryStatus) {
      setVehicleState({
        batteryVoltage: msg.voltages / 1000,
        batteryCurrent: msg.current_battery,
        batteryRemaining: msg.battery_remaining,
        batteryConsumedmAh: msg.current_consumed
      })
    } else if (msg instanceof VfrHud) {
      setVehicleState({
        airspeed: msg.airspeed,
        climb: msg.climb,
        groundspeed: msg.groundspeed,
        throttle: msg.throttle
      })
    } else if (msg instanceof Wind) {
      setVehicleState({
        windDirection: msg.direction,
        windHSpeed: msg.speed,
        windZSpeed: msg.speed_z
      })
    } else if (msg instanceof AoaSsa) {
      setVehicleState({
        AOA: msg.AOA,
        SSA: msg.SSA
      })
    } else if (msg instanceof MissionCurrent) {
      setVehicleState({
        missionId: msg.mission_id,
        missionSeq: msg.seq,
        missionMode: msg.mission_mode,
        missionState: msg.mission_state,
        missionTotal: msg.total
      })
    } else if (msg instanceof NavControllerOutput) {
      setVehicleState({
        altError: msg.alt_error,
        aspdError: msg.aspd_error,
        navBearing: msg.nav_bearing,
        navPitch: msg.nav_pitch,
        navRoll: msg.nav_roll,
        targetBearing: msg.target_bearing,
        wpDist: msg.wp_dist,
        xtrackError: msg.xtrack_error
      })
    } else if (msg instanceof EkfStatusReport) {
      setVehicleState({
        airspeedVariance: msg.airspeed_variance,
        compassVariance: msg.compass_variance,
        posHorizVariance: msg.pos_horiz_variance,
        posVertVariance: msg.pos_vert_variance,
        velocityVariance: msg.velocity_variance
      })
    } else if (msg instanceof Statustext) {
      console.log(`[mavlink] STATUSTEXT [sev=${msg.severity}] ${msg.text}`)

      // ------------------------------------------------------------------
      // Mission upload handshake — respond to both legacy MISSION_REQUEST
      // and the preferred MISSION_REQUEST_INT with MISSION_ITEM_INT.
      // Modern ArduPilot (4.x) always expects MISSION_ITEM_INT and will log
      // a warning if it receives the float MISSION_ITEM variant.
      // ------------------------------------------------------------------
    } else if (msg instanceof MissionRequest || msg instanceof MissionRequestInt) {
      if (!pendingUpload) return

      const seq = msg.seq
      const item = pendingUpload[seq]
      if (!item) {
        console.warn(`[mavlink] request for unknown seq ${seq} (upload has ${pendingUpload.length} items)`)
        return
      }

      // Deduplicate: suppress the same seq if it arrives again within DEDUP_MS.
      // This handles the React-StrictMode / double-connection case where the
      // backend broadcasts one MISSION_REQUEST to two WebSocket clients and
      // both would otherwise respond, causing INVALID_SEQUENCE on the vehicle.
      const now = Date.now()
      if (seq === dedupSeq && now - dedupTime < DEDUP_MS) return
      dedupSeq = seq
      dedupTime = now

      console.log(`[mavlink] Sending MISSION_ITEM_INT seq=${seq}`)
      sendPacket(encodePacket(buildMissionItemInt(item, seq)))

    } else if (msg instanceof MissionAck) {
      if (msg.type === 0 /* MAV_MISSION_ACCEPTED */) {
        console.log('[mavlink] Mission upload accepted')
      } else {
        console.error(`[mavlink] Mission upload failed, result=${msg.type}`)
      }
      resetUploadState()
    }
  },

  handleSendTelemetryMessage: (msg, sendPacket) => {
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
      sendPacket(encodePacket(cmd))
      return
    }

    if (msg.type === 'setMode') {
      const cmd = new SetMode(0, 0)
      cmd.target_system = 1
      cmd.base_mode = MavModeFlag.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED
      cmd.custom_mode = msg.mode
      sendPacket(encodePacket(cmd))
      return
    }

    throw new Error(`[ardupilot] Unknown command type: ${(msg as any).type}`)
  },

  uploadMission: (mission, sendPacket) => {
    // Convert the RF/dialect mission into flat MAVLink param items.
    // Item 0 is always the home position (reference point, absolute altitude 0).
    const typedMission = mission as unknown as Mission<typeof mavCmdDescription[number]>
    const reference = typedMission.getReferencePoint()

    //@ts-ignore
    const homeItem = MAV2MAVparam(makeCommand("D.MAV_CMD_NAV_WAYPOINT", {
      latitude: reference.lat,
      longitude: reference.lng,
      altitude: 0
    }, ardupilot))
    homeItem.frame = 0  // MAV_FRAME_GLOBAL — absolute altitude for home

    const missionItems = convertArdupilot(typedMission).map(MAV2MAVparam)

    // Reset state for the new upload
    resetUploadState()
    pendingUpload = [homeItem, ...missionItems]

    console.log(`[mavlink] Starting mission upload: ${pendingUpload.length} items`)

    const countMsg = new MissionCount(0, 0)
    countMsg.target_system = 1
    countMsg.target_component = 1
    countMsg.count = pendingUpload.length
    countMsg.mission_type = MavMissionType.MAV_MISSION_TYPE_MISSION
    sendPacket(encodePacket(countMsg))
  },
}
