/**
 * Centralized badge color mapping for all status/level/enum values.
 * Uses warm 50-tint backgrounds with 600-700 text for readability.
 * All components should import from here instead of defining their own.
 */
export const STATUS_BADGE_STYLES: Record<string, string> = {
  // Meeting status
  DRAFT: 'bg-stone-100 text-stone-600',
  PLANNING: 'bg-blue-50 text-blue-700',
  ONGOING: 'bg-teal-50 text-teal-700',
  COMPLETED: 'bg-stone-100 text-stone-500',
  CANCELED: 'bg-red-50 text-red-600',

  // Reception stage
  NOT_ARRIVED: 'bg-amber-50 text-amber-700',
  CHECKED_IN: 'bg-teal-50 text-teal-700',
  IN_HOUSE: 'bg-green-50 text-green-700',
  DEPARTED: 'bg-stone-100 text-stone-500',
  NO_SHOW: 'bg-red-50 text-red-600',

  // Transport status
  UNASSIGNED: 'bg-amber-50 text-amber-700',
  ASSIGNED: 'bg-blue-50 text-blue-700',
  EN_ROUTE: 'bg-cyan-50 text-cyan-700',
  PICKED_UP: 'bg-indigo-50 text-indigo-700',
  REASSIGNED: 'bg-orange-50 text-orange-700',

  // Lodging status
  RESERVED: 'bg-blue-50 text-blue-700',
  ROOM_CHANGED: 'bg-orange-50 text-orange-700',

  // Catering status
  SCHEDULED: 'bg-amber-50 text-amber-700',
  SEATED: 'bg-teal-50 text-teal-700',
  FINISHED: 'bg-stone-100 text-stone-500',

  // Gift status
  PENDING: 'bg-amber-50 text-amber-700',
  DELIVERED: 'bg-green-50 text-green-700',

  // Guest levels
  VIP_A: 'bg-red-50 text-red-700',
  VIP_B: 'bg-orange-50 text-orange-700',
  A: 'bg-blue-50 text-blue-700',
  B: 'bg-stone-100 text-stone-600',
  C: 'bg-stone-50 text-stone-500',

  // RSVP
  CONFIRMED: 'bg-green-50 text-green-700',
  DECLINED: 'bg-red-50 text-red-600',

  // Agenda types
  KEYNOTE: 'bg-red-50 text-red-700',
  PANEL: 'bg-blue-50 text-blue-700',
  BREAK: 'bg-amber-50 text-amber-700',
  MEAL: 'bg-green-50 text-green-700',
  TOUR: 'bg-purple-50 text-purple-700',
  OTHER: 'bg-stone-100 text-stone-600',
};

/**
 * Get badge style for a status, falling back to neutral stone.
 */
export function getBadgeStyle(status: string): string {
  return STATUS_BADGE_STYLES[status] ?? 'bg-stone-100 text-stone-500';
}
