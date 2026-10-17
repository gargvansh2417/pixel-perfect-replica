# Demonstration Script: Fairlane Core User Journey

**Duration:** 3–4 minutes · **Mode:** sample data (yellow "USING MOCK BACKEND" banner is always visible)

Presenter notes:
- There is **no login** in the prototype; the demo starts on the dashboard. Do not claim sign-in works.
- Say once at the start: "Everything you see runs on sample data in the browser; the UI is complete, the backend is not connected yet."
- New jobs are advanced by a **simulated scheduler** every ~6 seconds. Never call this real execution.

---

**[0:00] Landing (15 s)**
- Open the Fairlane URL. Point to the four summary cards and the yellow banner.
- Say: "This is the lab's GPU orchestrator overview — total jobs, queue depth and worker health at a glance, shown here with sample data."

**[0:15] Job submission (45 s)**
- Click **+ New Job**. Fill in:
  - Job Name: `demo_training.py`
  - Script Path: `/mnt/nfs/users/alice/jobs/001/demo_training.py`
  - GPU Count: `2` · Memory: `8192` · Priority: `3`
- Optional: type `/invalid/path` first to show the error and disabled **Submit Job**, then fix it.
- Click **Submit Job**. Point to the success message and the Jobs page filtered to the new ID (e.g. `JOB-1xx`, not JOB-001).
- Say: "Validation runs in the browser; the job is added to the sample list as PENDING."

**[1:00] Status tracking (60 s)**
- Watch the badge change: PENDING → QUEUED → ASSIGNED → RUNNING (~6 s per step).
- Click the job ID. Point to the status banner, the **Logs** tab and the duration counter, then the **Events** tab.
- Say: "The Events timeline records each state change. These changes are simulated until the scheduler is connected."

**[2:00] Worker monitoring (45 s)**
- Click **Workers**. Point to an ONLINE card, its usage bars, the dashed border and the orange `*`.
- Hover a usage bar to show its tooltip.
- Say: "The `*` marks sample telemetry — these numbers are not from real GPUs."

**[2:45] Completion & results (30 s)**
- Return to the job (Jobs page → ID). Point to the COMPLETED badge and final duration.
- Open the **Results** tab and show the sample output files.
- Say: "When a job finishes, results are listed here; downloads will work once storage is connected."

**[3:15] Closing (15 s)**
- Return to the Overview.
- Say: "Fairlane gives students, researchers and administrators transparent, predictable GPU sharing. The UI is complete and ready for the backend."

If something goes wrong, see [`FALLBACK_PLAN.md`](./FALLBACK_PLAN.md).
