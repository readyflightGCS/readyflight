export enum MavOdidOperatorLocationType {
	MAV_ODID_OPERATOR_LOCATION_TYPE_TAKEOFF = 0, // The location/altitude of the operator is the same as the take-off location.
	MAV_ODID_OPERATOR_LOCATION_TYPE_LIVE_GNSS = 1, // The location/altitude of the operator is dynamic. E.g. based on live GNSS data.
	MAV_ODID_OPERATOR_LOCATION_TYPE_FIXED = 2, // The location/altitude of the operator are fixed values.
	MAV_ODID_OPERATOR_LOCATION_TYPE_ENUM_END = 3, // 
}