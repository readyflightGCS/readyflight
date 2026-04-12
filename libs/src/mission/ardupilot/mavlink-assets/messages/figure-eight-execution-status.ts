import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavFrame} from '../enums/mav-frame';
/*
Vehicle status report that is sent out while figure eight execution is in progress (see MAV_CMD_DO_FIGURE_EIGHT).
        This may typically send at low rates: of the order of 2Hz.
*/
// time_usec Timestamp (UNIX Epoch time or time since system boot). The receiving end can infer timestamp format (since 1.1.1970 or since system boot) by checking for the magnitude of the number. uint64_t
// major_radius Major axis radius of the figure eight. Positive: orbit the north circle clockwise. Negative: orbit the north circle counter-clockwise. float
// minor_radius Minor axis radius of the figure eight. Defines the radius of two circles that make up the figure. float
// orientation Orientation of the figure eight major axis with respect to true north in [-pi,pi). float
// frame The coordinate system of the fields: x, y, z. uint8_t
// x X coordinate of center point. Coordinate system depends on frame field. int32_t
// y Y coordinate of center point. Coordinate system depends on frame field. int32_t
// z Altitude of center point. Coordinate system depends on frame field. float
export class FigureEightExecutionStatus extends MAVLinkMessage {
	public time_usec!: number;
	public major_radius!: number;
	public minor_radius!: number;
	public orientation!: number;
	public frame!: MavFrame;
	public x!: number;
	public y!: number;
	public z!: number;
	public _message_id: number = 361;
	public _message_name: string = 'FIGURE_EIGHT_EXECUTION_STATUS';
	public _crc_extra: number = 93;
	public _message_fields: [string, string, boolean][] = [
		['time_usec', 'uint64_t', false],
		['major_radius', 'float', false],
		['minor_radius', 'float', false],
		['orientation', 'float', false],
		['x', 'int32_t', false],
		['y', 'int32_t', false],
		['z', 'float', false],
		['frame', 'uint8_t', false],
	];
}