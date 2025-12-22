export enum PreflightStorageParameterAction {
	PARAM_READ_PERSISTENT = 0, // Read all parameters from persistent storage. Replaces values in volatile storage.
	PARAM_WRITE_PERSISTENT = 1, // Write all parameter values to persistent storage (flash/EEPROM)
	PARAM_RESET_CONFIG_DEFAULT = 2, // Reset all user configurable parameters to their default value (including airframe selection, sensor calibration data, safety settings, and so on). Does not reset values that contain operation counters and vehicle computed statistics.
	PARAM_RESET_SENSOR_DEFAULT = 3, // Reset only sensor calibration parameters to factory defaults (or firmware default if not available)
	PARAM_RESET_ALL_DEFAULT = 4, // Reset all parameters, including operation counters, to default values
	PREFLIGHT_STORAGE_PARAMETER_ACTION_ENUM_END = 5, // 
}