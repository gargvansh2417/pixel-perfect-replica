# Fairlane — Dashboard ↔ Backend API Connection

**Document version:** Phase 4 · 2026-10-13
**Scope:** How the Fairlane React dashboard (built in Lovable) connects to the Fairlane FastAPI backend. This document separates **real integration** from **mock prototype**.

---

## 1. Connection Status

- ☐ REAL BACKEND CONNECTED (URL: __________)
- ☒ **MOCK BACKEND IN USE (TEMPORARY)**

> **BACKEND NOT YET ACCESSIBLE - USING TEMPORARY MOCK**

### Inspection findings

| Item | Finding |
|---|---|
| Lovable backend integrations | No backend service is linked to this project, and no API key secret is stored. |
| Fairlane FastAPI reachability | The planned base URL `http://localhost:8000/api/v1` exists only on a team member's machine or the lab network. The hosted Lovable preview runs in the cloud and **cannot reach `localhost` or private lab IPs**. |
| Required to go live | The FastAPI service has to be reachable over public HTTPS (a deployed host or a tunnel such as Cloudflare Tunnel/ngrok), with CORS allowing the dashboard origin. |
| Planned base URL | `{BASE_URL}` = `http://localhost:8000/api/v1` (dev). Replace with the public HTTPS URL when available. |
| Planned auth | API key in the `X-API-Key` header (Phase 3 auth spec). |
| Planned endpoints | `POST /jobs`, `GET /jobs`, `GET /jobs/{id}`, `DELETE /jobs/{id}`, `POST /workers/register` |

### What is mock today (labelled in the UI)

- A yellow banner reading **"⚠️ USING MOCK BACKEND - DATA NOT PERSISTENT"** appears at the top of every dashboard page.
- All job data comes from the client-side mock store `src/lib/job-store.ts`, which is marked `MOCK` in its header comment.
- Overview counts (124 / 23 / 8 / 89/5) and worker cards come from `src/lib/overview-data.ts` and `src/lib/sample-data.ts`. Both files are labelled `MOCK DATA`.
- **No GPU execution, scheduler, database, or NFS access happens.** Logs, results, and worker assignments are simulated text.

---

## 2. Job Submission Integration Specification

### A. Request

| Field | Value |
|---|---|
| Method / Endpoint | `POST {BASE_URL}/jobs` |
| Header | `Content-Type: application/json` |
| Header | `X-API-Key: <SECURELY_STORED_KEY>` |

**Key handling:** for the MVP, the key comes from `/auth/login` and is held in an httpOnly cookie, or in localStorage as a temporary measure. It must never be hard-coded, logged, or shown in the UI. For production, call the backend through a Lovable server function so the key stays server-side.

**Body — `JobSubmitPayload` (must match CONTRACTS.md):**

```json
{
  "job_name": "string (3-100 chars)",
  "script_path": "string (must start with /mnt/nfs/users/)",
  "required_gpus": 1,
  "memory_mb": 8192,
  "estimated_runtime": 7200,
  "priority": 3,
  "user_id": "string (from auth)"
}
```

| Payload field | Type | Required | Form field (Phase 3) | Mapping |
|---|---|---|---|---|
| `job_name` | string, 3–100 | yes | Job Name | trimmed |
| `script_path` | string, prefix `/mnt/nfs/users/` | yes | Script Path | trimmed |
| `required_gpus` | int ≥ 1 (UI caps at 8) | yes | GPU Count | `Number()` |
| `memory_mb` | int 0–131072 | no | Memory (MB) | omit when blank |
| `estimated_runtime` | int, **seconds** | no | Timeout (minutes) | `minutes × 60`; omit when blank |
| `priority` | int 1–5 | yes | Priority | `Number()` |
| `user_id` | string | yes | — | from auth session |

### B. Response handling

| Response | Validate | Frontend action |
|---|---|---|
| **201 Created** → `JobStatusResponse` | `job_id` is an integer; `status === "QUEUED"`; `submitted_at` is ISO 8601; `user_id` equals the submitted `user_id` | Success toast → go to the Job Details page for `job_id` → refresh Summary Cards (Total +1, Queued +1) |
| **400 / 422** → `{ "detail": [...] }` | Map each `detail[].loc` to a form field | Show the error under the matching input, keep the form open, toast "Please fix highlighted errors" |
| **500+** | — | Toast "Submission failed. Please try again later.", `console.error` (dev only), **no automatic retry** |

