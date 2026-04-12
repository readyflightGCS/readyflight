export enum RebootShutdownConditions {
	REBOOT_SHUTDOWN_CONDITIONS_SAFETY_INTERLOCKED = 0, // Reboot/Shutdown only if allowed by safety checks, such as being landed.
	REBOOT_SHUTDOWN_CONDITIONS_FORCE = 20190226, // Force reboot/shutdown of the autopilot/component regardless of system state.
	REBOOT_SHUTDOWN_CONDITIONS_ENUM_END = 20190227, // 
}