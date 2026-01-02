import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Send a key-value pair as string. The use of this message is discouraged for normal packets, but a quite efficient way for testing new messages and getting experimental debug output.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// name Name of the debug variable char
// value Value of the debug variable char
export class NamedValueString extends MAVLinkMessage {
	public time_boot_ms!: number;
	public name!: string;
	public value!: string;
	public _message_id: number = 11060;
	public _message_name: string = 'NAMED_VALUE_STRING';
	public _crc_extra: number = 162;
	public _message_fields: [string, string, boolean][] = [
		['time_boot_ms', 'uint32_t', false],
		['name', 'char', false],
		['value', 'char', false],
	];
}