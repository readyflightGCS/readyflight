export enum ActuatorConfiguration {
	ACTUATOR_CONFIGURATION_NONE = 0, // Do nothing.
	ACTUATOR_CONFIGURATION_BEEP = 1, // Command the actuator to beep now.
	ACTUATOR_CONFIGURATION_3D_MODE_ON = 2, // Permanently set the actuator (ESC) to 3D mode (reversible thrust).
	ACTUATOR_CONFIGURATION_3D_MODE_OFF = 3, // Permanently set the actuator (ESC) to non 3D mode (non-reversible thrust).
	ACTUATOR_CONFIGURATION_SPIN_DIRECTION1 = 4, // Permanently set the actuator (ESC) to spin direction 1 (which can be clockwise or counter-clockwise).
	ACTUATOR_CONFIGURATION_SPIN_DIRECTION2 = 5, // Permanently set the actuator (ESC) to spin direction 2 (opposite of direction 1).
	ACTUATOR_CONFIGURATION_ENUM_END = 6, // 
}