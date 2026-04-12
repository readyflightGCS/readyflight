import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Flight information.
        This includes time since boot for arm, takeoff, and land, and a flight number.
        Takeoff and landing values reset to zero on arm.
        This can be requested using MAV_CMD_REQUEST_MESSAGE.
        Note, some fields are misnamed - timestamps are from boot (not UTC) and the flight_uuid is a sequence number.
*/
// time_boot_ms Timestamp (time since system boot). uint32_t
// arming_time_utc Timestamp at arming (since system boot). Set to 0 on boot. Set value on arming. Note, field is misnamed UTC. uint64_t
// takeoff_time_utc Timestamp at takeoff (since system boot). Set to 0 at boot and on arming. Note, field is misnamed UTC. uint64_t
// flight_uuid Flight number. Note, field is misnamed UUID. uint64_t
// landing_time Timestamp at landing (in ms since system boot). Set to 0 at boot and on arming. uint32_t
export class FlightInformation extends MAVLinkMessage {
	public time_boot_ms!: number;
	public arming_time_utc!: number;
	public takeoff_time_utc!: number;
	public flight_uuid!: number;
	public landing_time!: number;
	public _message_id: number = 264;
	public _message_name: string = 'FLIGHT_INFORMATION';
	public _crc_extra: number = 49;
	public _message_fields: [string, string, boolean][] = [
		['arming_time_utc', 'uint64_t', false],
		['takeoff_time_utc', 'uint64_t', false],
		['flight_uuid', 'uint64_t', false],
		['time_boot_ms', 'uint32_t', false],
		['landing_time', 'uint32_t', true],
	];
}