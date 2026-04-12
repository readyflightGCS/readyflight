import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
The system time is the time of the sender's master clock.
        This can be emitted by flight controllers, onboard computers, or other components in the MAVLink network.
        Components that are using a less reliable time source, such as a battery-backed real time clock, can choose to match their system clock to that of a system that indicates a more recent time.
        This allows more broadly accurate date stamping of logs, and so on.
        If precise time synchronization is needed then use TIMESYNC instead.
*/
// time_unix_usec Timestamp (UNIX epoch time). uint64_t
// time_boot_ms Timestamp (time since system boot). uint32_t
export class SystemTime extends MAVLinkMessage {
	public time_unix_usec!: number;
	public time_boot_ms!: number;
	public _message_id: number = 2;
	public _message_name: string = 'SYSTEM_TIME';
	public _crc_extra: number = 137;
	public _message_fields: [string, string, boolean][] = [
		['time_unix_usec', 'uint64_t', false],
		['time_boot_ms', 'uint32_t', false],
	];
}