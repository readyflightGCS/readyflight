// Browser-safe shim for `node-mavlink`.
//
// The generated message classes in mavlink-assets/messages/ do:
//   import { MAVLinkMessage } from 'node-mavlink'
//   import { readInt64LE, readUInt64LE } from 'node-mavlink'
//
// The real node-mavlink package also exports stream-based parsers that pull in
// Node.js `events`, `stream`, and `crypto` — none of which exist in the browser.
// This shim provides the three symbols the generated classes actually need and
// nothing else, so Vite can bundle it without any Node.js polyfills.
//
// Aliased via vite.config and electron.vite.config:
//   'node-mavlink' → '<this file>'

export class MAVLinkMessage {
  public _system_id: number
  public _component_id: number

  // These are overridden by each generated subclass's field initialisers.
  public _message_id!: number
  public _message_name!: string
  public _crc_extra!: number
  public _message_fields!: [string, string, boolean][]

  constructor(system_id: number, component_id: number) {
    this._system_id = system_id
    this._component_id = component_id
  }
}

// The generated files import these helpers but never call them in a browser
// context (our DataView-based decoder handles 64-bit fields directly).
export function readInt64LE(_buffer: unknown, _offset?: number): number { return 0 }
export function readUInt64LE(_buffer: unknown, _offset?: number): number { return 0 }
