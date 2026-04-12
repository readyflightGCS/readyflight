export enum RebootShutdownAction {
	REBOOT_SHUTDOWN_ACTION_NONE = 0, // Do nothing.
	REBOOT_SHUTDOWN_ACTION_REBOOT = 1, // Reboot component.
	REBOOT_SHUTDOWN_ACTION_SHUTDOWN = 2, // Shutdown component.
	REBOOT_SHUTDOWN_ACTION_REBOOT_TO_BOOTLOADER = 3, // Reboot component and keep it in the bootloader until upgraded.
	REBOOT_SHUTDOWN_ACTION_POWER_ON = 4, // Power on component. Do nothing if component is already powered (ACK command with MAV_RESULT_ACCEPTED).
	REBOOT_SHUTDOWN_ACTION_ENUM_END = 5, // 
}