import { messageRegistry } from "./mavlink-assets/message-registry"

// CRC-16/MCRF4XX — MAVLink's checksum algorithm
function crc16(data: Uint8Array, start: number, length: number): number {
  let crc = 0xffff
  for (let i = start; i < start + length; i++) {
    let tmp = data[i] ^ (crc & 0xff)
    tmp ^= (tmp << 4) & 0xff
    crc = (crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4)
    crc &= 0xffff
  }
  return crc
}

/**
 * Stateful MAVLink byte-stream framer.
 *
 * Accumulates raw bytes (from a serial stream or any other source) and
 * extracts complete MAVLink v1/v2 frames. Partial frames are retained
 * across calls until enough bytes arrive to complete them.
 *
 * Frames are CRC-validated before being returned. Bytes that do not form
 * a valid frame are discarded and scanning resumes from the next byte,
 * preventing mid-frame 0xFD/0xFE bytes from producing phantom frames.
 *
 * UDP callers are unaffected: feeding one complete datagram returns exactly
 * one frame with nothing left in the buffer.
 *
 * MAVLink v1 frame layout:
 *   [STX=0xFE] [LEN] [SEQ] [SYS] [COMP] [MSG] [PAYLOAD×LEN] [CRC_L] [CRC_H]
 *   CRC covers bytes 1..(5+LEN), then folds in CRC_EXTRA[MSG]
 *
 * MAVLink v2 frame layout:
 *   [STX=0xFD] [LEN] [INCOMPAT] [COMPAT] [SEQ] [SYS] [COMP] [MSG0] [MSG1] [MSG2] [PAYLOAD×LEN] [CRC_L] [CRC_H] [SIGNATURE×13?]
 *   CRC covers bytes 1..(9+LEN), then folds in CRC_EXTRA[MSG]
 *   Signature is appended when INCOMPAT bit 0 is set.
 */
export class MavLinkStreamParser {
  private buf: Uint8Array = new Uint8Array(0)

  feed(chunk: Uint8Array): ArrayBuffer[] {
    const combined = new Uint8Array(this.buf.length + chunk.length)
    combined.set(this.buf)
    combined.set(chunk, this.buf.length)
    this.buf = combined

    const frames: ArrayBuffer[] = []
    let pos = 0

    while (pos < this.buf.length) {
      const stx = this.buf[pos]

      if (stx !== 0xfe && stx !== 0xfd) {
        pos++
        continue
      }

      if (this.buf.length - pos < 2) break

      const payloadLen = this.buf[pos + 1]

      let frameSize: number
      let msgId: number
      let crcStart: number  // first byte covered by CRC (always STX+1)
      let crcEnd: number    // last byte covered by CRC (exclusive), before the CRC bytes

      if (stx === 0xfe) {
        // v1
        frameSize = 8 + payloadLen
        crcStart = pos + 1
        crcEnd = pos + 6 + payloadLen
        if (this.buf.length - pos < frameSize) break
        msgId = this.buf[pos + 5]
      } else {
        // v2
        frameSize = 12 + payloadLen
        crcStart = pos + 1
        crcEnd = pos + 10 + payloadLen
        if (this.buf.length - pos < 3) break
        const incompatFlags = this.buf[pos + 2]
        if (incompatFlags & 0x01) frameSize += 13
        if (this.buf.length - pos < frameSize) break
        msgId = this.buf[pos + 7] | (this.buf[pos + 8] << 8) | (this.buf[pos + 9] << 16)
      }

      // Validate CRC before accepting the frame.
      let message = messageRegistry.find((msg) => msg[0] === msgId)
      if (message !== undefined) {
        let a = new message[1](0, 0)
        const crcExtra = a._crc_extra

        let crc = crc16(this.buf, crcStart, crcEnd - crcStart)
        // Fold in the CRC extra byte
        const tmp = crcExtra ^ (crc & 0xff)
        const tmp2 = (tmp ^ (tmp << 4)) & 0xff
        crc = (crc >> 8) ^ (tmp2 << 8) ^ (tmp2 << 3) ^ (tmp2 >> 4)
        crc &= 0xffff

        const crcL = this.buf[crcEnd]
        const crcH = this.buf[crcEnd + 1]
        const expected = crcL | (crcH << 8)

        if (crc !== expected) {
          // Not a real frame start — skip this byte and keep scanning.
          pos++
          continue
        }
      }

      frames.push(this.buf.slice(pos, pos + frameSize).buffer)
      pos += frameSize
    }

    this.buf = this.buf.slice(pos)
    return frames
  }

  reset(): void {
    this.buf = new Uint8Array(0)
  }
}
