import { NextResponse } from 'next/server';
import { realtimeHub } from '@/lib/realtime-hub';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const deviceId = body.deviceId || (clientIp ? `ip-${clientIp}` : `anon-${Math.random().toString(36).substring(2, 9)}`);
    
    const count = realtimeHub.ping(deviceId);

    // Also forward to Spring Boot backend if running (async, fire-and-forget)
    const backendUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
    fetch(`${backendUrl}/api/v1/analytics/realtime/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    }).catch(() => {});

    return NextResponse.json({ status: 'OK', activeVisitors: count });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', message: err.message }, { status: 500 });
  }
}

export async function GET() {
  const count = realtimeHub.getCount();
  return NextResponse.json({ status: 'OK', activeVisitors: count });
}

