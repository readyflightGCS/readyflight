// Browser-compatible MAVLink v1 frame serializer.
// Mirrors the field metadata approach used in mavlink-decoder.ts — reads
// _message_fields / _message_id / _crc_extra from the generated message class
// and writes each field into a DataView in wire order.

import { MAVLinkMessage } from 'node-mavlink'

// GCS identity — system 255 is the conventional MAVLink GCS system ID.
const GCS_SYSID = 255
const GCS_COMPID = 190 // MAV_COMP_ID_MISSIONPLANNER

let sequence = 0

function writeField(view: DataView, offset: number, type: string, value: number): number {
  switch (type) {
    case 'uint8_t':
    case 'uint8_t_mavlink_version':
      view.setUint8(offset, value >>> 0)
      return 1
    case 'int8_t':
      view.setInt8(offset, value)
      return 1
    case 'uint16_t':
      view.setUint16(offset, value >>> 0, true)
      return 2
    case 'int16_t':
      view.setInt16(offset, value, true)
      return 2
    case 'uint32_t':
      view.setUint32(offset, value >>> 0, true)
      return 4
    case 'int32_t':
      view.setInt32(offset, value, true)
      return 4
    case 'float':
      view.setFloat32(offset, value, true)
      return 4
    case 'double':
      view.setFloat64(offset, value, true)
      return 8
    default:
      return 0
  }
}

function fieldSize(type: string): number {
  switch (type) {
    case 'uint8_t': case 'int8_t': case 'uint8_t_mavlink_version': return 1
    case 'uint16_t': case 'int16_t': return 2
    case 'uint32_t': case 'int32_t': case 'float': return 4
    case 'double': case 'uint64_t': case 'int64_t': return 8
    default: return 0
  }
}

function serializePayload(msg: MAVLinkMessage): Uint8Array {
  const fields = (msg as any)._message_fields as [string, string, boolean][]

  const size = fields.reduce((acc, [, type]) => acc + fieldSize(type), 0)
  const buf = new ArrayBuffer(size)
  const view = new DataView(buf)
  let offset = 0

  for (const [name, type] of fields) {
    const value: number = (msg as any)[name] ?? 0
    offset += writeField(view, offset, type, value)
  }

  return new Uint8Array(buf)
}

/** X.25 CRC — same algorithm ArduPilot uses for MAVLink checksums. */
function crcAccumulate(b: number, crc: number): number {
  let tmp = (b ^ (crc & 0xFF)) & 0xFF
  tmp = (tmp ^ (tmp << 4)) & 0xFF
  return ((crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4)) & 0xFFFF
}

function mavlinkCrc(
  payloadLen: number,
  seq: number,
  sysid: number,
  compid: number,
  msgid: number,
  payload: Uint8Array,
  crcExtra: number
): number {
  // CRC covers bytes 1–5 of the header (LEN, SEQ, SYS, COMP, MSGID) + payload + crc_extra.
  let crc = 0xFFFF
  crc = crcAccumulate(payloadLen, crc)
  crc = crcAccumulate(seq, crc)
  crc = crcAccumulate(sysid, crc)
  crc = crcAccumulate(compid, crc)
  crc = crcAccumulate(msgid, crc)
  for (const b of payload) crc = crcAccumulate(b, crc)
  crc = crcAccumulate(crcExtra, crc)
  return crc
}

/**
 * Serialize a MAVLinkMessage into a complete MAVLink v1 wire frame.
 *
 * Frame layout: STX(1) | LEN(1) | SEQ(1) | SYS(1) | COMP(1) | MSGID(1) | PAYLOAD | CRC(2)
 */
export function encodePacket(msg: MAVLinkMessage): ArrayBuffer {
  const payload = serializePayload(msg)
  const seq = sequence++ & 0xFF
  const msgid: number = (msg as any)._message_id
  const crcExtra: number = (msg as any)._crc_extra

  const crc = mavlinkCrc(payload.length, seq, GCS_SYSID, GCS_COMPID, msgid, payload, crcExtra)

  const frame = new Uint8Array(6 + payload.length + 2)
  frame[0] = 0xFE              // STX
  frame[1] = payload.length    // LEN
  frame[2] = seq               // SEQ
  frame[3] = GCS_SYSID         // SYS
  frame[4] = GCS_COMPID        // COMP
  frame[5] = msgid             // MSGID
  frame.set(payload, 6)
  frame[6 + payload.length] = crc & 0xFF
  frame[6 + payload.length + 1] = (crc >> 8) & 0xFF

  return frame.buffer
}
