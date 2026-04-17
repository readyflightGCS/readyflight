export enum PreflightStorageMissionAction {
	MISSION_READ_PERSISTENT = 0, // Read current mission data from persistent storage
	MISSION_WRITE_PERSISTENT = 1, // Write current mission data to persistent storage
	MISSION_RESET_DEFAULT = 2, // Erase all mission data stored on the vehicle (both persistent and volatile storage)
	PREFLIGHT_STORAGE_MISSION_ACTION_ENUM_END = 3, // 
}