---

## 3. Job Status Retrieval Integration Specification

### A. Job list — `GET {BASE_URL}/jobs?status={filter}&limit={n}&offset={m}`

- Header: `X-API-Key`
- Response: `JobStatusResponse[]`

| Case | Frontend action |
|---|---|
| 200 | Fill the job table. Map `status` to the badge colour (Phase 1/3). Show `submitted_at` as relative time ("2 min ago"). Recompute the Summary Cards. |
| Error | Banner "Failed to load job data. Check connection.", plus an empty state with a **Retry** button. Keep showing the last good data if there is any. |

Pagination maps to the Job Queue page: 20 rows per page → `limit=20&offset=page*20`. The Status filter sends `status`; "All" leaves the parameter out.

### B. Single job — `GET {BASE_URL}/jobs/{job_id}`

| Case | Frontend action |
|---|---|
| 200 | Fill the Overview / Logs / Results / Events tabs and set the status banner. **RUNNING:** poll every 5 s. **COMPLETED / FAILED / CANCELLED:** stop polling. |
| 404 | "Job not found. It may have been deleted." → go back to the Job Queue |
| Other | Banner "Failed to load job details." plus a Retry button |

### C. Cancel — `DELETE {BASE_URL}/jobs/{id}`

| Case | Frontend action |
|---|---|
| 204 | Toast "Job cancelled successfully" → set the row or banner to `CANCELLED` → refresh Summary Cards |
| 403 | "You don't have permission to cancel this job" |
| Other | "Cancellation failed. Please try again." |

Cancel is only offered for `PENDING`, `QUEUED`, `ASSIGNED`, and `RUNNING`, and always asks for confirmation first.

### Contracted state names (unchanged)

- Job: `PENDING → QUEUED → ASSIGNED → RUNNING → COMPLETED`; terminal alternatives `FAILED`, `CANCELLED`
- Worker: `ONLINE`, `DRAINING`, `OFFLINE`
- GPU: `HEALTHY`, `DEGRADED`, `DEAD`

---

## 4. Mock Backend Specification (TEMPORARY)

**Location:** `src/lib/job-store.ts` (in-browser only). Validation lives in `src/lib/job-validation.ts`.

### Current mock behaviour

| Operation | Mock behaviour |
|---|---|
| Submit | Validates `script_path` prefix, `priority ∈ [1,5]`, `required_gpus` in 1–8, name length, and memory and timeout ranges. Invalid input is blocked in the form with field-specific errors (equivalent to a 400). Valid input waits about 0.9 s and creates the job. |
| Job id | Sequential string `JOB-131`, `JOB-132`, … |
| Status progression | `PENDING → QUEUED → ASSIGNED → RUNNING → COMPLETED`, one step every 6 s (about 30 s to RUNNING, then about 30 s of simulated epochs). |
| Forced failure | Not implemented yet. Seeded jobs already include `FAILED` examples ("CUDA out of memory") for UI testing. |
| List | Returns all mock jobs, newest first (26 seeded plus anything you submit). |
| Cancel | Sets status to `CANCELLED` and adds an event. The job **stays visible** so the CANCELLED state can be shown. |
| Retry | FAILED jobs with `retry_count < max_retries (3)` reset to `PENDING` with `retry_count + 1`. |

### Known differences between the mock and the contract (to fix when wiring the real API)

| Contract | Mock today | Action when integrating |
|---|---|---|
| `job_id` integer | `"JOB-131"` string | Use the numeric `job_id`; format as `JOB-{id}` for display only |
| Initial status `QUEUED` from `POST` | Starts at `PENDING` | Show whatever status the API returns |
| `estimated_runtime` (seconds) | Form collects a timeout in minutes | Convert ×60 in the API client |
| `DELETE` removes the job | Mock marks it CANCELLED | Follow backend semantics; the UI handles both |
| After submit, go to Job Details | Mock goes to the Job Queue filtered to the new id | Switch to `/jobs/{job_id}` |
| `user_id` from auth | Hard-coded `vansh@univ.edu` | Take it from the auth session |

