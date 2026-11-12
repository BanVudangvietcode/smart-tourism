import { NextResponse } from 'next/server';
import { realtimeHub } from '@/lib/realtime-hub';

export async function POST(req: Request) {
  try {
    let deviceId: string | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      deviceId = body.deviceId;
    } else {
      // Beacon hoặc form data có thể gửi text thuần
      const text = await req.text();
      try {
        const parsed = JSON.parse(text);
        deviceId = parsed.deviceId;
      } catch {
        deviceId = text;
      }
    }

    if (deviceId) {
      realtimeHub.leave(deviceId);
    }

    // Forward tới Spring Boot backend nếu đang chạy
    if (deviceId) {
      const backendUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
      fetch(`${backendUrl}/api/v1/analytics/realtime/leave?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      }).catch(() => {
        // Ignored
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
