"use client";

import { useCallback, useEffect, useState } from "react";

type HealthResponse = {
  status: "UP" | "DOWN";
  database: "CONNECTED" | "DISCONNECTED";
  timestamp: string;
};

type ConnectionState =
  | { kind: "loading" }
  | { kind: "success"; data: HealthResponse }
  | { kind: "error"; message: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function SystemStatus() {
  const [connection, setConnection] = useState<ConnectionState>({
    kind: "loading",
  });

  const fetchHealth = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      throw new Error(`Backend phản hồi mã ${response.status}.`);
    }

    const data = (await response.json()) as HealthResponse;

    if (data.status !== "UP") {
      throw new Error("Backend phản hồi nhưng hệ thống chưa sẵn sàng.");
    }

    return data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchHealth(controller.signal)
      .then((data) => setConnection({ kind: "success", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setConnection({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể kết nối tới backend.",
        });
      });

    return () => controller.abort();
  }, [fetchHealth]);

  const checkConnection = async () => {
    setConnection({ kind: "loading" });

    try {
      const data = await fetchHealth();
      setConnection({ kind: "success", data });
    } catch (error) {
      setConnection({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể kết nối tới backend.",
      });
    }
  };

  const isConnected = connection.kind === "success";
  const statusLabel =
    connection.kind === "loading"
      ? "Đang kiểm tra"
      : isConnected
        ? "Đã thông mạng"
        : "Mất kết nối";

  return (
    <section
      aria-labelledby="system-status-title"
      aria-live="polite"
      className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--panel-line)] bg-[var(--panel)] shadow-[var(--panel-shadow)]"
    >
      <div className="status-grid absolute inset-0 opacity-40" aria-hidden="true" />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
              Trạng thái hệ thống
            </p>
            <h2
              id="system-status-title"
              className="mt-3 text-2xl font-semibold tracking-[-0.04em]"
            >
              {statusLabel}
            </h2>
          </div>
          <span
            className={`mt-1 size-3 rounded-full ${
              connection.kind === "loading"
                ? "status-loading bg-[var(--warning)]"
                : isConnected
                  ? "bg-[var(--success)] shadow-[0_0_0_5px_var(--success-soft)]"
                  : "bg-[var(--danger)] shadow-[0_0_0_5px_var(--danger-soft)]"
            }`}
            aria-hidden="true"
          />
        </div>

        <div className="mt-8 border-y border-[var(--panel-line)]">
          <StatusRow label="Frontend" value="RUNNING" tone="success" />
          <StatusRow
            label="Backend API"
            value={
              connection.kind === "loading"
                ? "CHECKING"
                : isConnected
                  ? "UP"
                  : "DOWN"
            }
            tone={
              connection.kind === "loading"
                ? "loading"
                : isConnected
                  ? "success"
                  : "danger"
            }
          />
          <StatusRow
            label="PostgreSQL + PostGIS"
            value={isConnected ? connection.data.database : "UNKNOWN"}
            tone={
              connection.kind === "loading"
                ? "loading"
                : isConnected
                  ? "success"
                  : "muted"
            }
          />
        </div>

        <div className="mt-5 min-h-12">
          {connection.kind === "success" && (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Lần phản hồi gần nhất: {formatTimestamp(connection.data.timestamp)}
            </p>
          )}

          {connection.kind === "loading" && (
            <div className="space-y-2 pt-1" aria-label="Đang chờ phản hồi">
              <span className="status-skeleton block h-2.5 w-4/5 rounded-full" />
              <span className="status-skeleton block h-2.5 w-2/5 rounded-full" />
            </div>
          )}

          {connection.kind === "error" && (
            <p className="text-sm leading-6 text-[var(--danger)]">
              {connection.message} Kiểm tra dịch vụ ở cổng 5432 và 8080.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void checkConnection()}
          disabled={connection.kind === "loading"}
          className="mt-3 inline-flex w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--accent-contrast)] outline-none transition-[transform,background-color,opacity] duration-200 hover:bg-[var(--accent-hover)] active:translate-y-px disabled:cursor-wait disabled:opacity-55 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--panel)]"
        >
          {connection.kind === "loading" ? "Đang kiểm tra" : "Kiểm tra lại"}
        </button>

        <p className="mt-5 break-all border-t border-[var(--panel-line)] pt-5 font-mono text-[10px] leading-5 text-[var(--quiet)]">
          GET {API_BASE_URL}/api/v1/health
        </p>
      </div>
    </section>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "loading" | "danger" | "muted";
}) {
  const toneClass = {
    success: "text-[var(--success)]",
    loading: "text-[var(--warning)]",
    danger: "text-[var(--danger)]",
    muted: "text-[var(--quiet)]",
  }[tone];

  return (
    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--panel-line)] py-3 last:border-b-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={`font-mono text-[11px] font-bold ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}
