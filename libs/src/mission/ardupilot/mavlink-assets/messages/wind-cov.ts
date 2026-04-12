import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Wind estimate from vehicle. Note that despite the name, this message does not actually contain any covariances but instead variability and accuracy fields in terms of standard deviation (1-STD).
*/
// time_usec Timestamp (UNIX Epoch time or time since system boot). The receiving end can infer timestamp format (since 1.1.1970 or since system boot) by checking for the magnitude of the number. uint64_t
// wind_x Wind in North (NED) direction (NAN if unknown) float
// wind_y Wind in East (NED) direction (NAN if unknown) float
// wind_z Wind in down (NED) direction (NAN if unknown) float
// var_horiz Variability of wind in XY, 1-STD estimated from a 1 Hz lowpassed wind estimate (NAN if unknown) float
// var_vert Variability of wind in Z, 1-STD estimated from a 1 Hz lowpassed wind estimate (NAN if unknown) float
// wind_alt Altitude (MSL) that this measurement was taken at (NAN if unknown) float
// horiz_accuracy Horizontal speed 1-STD accuracy (0 if unknown) float
// vert_accuracy Vertical speed 1-STD accuracy (0 if unknown) float
export class WindCov extends MAVLinkMessage {
	public time_usec!: number;
	public wind_x!: number;
	public wind_y!: number;
	public wind_z!: number;
	public var_horiz!: number;
	public var_vert!: number;
	public wind_alt!: number;
	public horiz_accuracy!: number;
	public vert_accuracy!: number;
	public _message_id: number = 231;
	public _message_name: string = 'WIND_COV';
	public _crc_extra: number = 105;
	public _message_fields: [string, string, boolean][] = [
		['time_usec', 'uint64_t', false],
		['wind_x', 'float', false],
		['wind_y', 'float', false],
		['wind_z', 'float', false],
		['var_horiz', 'float', false],
		['var_vert', 'float', false],
		['wind_alt', 'float', false],
		['horiz_accuracy', 'float', false],
		['vert_accuracy', 'float', false],
	];
}