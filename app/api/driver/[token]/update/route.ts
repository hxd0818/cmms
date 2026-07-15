import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverToken } from '@/lib/auth/tokens';
import { transportService } from '@/lib/domain/transport/service';
import type { TransportStatus } from '@/lib/generated/prisma/enums';

interface Body {
  orderId: string;
  status: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const verified = await verifyDriverToken(token);
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_TOKEN', message: '链接无效或已过期' } },
      { status: 401 },
    );
  }

  const body = (await req.json()) as Body;
  if (!body.orderId || !body.status) {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: '缺少参数' } },
      { status: 400 },
    );
  }

  try {
    await transportService.updateStatus(
      body.orderId,
      body.status as TransportStatus,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '服务器错误';
    return NextResponse.json(
      { ok: false, error: { code: 'UPDATE_FAILED', message } },
      { status: 500 },
    );
  }
}
