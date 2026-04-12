import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavParamError} from '../enums/mav-param-error';
/*
Parameter set/get error. Returned from a MAVLink node in response to an error in the parameter protocol, for example failing to set a parameter because it does not exist.
*/
// target_system System ID uint8_t
// target_component Component ID uint8_t
// param_id Parameter id. Terminated by NULL if the length is less than 16 human-readable chars and WITHOUT null termination (NULL) byte if the length is exactly 16 chars - applications have to provide 16+1 bytes storage if the ID is stored as string char
// param_index Parameter index. Will be -1 if the param ID field should be used as an identifier (else the param id will be ignored) int16_t
// error Error being returned to client. uint8_t
export class ParamError extends MAVLinkMessage {
	public target_system!: number;
	public target_component!: number;
	public param_id!: string;
	public param_index!: number;
	public error!: MavParamError;
	public _message_id: number = 345;
	public _message_name: string = 'PARAM_ERROR';
	public _crc_extra: number = 209;
	public _message_fields: [string, string, boolean][] = [
		['param_index', 'int16_t', false],
		['target_system', 'uint8_t', false],
		['target_component', 'uint8_t', false],
		['param_id', 'char', false],
		['error', 'uint8_t', false],
	];
}