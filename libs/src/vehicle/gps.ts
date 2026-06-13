/**
 * ReadyFlight-owned GPS fix quality levels.
 * Dialects map their native fix representation to this type.
 */
export type GpsFixType =
  | 'no_gps'
  | 'no_fix'
  | '2d_fix'
  | '3d_fix'
  | 'dgps'
  | 'rtk_float'
  | 'rtk_fixed'
  | 'static'
  | 'ppp'

/** Returns a display-friendly label for a GPS fix type. */
export function gpsFixLabel(fix: GpsFixType): string {
  switch (fix) {
    case 'no_gps':    return 'No GPS'
    case 'no_fix':    return 'No Fix'
    case '2d_fix':    return '2D Fix'
    case '3d_fix':    return '3D Fix'
    case 'dgps':      return 'DGPS'
    case 'rtk_float': return 'RTK Float'
    case 'rtk_fixed': return 'RTK Fixed'
    case 'static':    return 'Static'
    case 'ppp':       return 'PPP'
  }
}

/** Returns a quality tier for colouring the GPS fix in the UI. */
export function gpsFixQuality(fix: GpsFixType): 'none' | 'poor' | 'good' {
  if (fix === 'no_gps' || fix === 'no_fix') return 'none'
  if (fix === '2d_fix') return 'poor'
  return 'good'
}
