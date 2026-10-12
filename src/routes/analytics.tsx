import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/fairlane/AppShell";


export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Fairlane" },
      { name: "description", content: "Telemetry and fairness metrics" },
      { property: "og:title", content: "Analytics — Fairlane" },
      { property: "og:description", content: "Telemetry and fairness metrics" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Analytics" subtitle="Telemetry and fairness metrics" />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-subtle-foreground">Utilization and fairness charts are planned for a later phase.</div>
    </AppShell>
  );
}
