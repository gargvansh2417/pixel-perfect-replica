# Fairlane — Phase 6 Test Plan (Dashboard / UI)

**Owner:** Vansh Garg (Dashboard & UI) · **Reviewer:** Vansh Sagar (Team Lead)
**Build under test:** Lovable prototype, mock backend (see `docs/integration/API_CONNECTION.md`)

> Scope: this plan covers only the dashboard/UI. Everything in Section 1 runs in the Lovable preview against **sample data in the browser**. Nothing in Section 1 proves backend behaviour. Section 2 lists the tests the backend team must run after integration.

Legend for the **Result** column: **PASS** = met in the prototype · **DEVIATION** = works, but differs from the brief as noted · **NOT BUILT** = missing from the prototype, logged as a bug in Section 3.

---

## 1. Frontend tests (run in the Lovable preview)

### 1A. Job submission form validation
Open with **+ New Job** (on the Overview or Jobs page). The rules live in `src/lib/job-validation.ts` and have automatic tests in `src/test/job-validation.test.ts` (`bunx vitest run`).

**Valid input:** Name `test_job.py` · Script Path `/mnt/nfs/users/testuser/jobs/123/test.py` · GPUs 1–8 · Memory 0–131072 · Priority 1–5 · Timeout 5–1440.
Expected: **Submit Job** is enabled. Submitting adds the job to the browser-only store, shows a success message and opens the Jobs page filtered to the new job ID. **Result: PASS** (simulated; nothing is saved to a server).

| # | Field | Input | Expected message | Result |
|---|-------|-------|------------------|--------|
| V1 | Job Name | `ab` | Job name must be 3-100 characters | PASS |
| V2 | Job Name | 101 × `a` | Job name must be 3-100 characters | PASS (the field also stops typing at 120 characters) |
| V3 | Script Path | empty | Script path is required | DEVIATION: shows the single combined message "Script path must be a valid NFS path under /mnt/nfs/users/" |
| V4 | Script Path | `/invalid/path` | Script path must start with /mnt/nfs/users/ | DEVIATION: same combined message |
| V5 | Script Path | `/mnt/nfs/users/` | Script path must point to a specific file | DEVIATION: same combined message |
| V6 | GPU Count | `0` | Please select between 1 and 8 GPUs | PASS |
| V7 | GPU Count | `9` | Please select between 1 and 8 GPUs | PASS |
| V8 | Memory | `-1` | Memory must be between 0 and 131072 MB | PASS |
| V9 | Memory | `131073` | Memory must be between 0 and 131072 MB | PASS |
| V10 | Priority | none selected | Please select a priority level | PASS in the rule. In the form, Priority starts at 3 and can't be cleared, so you can't reach this message there |
| V11 | Timeout | `4` | Timeout must be between 5 and 1440 minutes | PASS |
| V12 | Timeout | `1441` | Timeout must be between 5 and 1440 minutes | PASS |

For every invalid row, **Submit Job** stays disabled. An error appears once a field has been typed in or left.
**Evidence:** Screenshot 1 shows the form with `/invalid/path` and the error under the field.
*"All client-side validation rules function correctly, preventing invalid submissions from reaching the backend."* (Scripts paths give one combined error instead of three separate messages. See bug B-3.)

### 1B. Job status display
Badge colours come from Phase 1 status colours set in `src/styles.css` (`--status-*`) and mapped in `StatusBadge.tsx`.

| Check | Where | Result |
|-------|-------|--------|
| All 7 states (PENDING, QUEUED, ASSIGNED, RUNNING, COMPLETED, FAILED, CANCELLED) have their own colour | `StatusBadge` map | PASS |
| Badge text matches the state name exactly (upper case) | all views | PASS |
| Shape `px-2.5 py-0.5 rounded-full` | small badges | DEVIATION: badges use `px-2 py-0.5 rounded` (square corners). See bug B-4 |
| Used in Job Queue table | `/jobs` | PASS |
| Used in Job Details status banner | `/jobs/$jobId` (large size) | PASS |
| Used in the Events timeline | `/jobs/$jobId` Events tab | PASS (shows state names) |
| All 7 shown side by side | Status filter dropdown on `/jobs` | PASS |

