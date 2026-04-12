import {MAVLinkMessage} from 'node-mavlink';
import {readInt64LE, readUInt64LE} from 'node-mavlink';
/*
Set the mission item with sequence number seq as the current item and emit MISSION_CURRENT (whether or not the mission number changed).
        If a mission is currently being executed, the system will continue to this new mission item on the shortest path, skipping any intermediate mission items.
        Note that mission jump repeat counters are not reset (see MAV_CMD_DO_JUMP param2).

        This message may trigger a mission state-machine change on some systems: for example from MISSION_STATE_NOT_STARTED or MISSION_STATE_PAUSED to MISSION_STATE_ACTIVE.
        If the system is in mission mode, on those systems this command might therefore start, restart or resume the mission.
        If the system is not in mission mode this message must not trigger a switch to mission mode.
*/
// target_system System ID uint8_t
// target_component Component ID uint8_t
// seq Sequence uint16_t
export class MissionSetCurrent extends MAVLinkMessage {
	public target_system!: number;
	public target_component!: number;
	public seq!: number;
	public _message_id: number = 41;
	public _message_name: string = 'MISSION_SET_CURRENT';
	public _crc_extra: number = 28;
	public _message_fields: [string, string, boolean][] = [
		['seq', 'uint16_t', false],
		['target_system', 'uint8_t', false],
		['target_component', 'uint8_t', false],
	];
}