# Fairlane — Worker Monitoring Page Specification

**Phase:** 5 · **Route:** `/workers` (details: `/workers/{hostname}`)
**Status:** UI implemented in the dashboard. **All telemetry is SAMPLE DATA**, because no worker agents are connected (see `docs/integration/API_CONNECTION.md`).

| Implementation file | Purpose |
|---|---|
| `src/routes/workers.index.tsx` | Page, refresh controls, banner, loading/error/empty states, confirmation dialog |
| `src/components/fairlane/WorkerCard.tsx` | Worker card, telemetry bars, tooltips, actions |
| `src/lib/worker-telemetry.ts` | Sample data (flagged `sample: true`), colour rules |
| `src/test/worker-telemetry.test.ts` | Unit tests for colour thresholds, clamping, uptime, banner rule |

---

## 1. Page Structure & Navigation

- **Access:** the "Workers" sidebar item (Phase 1 layout).
- **Header:**
  - Title "Worker Status": H2, Primary `#4F46E5`
  - Subtitle "Real-time health and utilization of GPU worker nodes": Body, Text Secondary `#D1D5DB`
  - Refresh controls (top-right, `flex items-center gap-2`):
    - **Refresh Now**: Button Secondary, sm
    - **Auto-refresh** toggle: default ON, every 30 s
    - **Last updated: [time]**: Caption, Text Muted `#9CA3AF`
- **Preview state selector** (evaluation aid): Workers (sample) / No workers / Connection lost.

## 2. Worker Cards Grid

| Viewport | Columns |
|---|---|
| ≥ 1024 px | 4 |
| 768–1023 px | 3 |
| < 768 px | 1 |

Gap 16 px; container padding 24 px.

**Card:** `bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800 transition-colors min-h-96 flex flex-col shadow-sm hover:shadow-md`. The border becomes **dashed `border-gray-600`** when any value on the card is sample data.

### Card content (top → bottom)

1. **Hostname header:** hostname (`text-xl font-semibold text-gray-100`, monospace) plus a state badge (`px-3 py-1 rounded-full text-sm`).

   | State (CONTRACTS.md) | Badge |
   |---|---|
   | `ONLINE` | `bg-secondary/20 text-secondary` |
   | `DRAINING` | `bg-warning/20 text-warning` |
   | `OFFLINE` | `bg-muted/20 text-muted` |

2. **Telemetry** (`space-y-3`):

   | Metric | Value format | Bar width | Bar colour |
   |---|---|---|---|
   | GPU Usage | `{pct}%` | `clamp(pct, 0, 100)%` | < 50 green · 50–80 amber · > 80 red |
   | VRAM | `{used}/{total} GB` | `used/total × 100%` | same as GPU |
   | Temp | `{temp}°C` | `min(temp, 100)%` | < 70 green · 70–85 amber · > 85 red |
   | Power (optional) | `{watts}W` | — | — |

   Bars: `w-full h-2.5 bg-gray-700 rounded-full`, fill `transition-width duration-300`.

3. **Health indicators** (`border-t`, `pt-4`, `space-y-2`):
   - **Agent Status:** ● dot plus text. ONLINE "Connected" (secondary) · DRAINING "Draining jobs" (warning) · OFFLINE "Disconnected" (muted)
   - **Active Jobs:** `{count}/{max_concurrent}` (`max_concurrent` comes from worker config, default 2)
   - **Uptime:** `{days}d {hours}h`

4. **Action footer** (`mt-auto`, `border-t`):

   | State | Left button | Right button |
   |---|---|---|
   | ONLINE | **Drain Worker** (Warning) | View Details (Primary) → `/workers/{hostname}` |
   | DRAINING | **Resume Worker** (Secondary) | View Details (Primary) |
   | OFFLINE | **Retire Worker** (Error) | View Details **disabled** (`opacity-50 cursor-not-allowed`) |

## 3. Data Integrity Guards (real vs sample)

| Aspect | Sample data (current) | Real-time data (future) |
|---|---|---|
| Value colour | `text-gray-400` | `text-gray-100` |
| Marker | Superscript `*` after the value | none |
| `*` tooltip | "Sample data - does not reflect actual GPU state" | Tooltip "Updated 12s ago" |
| Card border | dashed `border-gray-600` | solid `border-gray-700` |
| Page banner | Shown when **≥ 50 %** of cards contain sample data: "⚠️ Worker telemetry contains sample data. Actual metrics require connected worker agents." (`bg-yellow-500/10 border-yellow-500/20 text-yellow-400`) | hidden |
| Fluctuation | **None.** Refresh does not change sample values | Smooth updates, no jumps |

- Sample values are deliberately round (25.0 %, 50.0 %, 90.0 %, 55.0 °C, 75.0 °C, 88.0 °C) so they cannot be mistaken for live readings.
- Each metric is modelled as `{ value, sample: boolean }`, so real and sample values can be mixed per field once agents report partial telemetry.
- The global "USING MOCK BACKEND" banner from Phase 4 also stays visible.

