export enum CompMetadataType {
	COMP_METADATA_TYPE_GENERAL = 0, // General information about the component. General metadata includes information about other metadata types supported by the component. Files of this type must be supported, and must be downloadable from vehicle using a MAVLink FTP URI.
	COMP_METADATA_TYPE_PARAMETER = 1, // Parameter meta data.
	COMP_METADATA_TYPE_COMMANDS = 2, // Meta data that specifies which commands and command parameters the vehicle supports. (WIP)
	COMP_METADATA_TYPE_PERIPHERALS = 3, // Meta data that specifies external non-MAVLink peripherals.
	COMP_METADATA_TYPE_EVENTS = 4, // Meta data for the events interface.
	COMP_METADATA_TYPE_ACTUATORS = 5, // Meta data for actuator configuration (motors, servos and vehicle geometry) and testing.
	COMP_METADATA_TYPE_ENUM_END = 6, // 
}