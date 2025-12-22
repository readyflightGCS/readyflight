import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavCmd} from '../enums/mav-cmd';
import {MavResult} from '../enums/mav-result';
/*
Report status of a command. Includes feedback whether the command was executed. The command microservice is documented at https://mavlink.io/en/services/command.html
*/
// command Command ID (of acknowledged command). uint16_t
// result Result of command. uint8_t
// progress The progress percentage when result is MAV_RESULT_IN_PROGRESS. Values: [0-100], or UINT8_MAX if the progress is unknown. uint8_t
// result_param2 Additional result information. Can be set with a command-specific enum containing command-specific error reasons for why the command might be denied. If used, the associated enum must be documented in the corresponding MAV_CMD (this enum should have a 0 value to indicate "unused" or "unknown"). int32_t
// target_system System ID of the target recipient. This is the ID of the system that sent the command for which this COMMAND_ACK is an acknowledgement. uint8_t
// target_component Component ID of the target recipient. This is the ID of the system that sent the command for which this COMMAND_ACK is an acknowledgement. uint8_t
export class CommandAck extends MAVLinkMessage {
	public command!: MavCmd;
	public result!: MavResult;
	public progress!: number;
	public result_param2!: number;
	public target_system!: number;
	public target_component!: number;
	public _message_id: number = 77;
	public _message_name: string = 'COMMAND_ACK';
	public _crc_extra: number = 143;
	public _message_fields: [string, string, boolean][] = [
		['command', 'uint16_t', false],
		['result', 'uint8_t', false],
		['progress', 'uint8_t', true],
		['result_param2', 'int32_t', true],
		['target_system', 'uint8_t', true],
		['target_component', 'uint8_t', true],
	];
}