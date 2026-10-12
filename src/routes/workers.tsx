import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/fairlane/AppShell";
import { WorkerTable } from "@/components/fairlane/WorkerTable";

export const Route = createFileRoute("/workers")({
  head: () => ({
    meta: [
      { title: "Workers — Fairlane" },
      { name: "description", content: "Worker nodes and GPU health" },
      { property: "og:title", content: "Workers — Fairlane" },
      { property: "og:description", content: "Worker nodes and GPU health" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Workers" subtitle="Worker nodes and GPU health" />
      <WorkerTable />
    </AppShell>
  );
}
