import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Event message. Each new event from a particular component gets a new sequence number. The same message might be sent multiple times if (re-)requested. Most events are broadcast, some can be specific to a target component (as receivers keep track of the sequence for missed events, all events need to be broadcast. Thus we use destination_component instead of target_component).
*/
// destination_component Component ID uint8_t
// destination_system System ID uint8_t
// id Event ID (as defined in the component metadata) uint32_t
// event_time_boot_ms Timestamp (time since system boot when the event happened). uint32_t
// sequence Sequence number. uint16_t
// log_levels Log levels: 4 bits MSB: internal (for logging purposes), 4 bits LSB: external. Levels: Emergency = 0, Alert = 1, Critical = 2, Error = 3, Warning = 4, Notice = 5, Info = 6, Debug = 7, Protocol = 8, Disabled = 9 uint8_t
// arguments Arguments (depend on event ID). uint8_t
export class Event extends MAVLinkMessage {
	public destination_component!: number;
	public destination_system!: number;
	public id!: number;
	public event_time_boot_ms!: number;
	public sequence!: number;
	public log_levels!: number;
	public arguments!: number;
	public _message_id: number = 410;
	public _message_name: string = 'EVENT';
	public _crc_extra: number = 160;
	public _message_fields: [string, string, boolean][] = [
		['id', 'uint32_t', false],
		['event_time_boot_ms', 'uint32_t', false],
		['sequence', 'uint16_t', false],
		['destination_component', 'uint8_t', false],
		['destination_system', 'uint8_t', false],
		['log_levels', 'uint8_t', false],
		['arguments', 'uint8_t', false],
	];
}