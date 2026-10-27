// Shared in-memory presence tracking for Next.js server
type VisitorListener = (count: number, payload: any) => void;

class RealtimeHub {
  private visitors = new Map<string, number>();
  private listeners = new Set<VisitorListener>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Dọn dẹp session quá hạn nhanh chóng mỗi 2 giây
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpired();
      }, 2000);
    }
  }

  public ping(deviceId: string): number {
    if (!deviceId) return this.getCount();
    this.visitors.set(deviceId, Date.now());
    const count = this.getCount();
    this.broadcast(count);
    return count;
  }

  public leave(deviceId: string): number {
    if (deviceId && this.visitors.has(deviceId)) {
      this.visitors.delete(deviceId);
      const count = this.getCount();
      this.broadcast(count);
      return count;
    }
    return this.getCount();
  }

  public getCount(): number {
    this.cleanupExpired();
    return Math.max(1, this.visitors.size);
  }

  private cleanupExpired() {
    const now = Date.now();
    let changed = false;
    // Hết hạn chỉ sau 10 giây nếu thiết bị không gửi ping (ngắt kết nối đột ngột)
    for (const [id, lastSeen] of this.visitors.entries()) {
      if (now - lastSeen > 10000) {
        this.visitors.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.broadcast(this.getCount());
    }
  }

  public subscribe(listener: VisitorListener): () => void {
    this.listeners.add(listener);
    const initialCount = this.getCount();
    listener(initialCount, { activeVisitors: initialCount, timestamp: Date.now() });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private broadcast(count: number) {
    const payload = { activeVisitors: count, timestamp: Date.now() };
    for (const listener of this.listeners) {
      try {
        listener(count, payload);
      } catch {
        // ignore
      }
    }
  }
}

// Global singleton across hot reloads in Next.js development
const globalForHub = globalThis as unknown as { realtimeHub?: RealtimeHub };
export const realtimeHub = globalForHub.realtimeHub || new RealtimeHub();
if (process.env.NODE_ENV !== 'production') globalForHub.realtimeHub = realtimeHub;
