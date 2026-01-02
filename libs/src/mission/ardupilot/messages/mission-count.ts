import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MavMissionType} from '../enums/mav-mission-type';
/*
This message is emitted as response to MISSION_REQUEST_LIST by the MAV and to initiate a write transaction. The GCS can then request the individual mission item based on the knowledge of the total number of waypoints.
*/
// target_system System ID uint8_t
// target_component Component ID uint8_t
// count Number of mission items in the sequence uint16_t
// mission_type Mission type. uint8_t
// opaque_id Id of current on-vehicle mission, fence, or rally point plan (on download from vehicle).
        This field is used when downloading a plan from a vehicle to a GCS.
        0 on upload to the vehicle from GCS.
        0 if plan ids are not supported.
        The current on-vehicle plan ids are streamed in `MISSION_CURRENT`, allowing a GCS to determine if any part of the plan has changed and needs to be re-uploaded.
        The ids are recalculated by the vehicle when any part of the on-vehicle plan changes (when a new plan is uploaded, the vehicle returns the new id to the GCS in MISSION_ACK). uint32_t
export class MissionCount extends MAVLinkMessage {
	public target_system!: number;
	public target_component!: number;
	public count!: number;
	public mission_type!: MavMissionType;
	public opaque_id!: number;
	public _message_id: number = 44;
	public _message_name: string = 'MISSION_COUNT';
	public _crc_extra: number = 221;
	public _message_fields: [string, string, boolean][] = [
		['count', 'uint16_t', false],
		['target_system', 'uint8_t', false],
		['target_component', 'uint8_t', false],
		['mission_type', 'uint8_t', true],
		['opaque_id', 'uint32_t', true],
	];
}