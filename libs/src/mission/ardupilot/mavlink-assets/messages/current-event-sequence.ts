import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavEventCurrentSequenceFlags} from '../enums/mav-event-current-sequence-flags';
/*
Regular broadcast for the current latest event sequence number for a component. This is used to check for dropped events.
*/
// sequence Sequence number. uint16_t
// flags Flag bitset. uint8_t
export class CurrentEventSequence extends MAVLinkMessage {
	public sequence!: number;
	public flags!: MavEventCurrentSequenceFlags;
	public _message_id: number = 411;
	public _message_name: string = 'CURRENT_EVENT_SEQUENCE';
	public _crc_extra: number = 106;
	public _message_fields: [string, string, boolean][] = [
		['sequence', 'uint16_t', false],
		['flags', 'uint8_t', false],
	];
}