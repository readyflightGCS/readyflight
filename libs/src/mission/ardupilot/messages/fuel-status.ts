import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavFuelType} from '../enums/mav-fuel-type';
/*
Fuel status.
        This message provides "generic" fuel level information for  in a GCS and for triggering failsafes in an autopilot.
        The fuel type and associated units for fields in this message are defined in the enum MAV_FUEL_TYPE.

        The reported `consumed_fuel` and `remaining_fuel` must only be supplied if measured: they must not be inferred from the `maximum_fuel` and the other value.
        A recipient can assume that if these fields are supplied they are accurate.
        If not provided, the recipient can infer `remaining_fuel` from `maximum_fuel` and `consumed_fuel` on the assumption that the fuel was initially at its maximum (this is what battery monitors assume).
        Note however that this is an assumption, and the UI should prompt the user appropriately (i.e. notify user that they should fill the tank before boot).

        This kind of information may also be sent in fuel-specific messages such as BATTERY_STATUS_V2.
        If both messages are sent for the same fuel system, the ids and corresponding information must match.

        This should be streamed (nominally at 0.1 Hz).
*/
// id Fuel ID. Must match ID of other messages for same fuel system, such as BATTERY_STATUS_V2. uint8_t
// maximum_fuel Capacity when full. Must be provided. float
// consumed_fuel Consumed fuel (measured). This value should not be inferred: if not measured set to NaN. NaN: field not provided. float
// remaining_fuel Remaining fuel until empty (measured). The value should not be inferred: if not measured set to NaN. NaN: field not provided. float
// percent_remaining Percentage of remaining fuel, relative to full. Values: [0-100], UINT8_MAX: field not provided. uint8_t
// flow_rate Positive value when emptying/using, and negative if filling/replacing. NaN: field not provided. float
// temperature Fuel temperature. NaN: field not provided. float
// fuel_type Fuel type. Defines units for fuel capacity and consumption fields above. uint32_t
export class FuelStatus extends MAVLinkMessage {
	public id!: number;
	public maximum_fuel!: number;
	public consumed_fuel!: number;
	public remaining_fuel!: number;
	public percent_remaining!: number;
	public flow_rate!: number;
	public temperature!: number;
	public fuel_type!: MavFuelType;
	public _message_id: number = 371;
	public _message_name: string = 'FUEL_STATUS';
	public _crc_extra: number = 10;
	public _message_fields: [string, string, boolean][] = [
		['maximum_fuel', 'float', false],
		['consumed_fuel', 'float', false],
		['remaining_fuel', 'float', false],
		['flow_rate', 'float', false],
		['temperature', 'float', false],
		['fuel_type', 'uint32_t', false],
		['id', 'uint8_t', false],
		['percent_remaining', 'uint8_t', false],
	];
}