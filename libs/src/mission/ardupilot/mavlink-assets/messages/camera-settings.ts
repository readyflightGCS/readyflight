import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {CameraMode} from '../enums/camera-mode';
/*
Settings of a camera. Can be requested with a MAV_CMD_REQUEST_MESSAGE command.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// mode_id Camera mode uint8_t
// zoomLevel Current zoom level as a percentage of the full range (0.0 to 100.0, NaN if not known) float
// focusLevel Current focus level as a percentage of the full range (0.0 to 100.0, NaN if not known) float
// camera_device_id Camera id of a non-MAVLink camera attached to an autopilot (1-6).  0 if the component is a MAVLink camera (with its own component id). uint8_t
export class CameraSettings extends MAVLinkMessage {
	public time_boot_ms!: number;
	public mode_id!: CameraMode;
	public zoomLevel!: number;
	public focusLevel!: number;
	public camera_device_id!: number;
	public _message_id: number = 260;
	public _message_name: string = 'CAMERA_SETTINGS';
	public _crc_extra: number = 146;
	public _message_fields: [string, string, boolean][] = [
		['time_boot_ms', 'uint32_t', false],
		['mode_id', 'uint8_t', false],
		['zoomLevel', 'float', true],
		['focusLevel', 'float', true],
		['camera_device_id', 'uint8_t', true],
	];
}