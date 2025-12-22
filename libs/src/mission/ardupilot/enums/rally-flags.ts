export enum RallyFlags {
	FAVORABLE_WIND = 1, // Flag set when requiring favorable winds for landing.
	LAND_IMMEDIATELY = 2, // Flag set when plane is to immediately descend to break altitude and land without GCS intervention. Flag not set when plane is to loiter at Rally point until commanded to land.
	ALT_FRAME_VALID = 4, // True if the following altitude frame value is valid.
	ALT_FRAME = 24, // 2 bit value representing altitude frame. 0: absolute, 1: relative home, 2: relative origin, 3: relative terrain
	RALLY_FLAGS_ENUM_END = 25, // 
}