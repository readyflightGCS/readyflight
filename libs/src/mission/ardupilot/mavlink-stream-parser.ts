/**
 * Stateful MAVLink byte-stream framer.
 *
 * Accumulates raw bytes (from a serial stream or any other source) and
 * extracts complete MAVLink v1/v2 frames. Partial frames are retained
 * across calls until enough bytes arrive to complete them.
 *
 * UDP callers are unaffected: feeding one complete datagram returns exactly
 * one frame with nothing left in the buffer.
 *
 * MAVLink v1 frame layout:  [STX=0xFE] [LEN] [SEQ] [SYS] [COMP] [MSG] [PAYLOAD×LEN] [CRC_L] [CRC_H]
 *   Total = 6 header + LEN payload + 2 CRC = LEN + 8
 *
 * MAVLink v2 frame layout:  [STX=0xFD] [LEN] [INCOMPAT] [COMPAT] [SEQ] [SYS] [COMP] [MSG0] [MSG1] [MSG2] [PAYLOAD×LEN] [CRC_L] [CRC_H] [SIGNATURE×13?]
 *   Total = 10 header + LEN payload + 2 CRC (+ 13 if INCOMPAT bit 0 set) = LEN + 12 (+ 13)
 */
export class MavLinkStreamParser {
  private buf: Uint8Array = new Uint8Array(0)

  feed(chunk: Uint8Array): ArrayBuffer[] {
    // Append chunk to any leftover bytes from the previous call.
    const combined = new Uint8Array(this.buf.length + chunk.length)
    combined.set(this.buf)
    combined.set(chunk, this.buf.length)
    this.buf = combined

    const frames: ArrayBuffer[] = []
    let pos = 0

    while (pos < this.buf.length) {
      const stx = this.buf[pos]

      // Scan forward until we find a valid start byte.
      if (stx !== 0xfe && stx !== 0xfd) {
        pos++
        continue
      }

      // Need at least STX + LEN to determine frame size.
      if (this.buf.length - pos < 2) break

      const payloadLen = this.buf[pos + 1]

      let frameSize: number
      if (stx === 0xfe) {
        // v1: 6 header + payloadLen + 2 CRC
        frameSize = 8 + payloadLen
      } else {
        // v2: 10 header + payloadLen + 2 CRC
        frameSize = 12 + payloadLen

        // INCOMPAT flags live at offset 2. Bit 0 means a 13-byte signature
        // is appended after the CRC. We need at least 3 bytes to read it.
        if (this.buf.length - pos < 3) break
        const incompat_flags = this.buf[pos + 2]
        if (incompat_flags & 0x01) {
          frameSize += 13
        }
      }

      // Wait for the full frame to arrive.
      if (this.buf.length - pos < frameSize) break

      // Copy the frame bytes into a fresh, standalone ArrayBuffer.
      const frame = this.buf.slice(pos, pos + frameSize)
      frames.push(frame.buffer)
      pos += frameSize
    }

    // Retain only the unprocessed tail for the next call.
    this.buf = this.buf.slice(pos)
    return frames
  }

  reset(): void {
    this.buf = new Uint8Array(0)
  }
}
