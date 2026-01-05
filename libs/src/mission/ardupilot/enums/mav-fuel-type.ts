export enum MavFuelType {
	MAV_FUEL_TYPE_UNKNOWN = 0, // Not specified. Fuel levels are normalized (i.e. maximum is 1, and other levels are relative to 1).
	MAV_FUEL_TYPE_LIQUID = 1, // A generic liquid fuel. Fuel levels are in millilitres (ml). Fuel rates are in millilitres/second.
	MAV_FUEL_TYPE_GAS = 2, // A gas tank. Fuel levels are in kilo-Pascal (kPa), and flow rates are in milliliters per second (ml/s).
	MAV_FUEL_TYPE_ENUM_END = 3, // 
}