/**
 * Centralized dictionary for all enum values, labels, and badge colors.
 * Single source of truth — import from here instead of defining per-file.
 *
 * Usage:
 *   import { dict, getLabel, getOptions } from '@/lib/shared/dictionary';
 *
 *   dict.meetingStatus.ONGOING        // '进行中'
 *   getLabel('meetingStatus', 'ONGOING')  // '进行中'
 *   getOptions('entourageRole')       // [{value, label}, ...]
 */

export const DICTIONARY = {
  gender: {
    MALE: '男',
    FEMALE: '女',
    OTHER: '其他',
  } as Record<string, string>,

  guestLevel: {
    VIP_A: 'VIP-A',
    VIP_B: 'VIP-B',
    A: 'A',
    B: 'B',
    C: 'C',
  } as Record<string, string>,

  systemRole: {
    SUPER_ADMIN: '超级管理员',
    VIEWER: '只读用户',
  } as Record<string, string>,

  meetingStatus: {
    DRAFT: '草稿',
    PLANNING: '筹备中',
    ONGOING: '进行中',
    COMPLETED: '已结束',
    CANCELED: '已取消',
  } as Record<string, string>,

  rsvpStatus: {
    PENDING: '待确认',
    CONFIRMED: '已确认',
    DECLINED: '已拒绝',
  } as Record<string, string>,

  receptionStage: {
    NOT_ARRIVED: '未签到',
    CHECKED_IN: '已签到',
    IN_HOUSE: '在场',
    DEPARTED: '已离场',
    NO_SHOW: '未到',
  } as Record<string, string>,

  entourageRole: {
    PRIMARY: '主嘉宾',
    SECRETARY: '秘书',
    SECURITY: '安保',
    INTERPRETER: '翻译',
    FAMILY: '家属',
    AIDE: '助理',
    DRIVER: '司机',
  } as Record<string, string>,

  agendaType: {
    KEYNOTE: '主题演讲',
    PANEL: '圆桌讨论',
    BREAK: '茶歇',
    MEAL: '用餐',
    TOUR: '参观',
    CLOSED_MEETING: '闭门会',
    RESEARCH: '调研',
    SALON: '沙龙',
    REVIEW: '评审',
    ROADSHOW: '路演',
    DEFENSE: '答辩',
    OTHER: '其他',
  } as Record<string, string>,

  vehicleType: {
    SEDAN: '轿车',
    MPV: '商务车',
    BUS: '大巴',
    OTHER: '其他',
  } as Record<string, string>,

  pickupType: {
    AIRPORT: '机场',
    TRAINSTATION: '火车站',
    HOTEL: '酒店',
    OTHER: '其他',
  } as Record<string, string>,

  transportStatus: {
    UNASSIGNED: '待分配',
    ASSIGNED: '已分配',
    EN_ROUTE: '前往中',
    PICKED_UP: '已接上',
    COMPLETED: '已完成',
    REASSIGNED: '已改派',
    CANCELED: '已取消',
  } as Record<string, string>,

  roomType: {
    SINGLE: '单人房',
    DOUBLE: '双人房',
    SUITE: '套房',
  } as Record<string, string>,

  roomStatus: {
    AVAILABLE: '可用',
    RESERVED: '已预订',
    OCCUPIED: '已入住',
    MAINTENANCE: '维护中',
  } as Record<string, string>,

  lodgingStatus: {
    UNASSIGNED: '待分配',
    RESERVED: '已预订',
    CHECKED_IN: '已入住',
    CHECKED_OUT: '已退房',
    ROOM_CHANGED: '已换房',
    CANCELED: '已取消',
  } as Record<string, string>,

  tableType: {
    ROUND: '圆桌',
    SQUARE: '方桌',
    BUFFET: '自助',
  } as Record<string, string>,

  mealType: {
    WELCOME_BANQUET: '欢迎宴',
    FAREWELL: '欢送宴',
    LUNCH: '午餐',
    DINNER: '晚餐',
    BREAKFAST: '早餐',
  } as Record<string, string>,

  cateringStatus: {
    SCHEDULED: '已安排',
    SEATED: '已入座',
    FINISHED: '已结束',
    CANCELED: '已取消',
  } as Record<string, string>,

  giftStatus: {
    PENDING: '待发放',
    DELIVERED: '已发放',
    CANCELED: '已取消',
  } as Record<string, string>,

  feeCategory: {
    TRANSPORT: '交通',
    LODGING: '住宿',
    MEAL: '餐饮',
    GIFT: '礼品',
    OTHER: '其他',
  } as Record<string, string>,
} as const;

export type DictKey = keyof typeof DICTIONARY;

/** Get Chinese label for an enum value */
export function getLabel(category: DictKey, value: string): string {
  return DICTIONARY[category][value] ?? value;
}

/** Get options array for Select/dropdown components */
export function getOptions(category: DictKey): Array<{ value: string; label: string }> {
  return Object.entries(DICTIONARY[category]).map(([value, label]) => ({ value, label }));
}

/** Shorthand alias */
export const dict = DICTIONARY;
