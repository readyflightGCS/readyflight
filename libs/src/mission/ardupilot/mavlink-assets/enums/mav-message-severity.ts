export enum MavMessageSeverity {
    MAV_SEVERITY_EMERGENCY = 0,
    MAV_SEVERITY_ALERT = 1,
    MAV_SEVERITY_CRITICAL = 2,
    MAV_SEVERITY_ERROR = 3,
    MAV_SEVERITY_WARNING = 4,
    MAV_SEVERITY_NOTICE = 5,
    MAV_SEVERITY_INFO = 6,
    MAV_SEVERITY_DEBUG = 7
}

export function getSeverityName(value: number): string {
    if (value in MavMessageSeverity) {
        const enumName = MavMessageSeverity[value];
        return enumName.replace("MAV_SEVERITY_", "");
    }

    return `UNKNOWN_SEVERITY (${value})`;
}