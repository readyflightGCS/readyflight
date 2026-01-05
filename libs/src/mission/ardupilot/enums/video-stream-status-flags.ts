export enum VideoStreamStatusFlags {
	VIDEO_STREAM_STATUS_FLAGS_RUNNING = 1, // Stream is active (running)
	VIDEO_STREAM_STATUS_FLAGS_THERMAL = 2, // Stream is thermal imaging
	VIDEO_STREAM_STATUS_FLAGS_THERMAL_RANGE_ENABLED = 4, // Stream can report absolute thermal range (see CAMERA_THERMAL_RANGE).
	VIDEO_STREAM_STATUS_FLAGS_ENUM_END = 5, // 
}