import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavStandardMode} from '../enums/mav-standard-mode';
import {MavModeProperty} from '../enums/mav-mode-property';
/*
Information about a flight mode.

        The message can be enumerated to get information for all modes, or requested for a particular mode, using MAV_CMD_REQUEST_MESSAGE.
        Specify 0 in param2 to request that the message is emitted for all available modes or the specific index for just one mode.
        The modes must be available/settable for the current vehicle/frame type.
        Each mode should only be emitted once (even if it is both standard and custom).
        Note that the current mode should be emitted in CURRENT_MODE, and that if the mode list can change then AVAILABLE_MODES_MONITOR must be emitted on first change and subsequently streamed.
        See https://mavlink.io/en/services/standard_modes.html
*/
// number_modes The total number of available modes for the current vehicle type. uint8_t
// mode_index The current mode index within number_modes, indexed from 1. The index is not guaranteed to be persistent, and may change between reboots or if the set of modes change. uint8_t
// standard_mode Standard mode. uint8_t
// custom_mode A bitfield for use for autopilot-specific flags uint32_t
// properties Mode properties. uint32_t
// mode_name Name of custom mode, with null termination character. Should be omitted for standard modes. char
export class AvailableModes extends MAVLinkMessage {
	public number_modes!: number;
	public mode_index!: number;
	public standard_mode!: MavStandardMode;
	public custom_mode!: number;
	public properties!: MavModeProperty;
	public mode_name!: string;
	public _message_id: number = 435;
	public _message_name: string = 'AVAILABLE_MODES';
	public _crc_extra: number = 134;
	public _message_fields: [string, string, boolean][] = [
		['custom_mode', 'uint32_t', false],
		['properties', 'uint32_t', false],
		['number_modes', 'uint8_t', false],
		['mode_index', 'uint8_t', false],
		['standard_mode', 'uint8_t', false],
		['mode_name', 'char', false],
	];
}