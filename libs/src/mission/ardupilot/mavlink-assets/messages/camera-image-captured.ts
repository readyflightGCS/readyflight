import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavBool} from '../enums/mav-bool';
/*
Information about a captured image. This is emitted every time a message is captured.
        MAV_CMD_REQUEST_MESSAGE can be used to (re)request this message for a specific sequence number or range of sequence numbers:
        MAV_CMD_REQUEST_MESSAGE.param2 indicates the sequence number the first image to send, or set to -1 to send the message for all sequence numbers.
        MAV_CMD_REQUEST_MESSAGE.param3 is used to specify a range of messages to send:
        set to 0 (default) to send just the the message for the sequence number in param 2,
        set to -1 to send the message for the sequence number in param 2 and all the following sequence numbers,
        set to the sequence number of the final message in the range.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// time_utc Timestamp (time since UNIX epoch) in UTC. 0 for unknown. uint64_t
// camera_id Camera id of a non-MAVLink camera attached to an autopilot (1-6).  0 if the component is a MAVLink camera (with its own component id). Field name is usually camera_device_id. uint8_t
// lat Latitude where image was taken int32_t
// lon Longitude where capture was taken int32_t
// alt Altitude (MSL) where image was taken int32_t
// relative_alt Altitude above ground int32_t
// q Quaternion of camera orientation (w, x, y, z order, zero-rotation is 1, 0, 0, 0) float
// image_index Zero based index of this image (i.e. a new image will have index CAMERA_CAPTURE_STATUS.image count -1) int32_t
// capture_result Image was captured successfully (MAV_BOOL_TRUE). Values not equal to 0 or 1 are invalid. int8_t
// file_url URL of image taken. Either local storage or http://foo.jpg if camera provides an HTTP interface. char
export class CameraImageCaptured extends MAVLinkMessage {
	public time_boot_ms!: number;
	public time_utc!: number;
	public camera_id!: number;
	public lat!: number;
	public lon!: number;
	public alt!: number;
	public relative_alt!: number;
	public q!: number;
	public image_index!: number;
	public capture_result!: MavBool;
	public file_url!: string;
	public _message_id: number = 263;
	public _message_name: string = 'CAMERA_IMAGE_CAPTURED';
	public _crc_extra: number = 133;
	public _message_fields: [string, string, boolean][] = [
		['time_utc', 'uint64_t', false],
		['time_boot_ms', 'uint32_t', false],
		['lat', 'int32_t', false],
		['lon', 'int32_t', false],
		['alt', 'int32_t', false],
		['relative_alt', 'int32_t', false],
		['q', 'float', false],
		['image_index', 'int32_t', false],
		['camera_id', 'uint8_t', false],
		['capture_result', 'int8_t', false],
		['file_url', 'char', false],
	];
}