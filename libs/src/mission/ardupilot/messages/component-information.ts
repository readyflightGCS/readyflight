import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Component information message, which may be requested using MAV_CMD_REQUEST_MESSAGE.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// general_metadata_file_crc CRC32 of the general metadata file (general_metadata_uri). uint32_t
// general_metadata_uri MAVLink FTP URI for the general metadata file (COMP_METADATA_TYPE_GENERAL), which may be compressed with xz. The file contains general component metadata, and may contain URI links for additional metadata (see COMP_METADATA_TYPE). The information is static from boot, and may be generated at compile time. The string needs to be zero terminated. char
// peripherals_metadata_file_crc CRC32 of peripherals metadata file (peripherals_metadata_uri). uint32_t
// peripherals_metadata_uri (Optional) MAVLink FTP URI for the peripherals metadata file (COMP_METADATA_TYPE_PERIPHERALS), which may be compressed with xz. This contains data about "attached components" such as UAVCAN nodes. The peripherals are in a separate file because the information must be generated dynamically at runtime. The string needs to be zero terminated. char
export class ComponentInformation extends MAVLinkMessage {
	public time_boot_ms!: number;
	public general_metadata_file_crc!: number;
	public general_metadata_uri!: string;
	public peripherals_metadata_file_crc!: number;
	public peripherals_metadata_uri!: string;
	public _message_id: number = 395;
	public _message_name: string = 'COMPONENT_INFORMATION';
	public _crc_extra: number = 0;
	public _message_fields: [string, string, boolean][] = [
		['time_boot_ms', 'uint32_t', false],
		['general_metadata_file_crc', 'uint32_t', false],
		['peripherals_metadata_file_crc', 'uint32_t', false],
		['general_metadata_uri', 'char', false],
		['peripherals_metadata_uri', 'char', false],
	];
}