### Critical limitations

- Mock data **does not persist** between sessions (a page reload resets it).
- Mock data **is not shared** between users or browsers.
- The mock **does not** interact with the scheduler, PostgreSQL, workers, GPUs, or NFS.
- Logs, results files, worker names, and durations are **simulated text**, not real GPU execution.

---

## 5. What Still Needs Backend Work

- [ ] `POST /jobs`: DB persistence, validation matching `JobSubmitPayload`, `201` + `JobStatusResponse`
- [ ] `GET /jobs`: `status` / `limit` / `offset` filters, role-based filtering (student / professor / admin)
- [ ] `GET /jobs/{id}`: full detail including logs path, results, and events
- [ ] `DELETE /jobs/{id}`: ownership check (403), state check
- [ ] `POST /workers/register`, plus a worker list endpoint for the Workers page
- [ ] Scheduler job claiming with `SELECT … FOR UPDATE SKIP LOCKED`
- [ ] Worker heartbeat handling (`ONLINE` / `DRAINING` / `OFFLINE` transitions)
- [ ] Fault tolerance and re-queuing of jobs on lost workers per retry policy
- [ ] Public HTTPS exposure of the API plus CORS for the dashboard origin
- [ ] `/auth/login` issuing the `X-API-Key` / session
- [ ] Summary counts endpoint (or derive them from `GET /jobs`)

---

## 6. Test Cases

### Performed against the mock (2026-10-13)

| # | Test | Expected | Result |
|---|---|---|---|
| T1 | Submit a valid job (`test_training.py`, `/mnt/nfs/users/demo/jobs/123/test_training.py`, 2 GPUs, 8192 MB, priority 3, 120 min) | Toast, then the queue shows the new job | Pass (mock; starts at PENDING, then QUEUED after about 6 s) |
| T2 | Script path `/home/demo/train.py` | Error "Script path must be a valid NFS path under /mnt/nfs/users/", Submit disabled | Pass (unit test `src/test/job-validation.test.ts`) |
| T3 | Name, GPU, memory, timeout, and priority bounds | Field errors at the documented limits | Pass (unit tests) |
| T4 | Open Job Details | Correct status banner, timestamps, worker, retry count | Pass (mock) |
| T5 | Cancel a QUEUED job and confirm | Status `CANCELLED`, toast | Pass (mock) |
| T6 | Cancel / Retry visibility rules | Cancel only for PENDING/QUEUED/ASSIGNED/RUNNING; Retry only for FAILED with retries left | Pass (unit tests) |
| T7 | 500 response handling | Toast "Submission failed. Please try again later." | **Not testable**: the mock never returns 500 |

### To run once the real backend is reachable

1. `POST /jobs` with the T1 payload → `201`, `status = "QUEUED"`, integer `job_id`, ISO `submitted_at`, matching `user_id`.
2. `POST /jobs` with an invalid `script_path` → `422`, and the error appears under the Script Path field.
3. `GET /jobs?status=QUEUED&limit=20&offset=0` → the new job is listed.
4. `GET /jobs/{id}` → fields match; polling runs only while RUNNING.
5. `DELETE /jobs/{id}` → `204`, and the UI shows CANCELLED. Repeat as another user → `403` message.
6. Stop the API → list banner "Failed to load job data. Check connection." with Retry. Force a 500 on POST → submission-failed toast, no auto-retry.
7. A missing `X-API-Key` → `401`/`403` is handled without exposing the key.

---

## 7. Summary of Genuine Integration

**Genuinely implemented (frontend):**
- Submission form validation (the same rules the backend must enforce)
- Mapping of job and worker states to badges using contracted names only
- Queue filtering and pagination, details tabs, cancel and retry rules

**Not integrated (mock):**
- All network calls to the Fairlane API
- Real job execution, scheduling, persistence, logs, and results

No simulated data is presented as real GPU execution. The dashboard shows the mock banner on every page.
