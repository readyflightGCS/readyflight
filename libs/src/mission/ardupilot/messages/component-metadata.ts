import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Component metadata message, which may be requested using MAV_CMD_REQUEST_MESSAGE.

        This contains the MAVLink FTP URI and CRC for the component's general metadata file.
        The file must be hosted on the component, and may be xz compressed.
        The file CRC can be used for file caching.

        The general metadata file can be read to get the locations of other metadata files (COMP_METADATA_TYPE) and translations, which may be hosted either on the vehicle or the internet.
        For more information see: https://mavlink.io/en/services/component_information.html.

        Note: Camera components should use CAMERA_INFORMATION instead, and autopilots may use both this message and AUTOPILOT_VERSION.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// file_crc CRC32 of the general metadata file. uint32_t
// uri MAVLink FTP URI for the general metadata file (COMP_METADATA_TYPE_GENERAL), which may be compressed with xz. The file contains general component metadata, and may contain URI links for additional metadata (see COMP_METADATA_TYPE). The information is static from boot, and may be generated at compile time. The string needs to be zero terminated. char
export class ComponentMetadata extends MAVLinkMessage {
	public time_boot_ms!: number;
	public file_crc!: number;
	public uri!: string;
	public _message_id: number = 397;
	public _message_name: string = 'COMPONENT_METADATA';
	public _crc_extra: number = 182;
	public _message_fields: [string, string, boolean][] = [
		['time_boot_ms', 'uint32_t', false],
		['file_crc', 'uint32_t', false],
		['uri', 'char', false],
	];
}