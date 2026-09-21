import { SystemStatus } from "./components/system-status";

const stack = [
  { index: "01", name: "Next.js", detail: "Giao diện" },
  { index: "02", name: "Spring Boot", detail: "API" },
  { index: "03", name: "PostGIS", detail: "Dữ liệu" },
];

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1180px] flex-col px-5 sm:px-8 lg:px-10">
        <header className="flex h-20 items-center justify-between border-b border-[var(--line)]">
          <a
            href="#main-content"
            className="group flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--background)]"
          >
            <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] font-mono text-[11px] font-bold tracking-[-0.04em] text-[var(--background)] transition-transform group-hover:-rotate-3">
              TG
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em]">
              Tourism Guide
            </span>
          </a>

          <p className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] sm:block">
            Môi trường phát triển
          </p>
        </header>

        <section
          id="main-content"
          className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)] lg:gap-20 lg:py-20"
        >
          <div className="max-w-[650px]">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Hệ thống thuyết minh du lịch
            </p>
            <h1 className="text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-balance">
              Một điểm kiểm tra cho toàn bộ hệ thống.
            </h1>
            <p className="mt-7 max-w-[520px] text-base leading-7 text-[var(--muted)] sm:text-lg">
              Xác nhận luồng kết nối từ giao diện đến API và cơ sở dữ liệu trước
              khi phát triển tính năng.
            </p>

            <div className="mt-12 border-y border-[var(--line)]">
              {stack.map((item) => (
                <div
                  key={item.index}
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-[var(--line)] py-4 last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-[var(--quiet)]">
                    {item.index}
                  </span>
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="text-sm text-[var(--muted)]">
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <SystemStatus />
        </section>

        <footer className="flex flex-col gap-2 border-t border-[var(--line)] py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>Bộ khung kỹ thuật cho giai đoạn đầu.</p>
          <p className="font-mono">localhost:3000 → localhost:8080</p>
        </footer>
      </div>
    </main>
  );
}
