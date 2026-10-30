import { NextResponse } from 'next/server';
import { realtimeHub } from '@/lib/realtime-hub';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const queryDevId = url.searchParams.get('deviceId');

    let body: any = {};
    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        if (text.startsWith('web-') || text.startsWith('dev-')) {
          body.deviceId = text;
        }
      }
    }

    const deviceId = queryDevId || body.deviceId;
    const count = realtimeHub.leave(deviceId);

    // Forward tới Spring Boot backend nếu đang chạy
    if (deviceId) {
      const backendUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
      fetch(`${backendUrl}/api/v1/analytics/realtime/leave?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      }).catch(() => {});
    }

    return NextResponse.json({ status: 'OK', activeVisitors: count });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', message: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
