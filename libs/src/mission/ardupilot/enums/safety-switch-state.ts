export enum SafetySwitchState {
	SAFETY_SWITCH_STATE_SAFE = 0, // Safety switch is engaged and vehicle should be safe to approach.
	SAFETY_SWITCH_STATE_DANGEROUS = 1, // Safety switch is NOT engaged and motors, propellers and other actuators should be considered active.
	SAFETY_SWITCH_STATE_ENUM_END = 2, // 
}