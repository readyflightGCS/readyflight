export enum ComputerStatusFlags {
	COMPUTER_STATUS_FLAGS_UNDER_VOLTAGE = 1, // Indicates if the system is experiencing voltage outside of acceptable range.
	COMPUTER_STATUS_FLAGS_CPU_THROTTLE = 2, // Indicates if CPU throttling is active.
	COMPUTER_STATUS_FLAGS_THERMAL_THROTTLE = 4, // Indicates if thermal throttling is active.
	COMPUTER_STATUS_FLAGS_DISK_FULL = 8, // Indicates if main disk is full.
	COMPUTER_STATUS_FLAGS_ENUM_END = 9, // 
}