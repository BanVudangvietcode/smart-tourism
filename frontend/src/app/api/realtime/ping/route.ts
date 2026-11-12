import { NextResponse } from 'next/server';
import { realtimeHub } from '@/lib/realtime-hub';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const deviceId = body.deviceId;

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    const count = realtimeHub.ping(deviceId);

    // Also forward to Spring Boot backend if running (async, fire-and-forget)
    const backendUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
    fetch(`${backendUrl}/api/v1/analytics/realtime/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    }).catch(() => {
      // Ignored
    });

    return NextResponse.json({
      activeVisitors: count,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
