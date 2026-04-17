// Browser-compatible MAVLink frame parser and message deserializer.
// Uses DataView/Uint8Array instead of Node.js Buffer, so it runs in the browser.
//
// The @ifrunistuttgart/node-mavlink generated message classes carry a
// `_message_fields: [name, type, isExtension][]` array that describes the wire
// layout.  We iterate that metadata and read each field with DataView, mirroring
// what MAVLinkParserV1.read() does on the Node.js side.

import { MAVLinkMessage } from '@ifrunistuttgart/node-mavlink'
import { messageRegistry } from './mavlink-assets/message-registry'

// Build an O(1) id → class lookup from the registry array.
// Duplicates (if any) resolve last-entry-wins.
const CLASS_BY_ID = new Map<number, new (sysid: number, compid: number) => MAVLinkMessage>(
  messageRegistry
)

export type MavFrame = {
  version: 1 | 2
  msgid: number
  sysid: number
  compid: number
  seq: number
  payloadLen: number   // actual byte count in the wire frame (before zero-padding)
  payload: Uint8Array  // slice of the original buffer, length === payloadLen
}

/** Parse a MAVLink v1 (0xFE) or v2 (0xFD) frame header from an ArrayBuffer. */
export function parseFrame(data: ArrayBuffer): MavFrame | null {
  const b = new Uint8Array(data)
  if (b.length < 8) return null

  if (b[0] === 0xfe) { // MAVLink v1: STX | LEN | SEQ | SYS | COMP | MSGID | payload… | CRC(2)
    const payloadLen = b[1]
    if (b.length < 8 + payloadLen) return null
    return {
      version: 1,
      payloadLen,
      seq: b[2],
      sysid: b[3],
      compid: b[4],
      msgid: b[5],
      payload: b.subarray(6, 6 + payloadLen),
    }
  }

  if (b[0] === 0xfd) { // MAVLink v2: STX | LEN | INCOMPAT | COMPAT | SEQ | SYS | COMP | MSGID(3) | payload… | CRC(2)
    if (b.length < 12) return null
    const payloadLen = b[1]
    if (b.length < 12 + payloadLen) return null
    const msgid = b[7] | (b[8] << 8) | (b[9] << 16)
    return {
      version: 2,
      payloadLen,
      seq: b[4],
      sysid: b[5],
      compid: b[6],
      msgid,
      payload: b.subarray(10, 10 + payloadLen),
    }
  }

  return null
}

/**
 * Read one scalar field from `view` at `offset` using the MAVLink type string.
 * Returns [decoded value, byte size consumed].
 * Returns [null, 0] for unknown types (caller should skip).
 */
function readField(view: DataView, offset: number, type: string): [unknown, number] {
  switch (type) {
    case 'uint8_t':
    case 'uint8_t_mavlink_version':
      return [view.getUint8(offset), 1]
    case 'int8_t':
      return [view.getInt8(offset), 1]
    case 'uint16_t':
      return [view.getUint16(offset, true), 2]
    case 'int16_t':
      return [view.getInt16(offset, true), 2]
    case 'uint32_t':
      return [view.getUint32(offset, true), 4]
    case 'int32_t':
      return [view.getInt32(offset, true), 4]
    case 'float':
      return [view.getFloat32(offset, true), 4]
    case 'double':
      return [view.getFloat64(offset, true), 8]
    case 'uint64_t': {
      // JS has no native uint64; split into two uint32 reads.
      // Loses precision for values > 2^53 but is fine for timestamps.
      const lo = view.getUint32(offset, true)
      const hi = view.getUint32(offset + 4, true)
      return [lo + hi * 0x100000000, 8]
    }
    case 'int64_t': {
      const lo = view.getUint32(offset, true)
      const hi = view.getInt32(offset + 4, true)
      return [lo + hi * 0x100000000, 8]
    }
    default:
      return [null, 0]
  }
}

/**
 * Deserialize a MAVLink payload into a typed message instance.
 *
 * Reads each field described by `instance._message_fields` in wire order.
 * Extension fields (isExtension === true) are only decoded when the actual
 * payload covers their offset — matching the MAVLink 2 trailing-zero-truncation
 * spec.
 *
 * Note: The code-generator does not encode array sizes in `_message_fields`,
 * so fields whose MAVLink type is an array (e.g. `uint16_t[10]`) are decoded as
 * their scalar base type.  This is a known limitation of these generated files.
 * All scalar-only messages (HEARTBEAT, ATTITUDE, GLOBAL_POSITION_INT, etc.)
 * decode correctly.
 */
export function deserializePayload<T extends MAVLinkMessage>(instance: T, payload: Uint8Array): T {
  // Pad to 255 bytes so reads beyond the truncated payload return 0,
  // matching the MAVLink spec for omitted trailing extension fields.
  const padded = new Uint8Array(255)
  padded.set(payload)
  const view = new DataView(padded.buffer)
  const actualLen = payload.length

  let offset = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [name, type, isExtension] of (instance as any)._message_fields as [string, string, boolean][]) {
    if (isExtension && offset >= actualLen) break

    if (type === 'char') {
      // `char` represents a null-terminated ASCII string occupying the remaining
      // non-extension payload bytes (e.g. STATUSTEXT.text is char[50]).
      let str = ''
      for (let i = offset; i < actualLen; i++) {
        if (padded[i] === 0) break
        str += String.fromCharCode(padded[i])
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ; (instance as any)[name] = str
      offset = actualLen
      continue
    }

    const [value, size] = readField(view, offset, type)
    if (size > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ; (instance as any)[name] = value
      offset += size
    }
  }

  return instance
}

/**
 * Full decode pipeline: parse the MAVLink frame header, look up the message
 * class, instantiate it, and deserialize the payload into it.
 *
 * Returns null for malformed frames or unknown message IDs.
 */
export function decodePacket(data: ArrayBuffer): MAVLinkMessage | null {
  try {
    const frame = parseFrame(data)
    if (!frame) return null

    const Cls = CLASS_BY_ID.get(frame.msgid)
    if (!Cls) return null

    const instance = new Cls(frame.sysid, frame.compid)
    return deserializePayload(instance, frame.payload)
  } catch {
    return null
  }
}
