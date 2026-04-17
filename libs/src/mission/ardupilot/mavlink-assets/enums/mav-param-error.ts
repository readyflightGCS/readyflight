export enum MavParamError {
	MAV_PARAM_ERROR_NO_ERROR = 0, // No error occurred (not expected in PARAM_ERROR but may be used in future implementations.
	MAV_PARAM_ERROR_DOES_NOT_EXIST = 1, // Parameter does not exist
	MAV_PARAM_ERROR_VALUE_OUT_OF_RANGE = 2, // Parameter value does not fit within accepted range
	MAV_PARAM_ERROR_PERMISSION_DENIED = 3, // Caller is not permitted to set the value of this parameter
	MAV_PARAM_ERROR_COMPONENT_NOT_FOUND = 4, // Unknown component specified
	MAV_PARAM_ERROR_READ_ONLY = 5, // Parameter is read-only
	MAV_PARAM_ERROR_TYPE_UNSUPPORTED = 6, // Parameter data type (MAV_PARAM_TYPE) is not supported by flight stack (at all)
	MAV_PARAM_ERROR_TYPE_MISMATCH = 7, // Parameter type does not match expected type
	MAV_PARAM_ERROR_READ_FAIL = 8, // Parameter exists but reading failed
	MAV_PARAM_ERROR_ENUM_END = 9, // 
}