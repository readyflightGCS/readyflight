import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavProtocolCapability} from '../enums/mav-protocol-capability';
/*
Basic component information data. Should be requested using MAV_CMD_REQUEST_MESSAGE on startup, or when required.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// capabilities Component capability flags uint64_t
// time_manufacture_s Date of manufacture as a UNIX Epoch time (since 1.1.1970) in seconds. uint32_t
// vendor_name Name of the component vendor. Needs to be zero terminated. The field is optional and can be empty/all zeros. char
// model_name Name of the component model. Needs to be zero terminated. The field is optional and can be empty/all zeros. char
// software_version Software version. The recommended format is SEMVER: 'major.minor.patch'  (any format may be used). The field must be zero terminated if it has a value. The field is optional and can be empty/all zeros. char
// hardware_version Hardware version. The recommended format is SEMVER: 'major.minor.patch'  (any format may be used). The field must be zero terminated if it has a value. The field is optional and can be empty/all zeros. char
// serial_number Hardware serial number. The field must be zero terminated if it has a value. The field is optional and can be empty/all zeros. char
export class ComponentInformationBasic extends MAVLinkMessage {
	public time_boot_ms!: number;
	public capabilities!: MavProtocolCapability;
	public time_manufacture_s!: number;
	public vendor_name!: string;
	public model_name!: string;
	public software_version!: string;
	public hardware_version!: string;
	public serial_number!: string;
	public _message_id: number = 396;
	public _message_name: string = 'COMPONENT_INFORMATION_BASIC';
	public _crc_extra: number = 50;
	public _message_fields: [string, string, boolean][] = [
		['capabilities', 'uint64_t', false],
		['time_boot_ms', 'uint32_t', false],
		['time_manufacture_s', 'uint32_t', false],
		['vendor_name', 'char', false],
		['model_name', 'char', false],
		['software_version', 'char', false],
		['hardware_version', 'char', false],
		['serial_number', 'char', false],
	];
}