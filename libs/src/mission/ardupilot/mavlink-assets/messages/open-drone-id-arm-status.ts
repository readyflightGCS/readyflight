import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavOdidArmStatus} from '../enums/mav-odid-arm-status';
/*
Transmitter (remote ID system) is enabled and ready to start sending location and other required information. This is streamed by transmitter. A flight controller uses it as a condition to arm.
*/
// status Status level indicating if arming is allowed. uint8_t
// error Text error message, should be empty if status is good to arm. Fill with nulls in unused portion. char
export class OpenDroneIdArmStatus extends MAVLinkMessage {
	public status!: MavOdidArmStatus;
	public error!: string;
	public _message_id: number = 12918;
	public _message_name: string = 'OPEN_DRONE_ID_ARM_STATUS';
	public _crc_extra: number = 139;
	public _message_fields: [string, string, boolean][] = [
		['status', 'uint8_t', false],
		['error', 'char', false],
	];
}