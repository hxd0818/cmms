'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  getManagerGuests,
  getManagerGuestDetail,
  createGuestByManager,
} from '@/app/actions/guest-manager.actions';
import { dict } from '@/lib/shared/dictionary';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  ChevronLeft,
  Car,
  Bed,
  UtensilsCrossed,
  Gift,
  Clock,
  Star,
  AlertCircle,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GuestItem {
  id: string;
  guestId: string;
  name: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  level: string;
  gender: string | null;
  dietaryTags: string[];
  receptionStage: string;
}

export function ManagePortal({
  tokenHash,
  managerName,
  phoneLastFour,
  scope,
  meetingName,
}: {
  tokenHash: string;
  managerName: string;
  phoneLastFour: string;
  scope: string;
  meetingName: string;
}) {
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Verify phone
  async function onVerify() {
    if (pin === phoneLastFour) {
      setVerified(true);
      setLoading(true);
      const data = await getManagerGuests(tokenHash);
      if (data) {
        setGuests(data.meetingGuests);
      }
      setLoading(false);
    } else {
      setPinError(true);
    }
  }

  // Refresh guest list
  const refresh = useCallback(async () => {
    const data = await getManagerGuests(tokenHash);
    if (data) setGuests(data.meetingGuests);
  }, [tokenHash]);

  const filtered = guests.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.company ?? '').toLowerCase().includes(q) ||
      (g.phone ?? '').includes(q)
    );
  });

  // Verification screen
  if (!verified) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xs space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4 bg-stone-900">
              {managerName.charAt(0)}
            </div>
            <h1 className="text-lg font-bold text-stone-800">嘉宾信息维护</h1>
            <p className="text-xs text-stone-400 mt-1">{managerName}，请输入手机号后 4 位</p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setPinError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && pin.length === 4 && onVerify()}
            placeholder="手机后 4 位"
            className={`w-full text-center text-2xl tracking-[0.5em] py-3 rounded-lg border ${pinError ? 'border-red-400 bg-red-50' : 'border-stone-200'} focus:border-stone-800 focus:outline-none`}
          />
          {pinError && <p className="text-xs text-red-500 text-center">输入不正确，请重试</p>}
          <button
            onClick={onVerify}
            disabled={pin.length !== 4}
            className="w-full py-2.5 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-30"
          >
            验证
          </button>
        </div>
      </main>
    );
  }

  // Guest detail view
  if (selectedGuest) {
    return (
      <GuestDetailView
        guest={selectedGuest}
        tokenHash={tokenHash}
        onBack={() => {
          setSelectedGuest(null);
          refresh();
        }}
      />
    );
  }

  // Add guest form
  if (showAddForm) {
    return (
      <AddGuestForm
        tokenHash={tokenHash}
        onDone={() => {
          setShowAddForm(false);
          refresh();
        }}
        onCancel={() => setShowAddForm(false)}
      />
    );
  }

  // Main list
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="cmms-card p-4 mb-3">
          <p className="text-xs text-stone-400">嘉宾信息维护</p>
          <h1 className="text-base font-bold text-stone-800">{managerName}</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {meetingName} · 共 {guests.length} 位嘉宾
            {scope === 'ALL' && <span className="ml-1 text-teal-600">· 全部权限</span>}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
          <Input
            className="h-9 pl-9 text-sm"
            placeholder="搜索姓名 / 手机 / 单位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Guest list */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-stone-400 text-center py-8">加载中...</p>
          ) : filtered.length === 0 ? (
            <div className="cmms-card p-8 text-center">
              <p className="text-sm text-stone-400 mb-3">
                {search ? '无匹配结果' : '暂无嘉宾，点击下方添加'}
              </p>
            </div>
          ) : (
            filtered.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGuest(g)}
                className="cmms-card cmms-card-hover w-full flex items-center justify-between p-3 text-left transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-bold text-stone-500 shrink-0">
                    {g.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{g.name}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${getBadgeStyle(g.level)}`}
                      >
                        {g.level}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 truncate">
                      {g.company ?? '-'} {g.title ? '· ' + g.title : ''}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`shrink-0 ml-2 ${getBadgeStyle(g.receptionStage)}`}
                  variant="secondary"
                >
                  {dict.receptionStage[g.receptionStage] ?? g.receptionStage}
                </Badge>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Floating add button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-50 to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 rounded-xl bg-stone-800 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={18} /> 新增嘉宾
          </button>
        </div>
      </div>
    </main>
  );
}

// ============ Add Guest Form ============

function AddGuestForm({
  tokenHash,
  onDone,
  onCancel,
}: {
  tokenHash: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('C');
  const [gender, setGender] = useState('');
  const [dietaryTags, setDietaryTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('请输入姓名');
      return;
    }
    setSubmitting(true);
    const r = await createGuestByManager({
      tokenHash,
      meetingId: '',
      guestData: {
        name: name.trim(),
        phone: phone.trim() || undefined,
        gender: (gender || undefined) as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        level: level as never,
        dietaryTags: dietaryTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      },
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('嘉宾已添加');
      onDone();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onCancel} className="text-stone-400">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold">新增嘉宾</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label className="text-xs text-stone-400">姓名 *</Label>
            <Input
              className="h-10 mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="必填"
            />
          </div>
          <div>
            <Label className="text-xs text-stone-400">手机</Label>
            <Input
              className="h-10 mt-1"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 位手机号"
            />
          </div>
          <div>
            <Label className="text-xs text-stone-400">单位</Label>
            <Input
              className="h-10 mt-1"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-stone-400">职务</Label>
            <Input className="h-10 mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-stone-400">等级</Label>
              <Select value={level} onValueChange={(v) => setLevel(v ?? 'C')}>
                <SelectTrigger className="h-10 mt-1">
                  <span>{dict.guestLevel[level] ?? level}</span>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dict.guestLevel).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-stone-400">性别</Label>
              <Select value={gender} onValueChange={(v) => setGender(v ?? '')}>
                <SelectTrigger className="h-10 mt-1">
                  <span className={gender ? '' : 'text-stone-400'}>
                    {gender ? (dict.gender[gender] ?? gender) : '选填'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不填</SelectItem>
                  {Object.entries(dict.gender).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-stone-400">饮食标签（逗号分隔）</Label>
            <Input
              className="h-10 mt-1"
              value={dietaryTags}
              onChange={(e) => setDietaryTags(e.target.value)}
              placeholder="如：清真, 素食"
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting ? '添加中...' : '添加嘉宾'}
          </Button>
        </form>
      </div>
    </main>
  );
}

// ============ Guest Detail View ============

interface GuestDetail {
  guest: {
    name: string;
    level: string;
    company: string | null;
    title: string | null;
    phone: string | null;
    gender: string | null;
    dietaryTags: string[];
  };
  transport: Array<{
    pickupType: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupTime: string;
    flightNo: string | null;
    status: string;
    plateNo: string | null;
    driverName: string | null;
  }>;
  lodging: Array<{
    hotelName: string | null;
    roomNumber: string | null;
    checkIn: string;
    checkOut: string;
    status: string;
  }>;
  catering: Array<{
    mealType: string;
    mealTime: string;
    tableName: string | null;
  }>;
  gifts: Array<{
    name: string;
    quantity: number;
    status: string;
  }>;
  agenda: Array<{
    title: string;
    type: string;
    start: string;
    end: string;
    venue: string | null;
  }>;
}

function GuestDetailView({
  guest,
  tokenHash,
  onBack,
}: {
  guest: GuestItem;
  tokenHash: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<GuestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    getManagerGuestDetail(tokenHash, guest.id).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onBack} className="text-stone-400">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold">嘉宾详情</h1>
        </div>

        {loading ? (
          <p className="text-sm text-stone-400 text-center py-8">加载中...</p>
        ) : !detail ? (
          <p className="text-sm text-stone-400 text-center py-8">无法加载</p>
        ) : (
          <>
            {/* Guest profile */}
            <div className="cmms-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-500" />
                <h3 className="text-sm font-bold">{detail.guest.name}</h3>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${getBadgeStyle(detail.guest.level)}`}
                >
                  {detail.guest.level}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-stone-500">
                {detail.guest.company && <span>单位: {detail.guest.company}</span>}
                {detail.guest.title && <span>职务: {detail.guest.title}</span>}
                {detail.guest.phone && <span className="font-mono">{detail.guest.phone}</span>}
                {detail.guest.gender && (
                  <span>{dict.gender[detail.guest.gender] ?? detail.guest.gender}</span>
                )}
              </div>
              {detail.guest.dietaryTags.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
                  <AlertCircle size={12} />
                  饮食注意: {detail.guest.dietaryTags.join(', ')}
                </div>
              )}
            </div>

            {detail.transport.length > 0 && (
              <Section icon={Car} title="接送">
                {detail.transport.map((t, i) => (
                  <Card key={i}>
                    <span className="text-xs text-stone-500">{dict.pickupType[t.pickupType]}</span>
                    <p className="text-sm">
                      {t.pickupLocation} → {t.dropoffLocation}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(t.pickupTime).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {t.flightNo && <span className="font-mono ml-2">{t.flightNo}</span>}
                    </p>
                    {t.plateNo && (
                      <p className="text-xs text-stone-500">
                        {t.plateNo} · {t.driverName}
                      </p>
                    )}
                  </Card>
                ))}
              </Section>
            )}

            {detail.lodging.length > 0 && (
              <Section icon={Bed} title="住宿">
                {detail.lodging.map((l, i) => (
                  <Card key={i}>
                    {l.hotelName ? (
                      <>
                        <p className="text-sm font-medium">
                          {l.hotelName} {l.roomNumber}
                        </p>
                        <p className="text-xs text-stone-400">
                          {new Date(l.checkIn).toLocaleDateString('zh-CN')} ~{' '}
                          {new Date(l.checkOut).toLocaleDateString('zh-CN')}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-stone-400">房间待分配</p>
                    )}
                  </Card>
                ))}
              </Section>
            )}

            {detail.catering.length > 0 && (
              <Section icon={UtensilsCrossed} title="用餐">
                {detail.catering.map((c, i) => (
                  <Card key={i}>
                    <span className="text-sm">
                      {dict.mealType[c.mealType]} {c.tableName && '· ' + c.tableName}
                    </span>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(c.mealTime).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </Card>
                ))}
              </Section>
            )}

            {detail.gifts.length > 0 && (
              <Section icon={Gift} title="礼品">
                {detail.gifts.map((g, i) => (
                  <Card key={i}>
                    <span className="text-sm">
                      {g.name} x{g.quantity}
                    </span>
                    <span
                      className={`text-xs ml-2 ${g.status === 'DELIVERED' ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      {g.status === 'DELIVERED' ? '已发放' : '待发放'}
                    </span>
                  </Card>
                ))}
              </Section>
            )}

            {detail.agenda.length > 0 && (
              <Section icon={Clock} title="会议日程">
                {detail.agenda.map((a, i) => (
                  <Card key={i}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{a.title}</span>
                      <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                        {dict.agendaType[a.type]}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(a.start).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' ~ '}
                      {new Date(a.end).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {a.venue && ' · ' + a.venue}
                    </p>
                  </Card>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Icon size={14} className="text-stone-400" />
        <h4 className="text-xs font-semibold text-stone-500">{title}</h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="cmms-card p-3">{children}</div>;
}
