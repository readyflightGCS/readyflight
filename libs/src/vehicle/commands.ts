export type ArmCommand = { type: 'arm' }
export type DisarmCommand = { type: 'disarm' }
/** mode is the autopilot-specific custom mode number (e.g. PlaneMode / CopterMode) */
export type SetModeCommand = { type: 'setMode'; mode: number }

export type VehicleCommand = ArmCommand | DisarmCommand | SetModeCommand
