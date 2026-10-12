import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, ChevronDown, Gauge, ListChecks, Menu, Search, Server, SlidersHorizontal, X } from "lucide-react";
import { PURPOSE } from "@/lib/sample-data";

const nav = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/jobs", label: "Jobs", icon: ListChecks },
  { to: "/workers", label: "Workers", icon: Server },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
] as const;

export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now ? now.toLocaleString() : "—";
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const now = useNow();

  return (
    <div className="flex min-h-screen bg-background pb-10">
      {open && <div className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform md:static md:z-auto md:w-1/5 md:min-w-52 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[60px] items-center justify-between border-b border-sidebar-border px-4">
          <span className="text-h2 text-primary">Fairlane</span>
          <button className="text-muted-foreground md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col py-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-l-2 border-transparent p-4 text-label text-sidebar-foreground transition-colors hover:bg-hover"
              activeProps={{ className: "!border-primary bg-sidebar-accent !text-sidebar-accent-foreground" }}
              activeOptions={{ exact: true }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <p className="text-caption text-muted-foreground">{PURPOSE}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] items-center gap-4 border-b border-border bg-background px-4">
          <button className="text-subtle-foreground md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <span className="hidden text-h2 text-primary lg:block">Fairlane</span>
          <div className="relative mx-auto w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search jobs, workers..."
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-label text-subtle-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="flex items-center gap-2 text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label text-primary-foreground">VG</span>
            <span className="hidden sm:inline">vansh</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 flex h-10 items-center justify-between border-t border-card bg-background px-4">
        <span className="text-caption text-muted-foreground">Fairlane v1.0 | Academic Session 2026-27</span>
        <span className="text-caption text-subtle-foreground">Last updated: {now}</span>
      </footer>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const now = useNow();
  return (
    <div className="mb-6">
      <h2 className="text-primary">{title}</h2>
      <p className="text-subtle-foreground">{subtitle}</p>
      <p className="text-caption text-muted-foreground">Last updated: {now}</p>
    </div>
  );
}
