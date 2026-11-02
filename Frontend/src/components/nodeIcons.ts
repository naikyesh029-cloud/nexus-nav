import {
  BedDouble,
  DoorOpen,
  Dumbbell,
  GraduationCap,
  Landmark,
  Library,
  ParkingCircle,
  Theater,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { IconKey } from '../types'

export const NODE_ICONS: Record<IconKey, LucideIcon> = {
  gate: DoorOpen,
  parking: ParkingCircle,
  admin: Landmark,
  library: Library,
  academic: GraduationCap,
  canteen: Utensils,
  auditorium: Theater,
  hostel: BedDouble,
  sports: Dumbbell,
}