**Evidence:** Screenshot 2 shows the open Status filter on `/jobs`, listing all 7 badges.
*"Status indicators consistently use contracted state names and Phase 1-defined colors across all dashboard views."*

### 1C. Navigation and interactive elements
| Check | Expected | Result |
|-------|----------|--------|
| Side menu items | Dashboard/Overview, Jobs, Workers, Analytics, Settings | PASS |
| Current page highlight | left border + background | PASS |
| Under 768px | side menu folds away, menu (hamburger) button appears | PASS |
| Search placeholder | "Search jobs, workers..." | PASS |
| Profile menu opens | profile dropdown | Needs checking on screen. Logged as B-5 if it's missing |
| Hover/focus on buttons | shared `btn()` styles with hover and focus ring | PASS |
| Submit disabled while form invalid | — | PASS |
| Job ID → Job Details | `/jobs/$jobId` | PASS |
| View All → Jobs list | `/jobs` | PASS (opens the full list, not a pre-filtered one) |
| No menu link leads to a 404 | all routes exist | PASS |

**Evidence:** screenshot of hover states on a menu item, a button and a link.

### 1D. Empty states and error handling
| Check | Expected | Result |
|-------|----------|--------|
| Job Queue empty: icon ⏳, "No jobs match current filters", "Try adjusting filters or submit a new job", **+ New Job** | `/jobs` with a search that matches nothing | PASS |
| Workers empty: icon ⚙️, "No Workers Connected", subtext, **Download Agent Guide** | `/workers` → view selector "No workers" | PASS. The button shows a notice that the guide is coming with the Worker Agent module |
| Workers connection error | `/workers` → "Connection lost" | PASS (sample) |
| "Failed to load job data. Check connection." banner + Retry | `/jobs` | NOT BUILT: with sample data the list can't fail. Bug B-1 |
| "Failed to load job details." banner + Retry | `/jobs/$jobId` | NOT BUILT: an unknown ID shows a "not found" page instead. Bug B-1 |

**Evidence:** Screenshot 4 shows the empty Job Queue with all its parts visible.
*"Empty states provide clear, actionable guidance rather than leaving users in confusion."*

### 1E. Forms and filters
| Check | Result |
|-------|--------|
| Tab moves through form fields in order | PASS (standard form fields) |
| Live validation on typing and leaving a field | PASS |
| Form clears after submit or cancel | PASS |
| Status filter lists All + 7 states | PASS |
| User filter filled from sample data | PASS |
| Search filters by name/ID as you type | PASS |
| From/To date pickers open and pick dates | PASS (built-in date picker) |
| Filters update the table straight away, no reload | PASS |
| Clearing a filter returns to "All" | PASS (✕ next to Status) |

**Evidence:** Screenshot 3 shows the filter bar on `/jobs` with all controls visible.
*"Filters and forms maintain state correctly and update UI without requiring page reload."*

---

## 2. Backend-dependent tests (for the backend team, can't be run in the prototype)

> The prototype keeps jobs in browser memory, so these tests **can't pass in Lovable**. The yellow "USING MOCK BACKEND" banner makes this clear on every page.

### 2A. Data persistence
| Test | Backend must | Expected UI |
|------|--------------|-------------|
| Submit job → refresh browser → job still in queue | Store the job in PostgreSQL with its first `status` (PENDING/QUEUED) | Job still listed after refresh with the same `job_id` |
| Cancel job → CANCELLED everywhere | `DELETE /jobs/{id}` sets `status=CANCELLED` | Queue row, details banner and Events all show CANCELLED once the data refreshes |

Evidence the backend team must provide: logs of the job being saved to the DB · `GET /jobs` responses before and after cancelling · proof that no job data is lost on browser refresh.

### 2B. API error conditions
| Test | Backend must | Expected UI |
|------|--------------|-------------|
| 500 on submission | Return 500 for internal errors | Error message "Submission failed. Please try again later." (the prototype currently shows "Submission failed: <reason>") |
| 401 bad/missing `X-API-Key` | Return 401 | Send the user to the login page with a clear message. NOT BUILT: there is no login page in the prototype yet |

Evidence: API logs of the error responses · the frontend handling them on screen · proof that the user is redirected.

