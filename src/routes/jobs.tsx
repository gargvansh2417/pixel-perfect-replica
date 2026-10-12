import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/fairlane/AppShell";
import { JobTable } from "@/components/fairlane/JobTable";
import { queueJobs, historyJobs } from "@/lib/sample-data";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — Fairlane" },
      { name: "description", content: "All submitted jobs across the lab" },
      { property: "og:title", content: "Jobs — Fairlane" },
      { property: "og:description", content: "All submitted jobs across the lab" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Jobs" subtitle="All submitted jobs across the lab" />
      <JobTable jobs={[...queueJobs, ...historyJobs.slice(1)]} />
    </AppShell>
  );
}
