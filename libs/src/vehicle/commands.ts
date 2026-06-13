export type ArmCommand = { type: 'arm' }
export type DisarmCommand = { type: 'disarm' }
export type LaunchCommand = { type: 'launch'; height: number }
/** mode is the dialect's string mode id (e.g. "guided", "auto"). The dialect maps this to its wire format. */
export type SetModeCommand = { type: 'setMode'; mode: string }

export type VehicleCommand = ArmCommand | DisarmCommand | LaunchCommand | SetModeCommand