### 2C. Worker telemetry
| Test | Backend must | Expected UI |
|------|--------------|-------------|
| Cards update when new telemetry arrives | The worker agent sends heartbeats via `POST /workers/register` | The dashboard checks `GET /workers` regularly and updates bars and values. The "sample" markings disappear |

Evidence: a valid heartbeat payload from the agent · `GET /workers` responses changing over time · bars matching real GPU usage.

---

## 3. High-priority (blocking) bug criteria
A bug is high priority when **a user can't finish a core task**:
- Submit stays enabled with invalid input
- Wrong badge colour or state name
- A menu link leads to a 404
- An empty state gives no next step
- A loading spinner never goes away

**Bugs found in this review**
| ID | Bug | Blocking? | Why |
|----|-----|-----------|-----|
| B-1 | No "Failed to load…" banners with Retry on the Jobs list and Job Details | Yes, once the real backend is connected | The user can't recover from a failed load. Not reachable with sample data |
| B-2 | No login page to send users to on a 401 | Yes, once connected | The user can't fix a bad API key |
| B-3 | Script path gives one combined error instead of three specific ones | No | The submission is still blocked; only the wording is less precise |
| B-4 | Badge shape is `rounded px-2` instead of `rounded-full px-2.5` | No | Looks slightly different; colours and names are correct |
| B-5 | Profile dropdown to be confirmed on screen | No | Doesn't stop any core task |

Evidence required for each fix: before/after screenshots and one line on what the user couldn't do before.

---

## 4. API contract review
**Status: provisional.** `CONTRACTS.md` is **not in this repository**, so this mapping uses the field names from Phases 1–3 as recorded in `docs/integration/API_CONNECTION.md`. It must be confirmed against `CONTRACTS.md` with Vansh Sagar before sign-off.

| UI Component | Contracted Field | Source Document |
|--------------|------------------|-----------------|
| Job Submission Form — Job Name | `name` | CONTRACTS.md Job Submission |
| Job Submission Form — Script Path | `script_path` | CONTRACTS.md Job Submission |
| Job Submission Form — GPU Count | `gpus` | CONTRACTS.md Job Submission |
| Job Submission Form — Memory | `memory_mb` | CONTRACTS.md Job Submission |
| Job Submission Form — Priority | `priority` | CONTRACTS.md Job Submission |
| Job Submission Form — Timeout | `timeout_min` | CONTRACTS.md Job Submission |
| Job Status Badge | `status` | CONTRACTS.md Job Status Response |
| Job Queue row ID | `job_id` | CONTRACTS.md Job Status Response |
| Worker Card State | `state` | CONTRACTS.md Worker Registration Payload |
| Worker Card hostname | `hostname` | CONTRACTS.md Worker Registration Payload |

Known gap: the prototype's in-browser code uses camelCase names (`scriptPath`, `memoryMb`). They must be converted to the contracted snake_case names at the API boundary. No other names may be used in requests or responses.

*Target statement (true once confirmed): "All UI components strictly reference contracted definitions; no local aliases or deviations permitted."*
**Evidence:** Screenshot 5 shows this table.

---

## 5. Readiness checklist
- [x] This file exists at `docs/testing/TEST_PLAN.md`
- [x] All frontend tests in Section 1 can be run in the Lovable preview
- [x] Backend-dependent tests are clearly marked and say what the backend team must build
- [x] High-priority bug criteria are based on what blocks the user
- [ ] API contract review shows no differences from `CONTRACTS.md`: **open**, file not supplied
- [x] Evidence requirements are concrete and can be shown in Lovable
- [x] Sample-data behaviour is never presented as backend behaviour

### Evaluation evidence
1. Form validation with invalid script path error (1A)
2. Status filter showing all 7 badges (1B)
3. Job queue filter bar (1E)
4. Empty job queue state (1D)
5. Contract review table (Section 4)

**Primary features tested:** client-side validation blocks invalid data · status badges use contracted names and Phase 1 colours · navigation, filters and forms update without reloading · empty states give a clear next step · the field-name mapping is documented · blocking bugs (B-1, B-2) are logged.

**Limitations:** all data is sample data held in the browser. Saving data, `DELETE /jobs/{id}`, API error responses, API-key login and live worker telemetry can't be tested in the prototype and are specified in Section 2 for the backend team. Contract review is waiting on `CONTRACTS.md`.
