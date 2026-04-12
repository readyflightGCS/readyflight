export enum AirspeedSensorFlags {
	AIRSPEED_SENSOR_UNHEALTHY = 1, // Airspeed sensor is unhealthy
	AIRSPEED_SENSOR_USING = 2, // True if the data from this sensor is being actively used by the flight controller for guidance, navigation or control.
	AIRSPEED_SENSOR_FLAGS_ENUM_END = 3, // 
}