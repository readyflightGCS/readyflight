import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavBatteryFunction} from '../enums/mav-battery-function';
import {MavBatteryType} from '../enums/mav-battery-type';
/*
Battery information that is static, or requires infrequent update.
        This message should requested using MAV_CMD_REQUEST_MESSAGE and/or streamed at very low rate.
        BATTERY_STATUS_V2 is used for higher-rate battery status information.
*/
// id Battery ID uint8_t
// battery_function Function of the battery. uint8_t
// type Type (chemistry) of the battery. uint8_t
// state_of_health State of Health (SOH) estimate. Typically 100% at the time of manufacture and will decrease over time and use. -1: field not provided. uint8_t
// cells_in_series Number of battery cells in series. 0: field not provided. uint8_t
// cycle_count Lifetime count of the number of charge/discharge cycles (https://en.wikipedia.org/wiki/Charge_cycle). UINT16_MAX: field not provided. uint16_t
// weight Battery weight. 0: field not provided. uint16_t
// discharge_minimum_voltage Minimum per-cell voltage when discharging. 0: field not provided. float
// charging_minimum_voltage Minimum per-cell voltage when charging. 0: field not provided. float
// resting_minimum_voltage Minimum per-cell voltage when resting. 0: field not provided. float
// charging_maximum_voltage Maximum per-cell voltage when charged. 0: field not provided. float
// charging_maximum_current Maximum pack continuous charge current. 0: field not provided. float
// nominal_voltage Battery nominal voltage. Used for conversion between Wh and Ah. 0: field not provided. float
// discharge_maximum_current Maximum pack discharge current. 0: field not provided. float
// discharge_maximum_burst_current Maximum pack discharge burst current. 0: field not provided. float
// design_capacity Fully charged design capacity. 0: field not provided. float
// full_charge_capacity Predicted battery capacity when fully charged (accounting for battery degradation). NAN: field not provided. float
// manufacture_date Manufacture date (DDMMYYYY) in ASCII characters, 0 terminated. All 0: field not provided. char
// serial_number Serial number in ASCII characters, 0 terminated. All 0: field not provided. char
// name Battery device name. Formatted as manufacturer name then product name, separated with an underscore (in ASCII characters), 0 terminated. All 0: field not provided. char
export class BatteryInfo extends MAVLinkMessage {
	public id!: number;
	public battery_function!: MavBatteryFunction;
	public type!: MavBatteryType;
	public state_of_health!: number;
	public cells_in_series!: number;
	public cycle_count!: number;
	public weight!: number;
	public discharge_minimum_voltage!: number;
	public charging_minimum_voltage!: number;
	public resting_minimum_voltage!: number;
	public charging_maximum_voltage!: number;
	public charging_maximum_current!: number;
	public nominal_voltage!: number;
	public discharge_maximum_current!: number;
	public discharge_maximum_burst_current!: number;
	public design_capacity!: number;
	public full_charge_capacity!: number;
	public manufacture_date!: string;
	public serial_number!: string;
	public name!: string;
	public _message_id: number = 372;
	public _message_name: string = 'BATTERY_INFO';
	public _crc_extra: number = 26;
	public _message_fields: [string, string, boolean][] = [
		['discharge_minimum_voltage', 'float', false],
		['charging_minimum_voltage', 'float', false],
		['resting_minimum_voltage', 'float', false],
		['charging_maximum_voltage', 'float', false],
		['charging_maximum_current', 'float', false],
		['nominal_voltage', 'float', false],
		['discharge_maximum_current', 'float', false],
		['discharge_maximum_burst_current', 'float', false],
		['design_capacity', 'float', false],
		['full_charge_capacity', 'float', false],
		['cycle_count', 'uint16_t', false],
		['weight', 'uint16_t', false],
		['id', 'uint8_t', false],
		['battery_function', 'uint8_t', false],
		['type', 'uint8_t', false],
		['state_of_health', 'uint8_t', false],
		['cells_in_series', 'uint8_t', false],
		['manufacture_date', 'char', false],
		['serial_number', 'char', false],
		['name', 'char', false],
	];
}