'use client';

import { useState } from 'react';
import { dict } from '@/lib/shared/dictionary';
import { GuestShareButton } from './GuestShareButton';
import {
  Phone,
  Globe,
  Clock,
  MapPin,
  Car,
  Bed,
  UtensilsCrossed,
  Star,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GuestTaskData {
  mgId: string;
  assignmentId: string;
  meetingId: string;
  scope: string;
  guestName: string;
  guestLevel: string;
  guestCompany: string | null;
  guestTitle: string | null;
  guestPhone: string | null;
  guestGender: string | null;
  dietaryTags: string[];
  meetingName: string;
  meetingStart: string;
  meetingEnd: string;
  meetingVenue: string;
  transport: Array<{
    pickupType: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupTime: string;
    flightNo: string | null;
    status: string;
    plateNo: string | null;
    driverName: string | null;
    driverPhone: string | null;
  }>;
  lodging: Array<{
    hotelName: string | null;
    roomNumber: string | null;
    roomType: string | null;
    checkIn: string;
    checkOut: string;
  }>;
  catering: Array<{
    mealType: string;
    mealTime: string;
    tableName: string | null;
    dietary: string[];
  }>;
  agenda: Array<{
    title: string;
    type: string;
    start: string;
    end: string;
    venue: string | null;
  }>;
}

export function CompanionPortal({
  companionName,
  companionRole,
  companionPhone,
  companionLanguages,
  guests,
  phoneLastFour,
}: {
  companionName: string;
  companionRole: string;
  companionPhone: string | null;
  companionLanguages: string[];
  guests: GuestTaskData[];
  phoneLastFour: string | null;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // No phone on record → skip verification
  const needVerify = phoneLastFour !== null && phoneLastFour.length === 4;

  if (needVerify && !verified) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xs space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4 bg-stone-900">
              C
            </div>
            <h1 className="text-lg font-bold text-stone-800">接待任务验证</h1>
            <p className="text-xs text-stone-400 mt-1">
              {companionName}，请输入您手机号的后 4 位以查看任务
            </p>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pin.length === 4) {
                if (pin === phoneLastFour) {
                  setVerified(true);
                } else {
                  setPinError(true);
                }
              }
            }}
            placeholder="手机后 4 位"
            className={`w-full text-center text-2xl tracking-[0.5em] py-3 rounded-lg border ${pinError ? 'border-red-400 bg-red-50' : 'border-stone-200'} focus:border-stone-800 focus:outline-none`}
          />
          {pinError && <p className="text-xs text-red-500 text-center">输入不正确，请重试</p>}
          <button
            onClick={() => {
              if (pin === phoneLastFour) {
                setVerified(true);
              } else {
                setPinError(true);
              }
            }}
            disabled={pin.length !== 4}
            className="w-full py-2.5 rounded-lg bg-stone-800 text-white text-sm font-medium disabled:opacity-30"
          >
            验证
          </button>
        </div>
      </main>
    );
  }

  if (guests.length === 0) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-sm text-stone-400">暂无接待任务</p>
      </main>
    );
  }

  const active = guests[activeIdx]!;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Companion header */}
        <div className="cmms-card p-4">
          <p className="text-xs text-stone-400 mb-0.5">接待任务</p>
          <h1 className="text-lg font-bold text-stone-800">{companionName}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-400">
            <span>{companionRole}</span>
            {companionPhone && (
              <span className="flex items-center gap-1">
                <Phone size={11} /> {companionPhone}
              </span>
            )}
            {companionLanguages.length > 0 && (
              <span className="flex items-center gap-1">
                <Globe size={11} /> {companionLanguages.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Guest switcher tabs */}
        {guests.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {guests.map((g, i) => (
              <button
                key={g.mgId}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  i === activeIdx
                    ? 'bg-stone-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{g.guestName}</span>
                  <span
                    className={`text-[10px] px-1 py-0.5 rounded ${i === activeIdx ? 'bg-white/20' : 'bg-stone-100'}`}
                  >
                    {dict.guestLevel[g.guestLevel] ?? g.guestLevel}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Active guest details */}
        <GuestDetail guest={active} />
      </div>
    </main>
  );
}

function GuestDetail({ guest }: { guest: GuestTaskData }) {
  return (
    <div className="space-y-3">
      {/* Meeting header */}
      <div className="cmms-card p-3 bg-stone-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-stone-700">{guest.meetingName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
            {dict.assignmentScope[guest.scope] ?? guest.scope}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
          <Clock size={11} />
          {new Date(guest.meetingStart).toLocaleDateString('zh-CN')}
          {' ~ '}
          {new Date(guest.meetingEnd).toLocaleDateString('zh-CN')}
          {guest.meetingVenue && (
            <>
              <MapPin size={11} className="ml-1" /> {guest.meetingVenue}
            </>
          )}
        </div>
      </div>

      {/* Guest profile */}
      <div className="cmms-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-500" />
          <h3 className="text-sm font-bold text-stone-800">{guest.guestName}</h3>
          <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
            {dict.guestLevel[guest.guestLevel] ?? guest.guestLevel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-stone-500">
          {guest.guestCompany && <span>单位: {guest.guestCompany}</span>}
          {guest.guestTitle && <span>职务: {guest.guestTitle}</span>}
          {guest.guestPhone && <span className="font-mono">电话: {guest.guestPhone}</span>}
          {guest.guestGender && (
            <span>性别: {dict.gender[guest.guestGender] ?? guest.guestGender}</span>
          )}
        </div>
        {guest.dietaryTags.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
            <AlertCircle size={12} />
            饮食注意: {guest.dietaryTags.join(', ')}
          </div>
        )}
      </div>

      {/* Share button */}
      <GuestShareButton meetingGuestId={guest.mgId} />

      {/* Transport */}
      {guest.transport.length > 0 && (
        <Section icon={Car} title="接送安排">
          {guest.transport.map((t, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">{dict.pickupType[t.pickupType]}</span>
                <Badge>{dict.transportStatus[t.status] ?? t.status}</Badge>
              </div>
              <p className="text-sm text-stone-700 mt-1">
                {t.pickupLocation} {'->'} {t.dropoffLocation}
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
                <p className="text-xs text-stone-500 mt-0.5">
                  {t.plateNo} · {t.driverName} {t.driverPhone}
                </p>
              )}
            </Card>
          ))}
        </Section>
      )}

      {/* Lodging */}
      {guest.lodging.length > 0 && (
        <Section icon={Bed} title="住宿">
          {guest.lodging.map((l, i) => (
            <Card key={i}>
              {l.hotelName ? (
                <>
                  <p className="text-sm text-stone-700 font-medium">
                    {l.hotelName} {l.roomNumber}
                  </p>
                  <p className="text-xs text-stone-400">
                    {dict.roomType[l.roomType ?? ''] ?? l.roomType}
                    {' · '}
                    {new Date(l.checkIn).toLocaleDateString('zh-CN')}
                    {' ~ '}
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

      {/* Catering */}
      {guest.catering.length > 0 && (
        <Section icon={UtensilsCrossed} title="用餐">
          {guest.catering.map((c, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-700">{dict.mealType[c.mealType]}</span>
                {c.tableName && <span className="text-xs text-stone-400">{c.tableName}</span>}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {new Date(c.mealTime).toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {c.dietary.length > 0 && (
                <p className="text-xs text-orange-500 mt-0.5">饮食: {c.dietary.join(', ')}</p>
              )}
            </Card>
          ))}
        </Section>
      )}

      {/* Agenda */}
      {guest.agenda.length > 0 && (
        <Section icon={Clock} title="会议日程">
          {guest.agenda.map((a, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-700">{a.title}</span>
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
                {a.venue && <span className="ml-2">{a.venue}</span>}
              </p>
            </Card>
          ))}
        </Section>
      )}
    </div>
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">{children}</span>
  );
}
