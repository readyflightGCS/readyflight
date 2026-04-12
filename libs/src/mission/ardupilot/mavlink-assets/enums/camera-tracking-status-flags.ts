export enum CameraTrackingStatusFlags {
	CAMERA_TRACKING_STATUS_FLAGS_IDLE = 0, // Camera is not tracking
	CAMERA_TRACKING_STATUS_FLAGS_ACTIVE = 1, // Camera is tracking
	CAMERA_TRACKING_STATUS_FLAGS_ERROR = 2, // Camera tracking in error state
	CAMERA_TRACKING_STATUS_FLAGS_MTI = 4, // Camera Moving Target Indicators (MTI) are active
	CAMERA_TRACKING_STATUS_FLAGS_COASTING = 8, // Camera tracking target is obscured and is being predicted
	CAMERA_TRACKING_STATUS_FLAGS_ENUM_END = 9, // 
}