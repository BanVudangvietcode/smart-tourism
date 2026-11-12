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
      fetch(`http://172.20.10.12:8080/api/v1/analytics/realtime/leave?deviceId=${encodeURIComponent(deviceId)}`, {
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