## 4. Loading, Error & Empty States

| State | Specification |
|---|---|
| Initial load / refresh | Full overlay `bg-gray-900/50`, spinner `h-8 w-8 border-2 border-primary/50 border-t-primary animate-spin`, text "Loading worker status..." (`text-primary/75`), shown for at least 500 ms |
| Per-card loading (staggered fetch) | Telemetry area replaced by `h-24` box, `h-4 w-4` spinner, "Fetching telemetry..." (Caption, `text-primary/60`). *Specified; not yet used because the mock loads all cards at once.* |
| Connection error | `bg-red-900/20 border-red-500 rounded-lg p-6`, ⚠️ icon, "Connection Lost", "Unable to reach worker agent. Check network or worker status.", **Retry Connection** (Primary) |
| No workers | `py-16 text-center`, ⚙️ icon, "No Workers Connected" (H3 Primary), "Start worker agents on GPU nodes to begin monitoring.", caption "Each worker must run the Fairlane agent script and register with the central server.", **Download Agent Guide** (Secondary) |

## 5. Tooltips & Confirmation Dialogs

Tooltip style: `bg-gray-900/90 text-white px-2 py-1 rounded text-xs font-medium`.

| Element | Tooltip |
|---|---|
| Hostname | Unique identifier for this worker node |
| GPU Usage bar | Percentage of GPU compute cores in use |
| VRAM bar | Graphics memory allocated vs total available |
| Temperature | Current GPU die temperature (safe <85°C) |
| Power Draw | Electrical power consumption |
| Agent Status | Fairlane worker agent connection state |
| Active Jobs | Number of jobs currently executing on this node |
| Uptime | Time since last agent restart |
| Drain Worker | Stop accepting new jobs; allow current to finish |
| Resume Worker | Return to normal operation after draining |
| Retire Worker | Permanently remove this worker from the cluster |

**Confirmation dialog** (Drain / Resume / Retire): title "Confirm Action", context message, buttons **Cancel** (Secondary) and **Drain / Resume / Retire** (Primary). Overlay: `fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50`.

| Action | Message | Mock result |
|---|---|---|
| Drain | "Draining worker-gpu-01 will stop accepting new jobs. Currently running jobs will complete normally. Continue?" | State → `DRAINING` |
| Resume | "Resuming {host} will let it accept new jobs again. Continue?" | State → `ONLINE` |
| Retire | "Retiring {host} permanently removes it from the cluster. It must re-register to return. Continue?" | Card removed |

In the mock, actions change only the on-screen state, and the toast says "mock — no agent contacted". The real implementation must call the backend (endpoints still to be agreed: e.g. `POST /workers/{id}/drain`, `/resume`, `DELETE /workers/{id}`).

## 6. UI Polish & Consistency

- **Spacing:** card padding `p-6`; section gaps `space-y-3` / `space-y-4`; grid gap 16 px.
- **Font scaling (root):** < 640 px → 14 px · default 16 px · ≥ 1280 px → 18 px.
- **Typography (Phase 1):** H1 2.5rem/700/1.2 · H2 2rem/600/1.3 · H3 1.5rem/600/1.4 · Body 1rem/400/1.5 · Label 0.875rem/500/1.4 · Caption 0.75rem/400/1.4 · Inter.
- **Visual:** borders `gray-700` unless state-specific; cards `rounded-lg`, badges `rounded-full`; `shadow-sm`, hover `shadow-md`; `transition-colors duration-200`; focus `ring-2 ring-primary`.
- **Sidebar** collapses below 768 px behind the hamburger icon.

## 7. Backend Data Needed (for real telemetry)

| Field | Source |
|---|---|
| `hostname`, `state` | Worker registry (`POST /workers/register`, heartbeat) |
| `gpu_util`, `vram_used`, `vram_total`, `temp_c`, `power_w` | NVML via the Worker Agent heartbeat |
| `active_jobs`, `max_concurrent` | Scheduler, worker config |
| `agent_started_at` → uptime | Worker Agent |
| `last_heartbeat_at` → "Updated Xs ago" | Heartbeat handler |

## 8. Evaluation Evidence Checklist

1. `/workers` with 4 cards: worker-gpu-01 (ONLINE, low, green), worker-gpu-02 (ONLINE, high, red), worker-gpu-03 (OFFLINE), worker-gpu-04 (DRAINING, medium, amber), all with `*`, dashed borders and the sample banner.
2. Hover the GPU Usage bar → "Percentage of GPU compute cores in use".
3. Click **Drain Worker** on worker-gpu-01 → confirmation dialog with the context message.
4. Preview state → **No workers** → "No Workers Connected" empty state.

**Honesty note:** no card shows real-time data, because none exists yet. Every telemetry value on the page is sample data and is marked as such.
