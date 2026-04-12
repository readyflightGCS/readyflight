import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Request one or more events to be (re-)sent. If first_sequence==last_sequence, only a single event is requested. Note that first_sequence can be larger than last_sequence (because the sequence number can wrap). Each sequence will trigger an EVENT or EVENT_ERROR response.
*/
// target_system System ID uint8_t
// target_component Component ID uint8_t
// first_sequence First sequence number of the requested event. uint16_t
// last_sequence Last sequence number of the requested event. uint16_t
export class RequestEvent extends MAVLinkMessage {
	public target_system!: number;
	public target_component!: number;
	public first_sequence!: number;
	public last_sequence!: number;
	public _message_id: number = 412;
	public _message_name: string = 'REQUEST_EVENT';
	public _crc_extra: number = 33;
	public _message_fields: [string, string, boolean][] = [
		['first_sequence', 'uint16_t', false],
		['last_sequence', 'uint16_t', false],
		['target_system', 'uint8_t', false],
		['target_component', 'uint8_t', false],
	];
}