import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Manual (joystick) control message.
        This message represents movement axes and button using standard joystick axes nomenclature. Unused axes can be disabled and buttons states are transmitted as individual on/off bits of a bitmask. For more information see https://mavlink.io/en/manual_control.html
*/
// target The system to be controlled. uint8_t
// x X-axis, normalized to the range [-1000,1000]. A value of INT16_MAX indicates that this axis is invalid. Generally corresponds to forward(1000)-backward(-1000) movement on a joystick and the pitch of a vehicle. int16_t
// y Y-axis, normalized to the range [-1000,1000]. A value of INT16_MAX indicates that this axis is invalid. Generally corresponds to left(-1000)-right(1000) movement on a joystick and the roll of a vehicle. int16_t
// z Z-axis, normalized to the range [-1000,1000]. A value of INT16_MAX indicates that this axis is invalid. Generally corresponds to a separate slider movement with maximum being 1000 and minimum being -1000 on a joystick and the thrust of a vehicle. Positive values are positive thrust, negative values are negative thrust. int16_t
// r R-axis, normalized to the range [-1000,1000]. A value of INT16_MAX indicates that this axis is invalid. Generally corresponds to a twisting of the joystick, with counter-clockwise being 1000 and clockwise being -1000, and the yaw of a vehicle. int16_t
// buttons A bitfield corresponding to the joystick buttons' 0-15 current state, 1 for pressed, 0 for released. The lowest bit corresponds to Button 1. uint16_t
// buttons2 A bitfield corresponding to the joystick buttons' 16-31 current state, 1 for pressed, 0 for released. The lowest bit corresponds to Button 16. uint16_t
// enabled_extensions Set bits to 1 to indicate which of the following extension fields contain valid data: bit 0: pitch, bit 1: roll, bit 2: aux1, bit 3: aux2, bit 4: aux3, bit 5: aux4, bit 6: aux5, bit 7: aux6 uint8_t
// s Pitch-only-axis, normalized to the range [-1000,1000]. Generally corresponds to pitch on vehicles with additional degrees of freedom. Valid if bit 0 of enabled_extensions field is set. Set to 0 if invalid. int16_t
// t Roll-only-axis, normalized to the range [-1000,1000]. Generally corresponds to roll on vehicles with additional degrees of freedom. Valid if bit 1 of enabled_extensions field is set. Set to 0 if invalid. int16_t
// aux1 Aux continuous input field 1. Normalized in the range [-1000,1000]. Purpose defined by recipient. Valid data if bit 2 of enabled_extensions field is set. 0 if bit 2 is unset. int16_t
// aux2 Aux continuous input field 2. Normalized in the range [-1000,1000]. Purpose defined by recipient. Valid data if bit 3 of enabled_extensions field is set. 0 if bit 3 is unset. int16_t
// aux3 Aux continuous input field 3. Normalized in the range [-1000,1000]. Purpose defined by recipient. Valid data if bit 4 of enabled_extensions field is set. 0 if bit 4 is unset. int16_t
// aux4 Aux continuous input field 4. Normalized in the range [-1000,1000]. Purpose defined by recipient. Valid data if bit 5 of enabled_extensions field is set. 0 if bit 5 is unset. int16_t
// aux5 Aux continuous input field 5. Normalized in the range [-1000,1000]. Purpose defined by recipient. Valid data if bit 6 of enabled_extensions field is set. 0 if bit 6 is unset. int16_t
// aux6 Aux continuous input field 6. Normalized in the range [-1000,1000]. Purpose defined by recipient. Valid data if bit 7 of enabled_extensions field is set. 0 if bit 7 is unset. int16_t
export class ManualControl extends MAVLinkMessage {
	public target!: number;
	public x!: number;
	public y!: number;
	public z!: number;
	public r!: number;
	public buttons!: number;
	public buttons2!: number;
	public enabled_extensions!: number;
	public s!: number;
	public t!: number;
	public aux1!: number;
	public aux2!: number;
	public aux3!: number;
	public aux4!: number;
	public aux5!: number;
	public aux6!: number;
	public _message_id: number = 69;
	public _message_name: string = 'MANUAL_CONTROL';
	public _crc_extra: number = 243;
	public _message_fields: [string, string, boolean][] = [
		['x', 'int16_t', false],
		['y', 'int16_t', false],
		['z', 'int16_t', false],
		['r', 'int16_t', false],
		['buttons', 'uint16_t', false],
		['target', 'uint8_t', false],
		['buttons2', 'uint16_t', true],
		['enabled_extensions', 'uint8_t', true],
		['s', 'int16_t', true],
		['t', 'int16_t', true],
		['aux1', 'int16_t', true],
		['aux2', 'int16_t', true],
		['aux3', 'int16_t', true],
		['aux4', 'int16_t', true],
		['aux5', 'int16_t', true],
		['aux6', 'int16_t', true],
	];
}