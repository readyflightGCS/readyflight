import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavMissionResult} from '../enums/mav-mission-result';
import {MavMissionType} from '../enums/mav-mission-type';
/*
Acknowledgment message during waypoint handling. The type field states if this message is a positive ack (type=0) or if an error happened (type=non-zero).
*/
// target_system System ID uint8_t
// target_component Component ID uint8_t
// type Mission result. uint8_t
// mission_type Mission type. uint8_t
// opaque_id Id of new on-vehicle mission, fence, or rally point plan (on upload to vehicle).
        The id is calculated and returned by a vehicle when a new plan is uploaded by a GCS.
        The only requirement on the id is that it must change when there is any change to the on-vehicle plan type (there is no requirement that the id be globally unique).
        0 on download from the vehicle to the GCS (on download the ID is set in MISSION_COUNT).
        0 if plan ids are not supported.
        The current on-vehicle plan ids are streamed in `MISSION_CURRENT`, allowing a GCS to determine if any part of the plan has changed and needs to be re-uploaded. uint32_t
export class MissionAck extends MAVLinkMessage {
	public target_system!: number;
	public target_component!: number;
	public type!: MavMissionResult;
	public mission_type!: MavMissionType;
	public opaque_id!: number;
	public _message_id: number = 47;
	public _message_name: string = 'MISSION_ACK';
	public _crc_extra: number = 153;
	public _message_fields: [string, string, boolean][] = [
		['target_system', 'uint8_t', false],
		['target_component', 'uint8_t', false],
		['type', 'uint8_t', false],
		['mission_type', 'uint8_t', true],
		['opaque_id', 'uint32_t', true],
	];
}