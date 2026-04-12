import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {AirspeedSensorFlags} from '../enums/airspeed-sensor-flags';
/*
Airspeed information from a sensor.
*/
// id Sensor ID. uint8_t
// airspeed Calibrated airspeed (CAS). float
// temperature Temperature. int16_t
// raw_press Raw differential pressure. float
// flags Airspeed sensor flags. uint8_t
export class Airspeed extends MAVLinkMessage {
	public id!: number;
	public airspeed!: number;
	public temperature!: number;
	public raw_press!: number;
	public flags!: AirspeedSensorFlags;
	public _message_id: number = 295;
	public _message_name: string = 'AIRSPEED';
	public _crc_extra: number = 234;
	public _message_fields: [string, string, boolean][] = [
		['airspeed', 'float', false],
		['raw_press', 'float', false],
		['temperature', 'int16_t', false],
		['id', 'uint8_t', false],
		['flags', 'uint8_t', false],
	];
}