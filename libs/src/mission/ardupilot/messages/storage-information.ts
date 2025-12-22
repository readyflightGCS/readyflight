import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {StorageStatus} from '../enums/storage-status';
import {StorageType} from '../enums/storage-type';
import {StorageUsageFlag} from '../enums/storage-usage-flag';
/*
Information about a storage medium. This message is sent in response to a request with MAV_CMD_REQUEST_MESSAGE and whenever the status of the storage changes (STORAGE_STATUS). Use MAV_CMD_REQUEST_MESSAGE.param2 to indicate the index/id of requested storage: 0 for all, 1 for first, 2 for second, etc.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// storage_id Storage ID (1 for first, 2 for second, etc.) uint8_t
// storage_count Number of storage devices uint8_t
// status Status of storage uint8_t
// total_capacity Total capacity. If storage is not ready (STORAGE_STATUS_READY) value will be ignored. float
// used_capacity Used capacity. If storage is not ready (STORAGE_STATUS_READY) value will be ignored. float
// available_capacity Available storage capacity. If storage is not ready (STORAGE_STATUS_READY) value will be ignored. float
// read_speed Read speed. float
// write_speed Write speed. float
// type Type of storage uint8_t
// name Textual storage name to be used in UI (microSD 1, Internal Memory, etc.) This is a NULL terminated string. If it is exactly 32 characters long, add a terminating NULL. If this string is empty, the generic type is shown to the user. char
// storage_usage Flags indicating whether this instance is preferred storage for photos, videos, etc.
        Note: Implementations should initially set the flags on the system-default storage id used for saving media (if possible/supported).
        This setting can then be overridden using MAV_CMD_SET_STORAGE_USAGE.
        If the media usage flags are not set, a GCS may assume storage ID 1 is the default storage for all media types. uint8_t
export class StorageInformation extends MAVLinkMessage {
	public time_boot_ms!: number;
	public storage_id!: number;
	public storage_count!: number;
	public status!: StorageStatus;
	public total_capacity!: number;
	public used_capacity!: number;
	public available_capacity!: number;
	public read_speed!: number;
	public write_speed!: number;
	public type!: StorageType;
	public name!: string;
	public storage_usage!: StorageUsageFlag;
	public _message_id: number = 261;
	public _message_name: string = 'STORAGE_INFORMATION';
	public _crc_extra: number = 179;
	public _message_fields: [string, string, boolean][] = [
		['time_boot_ms', 'uint32_t', false],
		['total_capacity', 'float', false],
		['used_capacity', 'float', false],
		['available_capacity', 'float', false],
		['read_speed', 'float', false],
		['write_speed', 'float', false],
		['storage_id', 'uint8_t', false],
		['storage_count', 'uint8_t', false],
		['status', 'uint8_t', false],
		['type', 'uint8_t', true],
		['name', 'char', true],
		['storage_usage', 'uint8_t', true],
	];
}