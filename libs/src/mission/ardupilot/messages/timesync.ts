import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Time synchronization message.
        The message is used for both timesync requests and responses.
        The request is sent with `ts1=syncing component timestamp` and `tc1=0`, and may be broadcast or targeted to a specific system/component.
        The response is sent with `ts1=syncing component timestamp` (mirror back unchanged), and `tc1=responding component timestamp`, with the `target_system` and `target_component` set to ids of the original request.
        Systems can determine if they are receiving a request or response based on the value of `tc`.
        If the response has `target_system==target_component==0` the remote system has not been updated to use the component IDs and cannot reliably timesync; the requester may report an error.
        Timestamps are UNIX Epoch time or time since system boot in nanoseconds (the timestamp format can be inferred by checking for the magnitude of the number; generally it doesn't matter as only the offset is used).
        The message sequence is repeated numerous times with results being filtered/averaged to estimate the offset.
        See also: https://mavlink.io/en/services/timesync.html.
*/
// tc1 Time sync timestamp 1. Syncing: 0. Responding: Timestamp of responding component. int64_t
// ts1 Time sync timestamp 2. Timestamp of syncing component (mirrored in response). int64_t
// target_system Target system id. Request: 0 (broadcast) or id of specific system. Response must contain system id of the requesting component. uint8_t
// target_component Target component id. Request: 0 (broadcast) or id of specific component. Response must contain component id of the requesting component. uint8_t
export class Timesync extends MAVLinkMessage {
	public tc1!: number;
	public ts1!: number;
	public target_system!: number;
	public target_component!: number;
	public _message_id: number = 111;
	public _message_name: string = 'TIMESYNC';
	public _crc_extra: number = 34;
	public _message_fields: [string, string, boolean][] = [
		['tc1', 'int64_t', false],
		['ts1', 'int64_t', false],
		['target_system', 'uint8_t', true],
		['target_component', 'uint8_t', true],
	];
}