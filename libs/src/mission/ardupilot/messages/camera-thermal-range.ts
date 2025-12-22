import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Camera absolute thermal range. This can be streamed when the associated VIDEO_STREAM_STATUS `flag` field bit VIDEO_STREAM_STATUS_FLAGS_THERMAL_RANGE_ENABLED is set, but a GCS may choose to only request it for the current active stream. Use MAV_CMD_SET_MESSAGE_INTERVAL to define message interval (param3 indicates the stream id of the current camera, or 0 for all streams, param4 indicates the target camera_device_id for autopilot-attached cameras or 0 for MAVLink cameras).
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// stream_id Video Stream ID (1 for first, 2 for second, etc.) uint8_t
// camera_device_id Camera id of a non-MAVLink camera attached to an autopilot (1-6).  0 if the component is a MAVLink camera (with its own component id). uint8_t
// max Temperature max. float
// max_point_x Temperature max point x value (normalized 0..1, 0 is left, 1 is right), NAN if unknown. float
// max_point_y Temperature max point y value (normalized 0..1, 0 is top, 1 is bottom), NAN if unknown. float
// min Temperature min. float
// min_point_x Temperature min point x value (normalized 0..1, 0 is left, 1 is right), NAN if unknown. float
// min_point_y Temperature min point y value (normalized 0..1, 0 is top, 1 is bottom), NAN if unknown. float
export class CameraThermalRange extends MAVLinkMessage {
	public time_boot_ms!: number;
	public stream_id!: number;
	public camera_device_id!: number;
	public max!: number;
	public max_point_x!: number;
	public max_point_y!: number;
	public min!: number;
	public min_point_x!: number;
	public min_point_y!: number;
	public _message_id: number = 277;
	public _message_name: string = 'CAMERA_THERMAL_RANGE';
	public _crc_extra: number = 62;
	public _message_fields: [string, string, boolean][] = [
		['time_boot_ms', 'uint32_t', false],
		['max', 'float', false],
		['max_point_x', 'float', false],
		['max_point_y', 'float', false],
		['min', 'float', false],
		['min_point_x', 'float', false],
		['min_point_y', 'float', false],
		['stream_id', 'uint8_t', false],
		['camera_device_id', 'uint8_t', false],
	];
}