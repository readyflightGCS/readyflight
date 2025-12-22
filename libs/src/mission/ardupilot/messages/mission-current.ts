import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
import {MissionState} from '../enums/mission-state';
/*
Message that announces the sequence number of the current target mission item (that the system will fly towards/execute when the mission is running).
        This message should be streamed all the time (nominally at 1Hz).
        This message should be emitted following a call to MAV_CMD_DO_SET_MISSION_CURRENT or MISSION_SET_CURRENT.
*/
// seq Sequence uint16_t
// total Total number of mission items on vehicle (on last item, sequence == total). If the autopilot stores its home location as part of the mission this will be excluded from the total. 0: Not supported, UINT16_MAX if no mission is present on the vehicle. uint16_t
// mission_state Mission state machine state. MISSION_STATE_UNKNOWN if state reporting not supported. uint8_t
// mission_mode Vehicle is in a mode that can execute mission items or suspended. 0: Unknown, 1: In mission mode, 2: Suspended (not in mission mode). uint8_t
// mission_id Id of current on-vehicle mission plan, or 0 if IDs are not supported or there is no mission loaded. GCS can use this to track changes to the mission plan type. The same value is returned on mission upload (in the MISSION_ACK). uint32_t
// fence_id Id of current on-vehicle fence plan, or 0 if IDs are not supported or there is no fence loaded. GCS can use this to track changes to the fence plan type. The same value is returned on fence upload (in the MISSION_ACK). uint32_t
// rally_points_id Id of current on-vehicle rally point plan, or 0 if IDs are not supported or there are no rally points loaded. GCS can use this to track changes to the rally point plan type. The same value is returned on rally point upload (in the MISSION_ACK). uint32_t
export class MissionCurrent extends MAVLinkMessage {
	public seq!: number;
	public total!: number;
	public mission_state!: MissionState;
	public mission_mode!: number;
	public mission_id!: number;
	public fence_id!: number;
	public rally_points_id!: number;
	public _message_id: number = 42;
	public _message_name: string = 'MISSION_CURRENT';
	public _crc_extra: number = 28;
	public _message_fields: [string, string, boolean][] = [
		['seq', 'uint16_t', false],
		['total', 'uint16_t', true],
		['mission_state', 'uint8_t', true],
		['mission_mode', 'uint8_t', true],
		['mission_id', 'uint32_t', true],
		['fence_id', 'uint32_t', true],
		['rally_points_id', 'uint32_t', true],
	];
}