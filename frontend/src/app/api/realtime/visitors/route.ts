import { realtimeHub } from '@/lib/realtime-hub';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (_count: number, payload: any) => {
        try {
          const chunk = `event: visitors\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // stream might be closed
        }
      };

      const unsubscribe = realtimeHub.subscribe(sendEvent);

      // Keepalive comment every 15s to keep proxy/browser connection open
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepaliveInterval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(keepaliveInterval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
    },
  });
}

