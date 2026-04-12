export enum IlluminatorMode {
	ILLUMINATOR_MODE_UNKNOWN = 0, // Illuminator mode is not specified/unknown
	ILLUMINATOR_MODE_INTERNAL_CONTROL = 1, // Illuminator behavior is controlled by MAV_CMD_DO_ILLUMINATOR_CONFIGURE settings
	ILLUMINATOR_MODE_EXTERNAL_SYNC = 2, // Illuminator behavior is controlled by external factors: e.g. an external hardware signal
	ILLUMINATOR_MODE_ENUM_END = 3, // 
}