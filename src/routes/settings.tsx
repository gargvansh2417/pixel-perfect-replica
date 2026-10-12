import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/fairlane/AppShell";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Fairlane" },
      { name: "description", content: "Scheduler policy and lab configuration" },
      { property: "og:title", content: "Settings — Fairlane" },
      { property: "og:description", content: "Scheduler policy and lab configuration" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Scheduler policy and lab configuration" />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-subtle-foreground">Scheduling policy (FCFS / Priority-with-Aging) settings are planned for a later phase.</div>
    </AppShell>
  );
}
