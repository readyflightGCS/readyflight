/**
 * Curated set of icons available to dialects.
 * Values correspond to Lucide icon names (PascalCase component names).
 * The frontend maps each key to the actual Lucide component.
 */
export type RFIcon =
  | 'MousePointerClick' // guided / manual click
  | 'Bot' // auto / autonomous
  | 'ArrowDownToLine' // land / descend
  | 'Milestone' // follow / waypoint
  | 'FoldVertical' // altitude hold
  | 'FoldHorizontal' // position hold
  | 'CircleSlash2' // stabilize / manual
  | 'Home' // return to launch / RTL
  | 'Circle' // loiter / orbit
  | 'Joystick' // manual control
  | 'RefreshCw' // circle mode / looping
  | 'Navigation' // navigation / heading
  | 'Zap' // fast / takeoff / acro
  | 'Plane' // fixed-wing specific
  | 'Crosshair' // acro / precision
  | 'Thermometer' // thermal
  | 'Wind' // cruise / glide
  | 'ArrowUpFromLine' // takeoff
  | 'RotateCcw' // restart / reset
  | 'Helicopter' // rotary-wing vehicle
  | 'Drone' // multicopter vehicle
