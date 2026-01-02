import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavStandardMode} from '../enums/mav-standard-mode';
/*
Get the current mode.
        This should be emitted on any mode change, and broadcast at low rate (nominally 0.5 Hz).
        It may be requested using MAV_CMD_REQUEST_MESSAGE.
        See https://mavlink.io/en/services/standard_modes.html
*/
// standard_mode Standard mode. uint8_t
// custom_mode A bitfield for use for autopilot-specific flags uint32_t
// intended_custom_mode The custom_mode of the mode that was last commanded by the user (for example, with MAV_CMD_DO_SET_STANDARD_MODE, MAV_CMD_DO_SET_MODE or via RC). This should usually be the same as custom_mode. It will be different if the vehicle is unable to enter the intended mode, or has left that mode due to a failsafe condition. 0 indicates the intended custom mode is unknown/not supplied uint32_t
export class CurrentMode extends MAVLinkMessage {
	public standard_mode!: MavStandardMode;
	public custom_mode!: number;
	public intended_custom_mode!: number;
	public _message_id: number = 436;
	public _message_name: string = 'CURRENT_MODE';
	public _crc_extra: number = 193;
	public _message_fields: [string, string, boolean][] = [
		['custom_mode', 'uint32_t', false],
		['intended_custom_mode', 'uint32_t', false],
		['standard_mode', 'uint8_t', false],
	];
}