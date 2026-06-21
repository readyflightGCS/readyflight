import {
  MousePointerClick,
  Bot,
  ArrowDownToLine,
  Milestone,
  FoldVertical,
  FoldHorizontal,
  CircleSlash2,
  Home,
  Circle,
  Joystick,
  RefreshCw,
  Navigation,
  Zap,
  Plane,
  Crosshair,
  Thermometer,
  Wind,
  ArrowUpFromLine,
  RotateCcw,
  Helicopter,
  Drone,
  type LucideIcon
} from 'lucide-react'
import type { RFIcon } from '@libs/ui/icons'

/**
 * Maps every RFIcon key to the corresponding Lucide React component.
 * When a new icon is added to RFIcon, add it here too.
 */
export const rfIconMap: Record<RFIcon, LucideIcon> = {
  MousePointerClick,
  Bot,
  ArrowDownToLine,
  Milestone,
  FoldVertical,
  FoldHorizontal,
  CircleSlash2,
  Home,
  Circle,
  Joystick,
  RefreshCw,
  Navigation,
  Zap,
  Plane,
  Crosshair,
  Thermometer,
  Wind,
  ArrowUpFromLine,
  RotateCcw,
  Helicopter,
  Drone,
}
