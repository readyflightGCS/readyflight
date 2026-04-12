export enum StorageUsageFlag {
	STORAGE_USAGE_FLAG_SET = 1, // Always set to 1 (indicates STORAGE_INFORMATION.storage_usage is supported).
	STORAGE_USAGE_FLAG_PHOTO = 2, // Storage for saving photos.
	STORAGE_USAGE_FLAG_VIDEO = 4, // Storage for saving videos.
	STORAGE_USAGE_FLAG_LOGS = 8, // Storage for saving logs.
	STORAGE_USAGE_FLAG_ENUM_END = 9, // 
}