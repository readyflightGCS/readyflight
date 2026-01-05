export enum MavWinchStatusFlag {
	MAV_WINCH_STATUS_HEALTHY = 1, // Winch is healthy
	MAV_WINCH_STATUS_FULLY_RETRACTED = 2, // Winch line is fully retracted
	MAV_WINCH_STATUS_MOVING = 4, // Winch motor is moving
	MAV_WINCH_STATUS_CLUTCH_ENGAGED = 8, // Winch clutch is engaged allowing motor to move freely.
	MAV_WINCH_STATUS_LOCKED = 16, // Winch is locked by locking mechanism.
	MAV_WINCH_STATUS_DROPPING = 32, // Winch is gravity dropping payload.
	MAV_WINCH_STATUS_ARRESTING = 64, // Winch is arresting payload descent.
	MAV_WINCH_STATUS_GROUND_SENSE = 128, // Winch is using torque measurements to sense the ground.
	MAV_WINCH_STATUS_RETRACTING = 256, // Winch is returning to the fully retracted position.
	MAV_WINCH_STATUS_REDELIVER = 512, // Winch is redelivering the payload. This is a failover state if the line tension goes above a threshold during RETRACTING.
	MAV_WINCH_STATUS_ABANDON_LINE = 1024, // Winch is abandoning the line and possibly payload. Winch unspools the entire calculated line length. This is a failover state from REDELIVER if the number of attempts exceeds a threshold.
	MAV_WINCH_STATUS_LOCKING = 2048, // Winch is engaging the locking mechanism.
	MAV_WINCH_STATUS_LOAD_LINE = 4096, // Winch is spooling on line.
	MAV_WINCH_STATUS_LOAD_PAYLOAD = 8192, // Winch is loading a payload.
	MAV_WINCH_STATUS_FLAG_ENUM_END = 8193, // 
}