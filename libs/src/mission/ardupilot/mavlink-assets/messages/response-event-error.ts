import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavEventErrorReason} from '../enums/mav-event-error-reason';
/*
Response to a REQUEST_EVENT in case of an error (e.g. the event is not available anymore).
*/
// target_system System ID uint8_t
// target_component Component ID uint8_t
// sequence Sequence number. uint16_t
// sequence_oldest_available Oldest Sequence number that is still available after the sequence set in REQUEST_EVENT. uint16_t
// reason Error reason. uint8_t
export class ResponseEventError extends MAVLinkMessage {
	public target_system!: number;
	public target_component!: number;
	public sequence!: number;
	public sequence_oldest_available!: number;
	public reason!: MavEventErrorReason;
	public _message_id: number = 413;
	public _message_name: string = 'RESPONSE_EVENT_ERROR';
	public _crc_extra: number = 77;
	public _message_fields: [string, string, boolean][] = [
		['sequence', 'uint16_t', false],
		['sequence_oldest_available', 'uint16_t', false],
		['target_system', 'uint8_t', false],
		['target_component', 'uint8_t', false],
		['reason', 'uint8_t', false],
	];
}