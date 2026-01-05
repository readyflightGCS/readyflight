import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {IlluminatorMode} from '../enums/illuminator-mode';
import {IlluminatorErrorFlags} from '../enums/illuminator-error-flags';
/*
Illuminator status
*/
// uptime_ms Time since the start-up of the illuminator in ms uint32_t
// enable 0: Illuminators OFF, 1: Illuminators ON uint8_t
// mode_bitmask Supported illuminator modes uint8_t
// error_status Errors uint32_t
// mode Illuminator mode uint8_t
// brightness Illuminator brightness float
// strobe_period Illuminator strobing period in seconds float
// strobe_duty_cycle Illuminator strobing duty cycle float
// temp_c Temperature in Celsius float
// min_strobe_period Minimum strobing period in seconds float
// max_strobe_period Maximum strobing period in seconds float
export class IlluminatorStatus extends MAVLinkMessage {
	public uptime_ms!: number;
	public enable!: number;
	public mode_bitmask!: IlluminatorMode;
	public error_status!: IlluminatorErrorFlags;
	public mode!: IlluminatorMode;
	public brightness!: number;
	public strobe_period!: number;
	public strobe_duty_cycle!: number;
	public temp_c!: number;
	public min_strobe_period!: number;
	public max_strobe_period!: number;
	public _message_id: number = 440;
	public _message_name: string = 'ILLUMINATOR_STATUS';
	public _crc_extra: number = 66;
	public _message_fields: [string, string, boolean][] = [
		['uptime_ms', 'uint32_t', false],
		['error_status', 'uint32_t', false],
		['brightness', 'float', false],
		['strobe_period', 'float', false],
		['strobe_duty_cycle', 'float', false],
		['temp_c', 'float', false],
		['min_strobe_period', 'float', false],
		['max_strobe_period', 'float', false],
		['enable', 'uint8_t', false],
		['mode_bitmask', 'uint8_t', false],
		['mode', 'uint8_t', false],
	];
}