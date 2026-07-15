import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

export type AppAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type AppSubject =
  | 'Guest'
  | 'Meeting'
  | 'MeetingGuest'
  | 'AgendaItem'
  | 'TransportOrder'
  | 'LodgingOrder'
  | 'CateringOrder'
  | 'GiftOrder'
  | 'FeeRecord'
  | 'AuditLog'
  | 'User'
  | 'all';

export interface AppUser {
  role: 'SUPER_ADMIN' | 'VIEWER' | string;
  meetingRoles?: Record<string, string>;
}

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export function defineAbilityFor(user: AppUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user.role === 'SUPER_ADMIN') {
    can('manage', 'all');
    return build();
  }

  // VIEWER (and default)
  // Order matters: deny first (catch-all), then allow specific subjects.
  cannot('manage', 'all').because('只读用户无权写操作');
  cannot('read', ['AuditLog', 'User']).because('只读用户无权访问审计日志和用户管理');
  can('read', ['Guest', 'Meeting', 'MeetingGuest', 'AgendaItem']);

  return build();
}

export function assertCan(
  ability: AppAbility,
  action: AppAction,
  subject: AppSubject,
): void {
  if (!ability.can(action, subject)) {
    throw new Error(`Forbidden: ${action} ${subject}`);
  }
}
