# Fairlane — Fallback Demonstration Plan

## Current situation
The prototype is **always** in sample-data mode. There is no `USE_MOCK_BACKEND` switch or `?mock=true` URL option yet — the backend is not connected, so there is nothing to switch away from. This plan describes what to do now and what the switch should do after integration.

## Trigger conditions (after integration)
- API returns 500 errors repeatedly
- Job submission takes longer than 10 seconds
- Workers page shows "No Workers Connected" while agents are running

## Activation
- **Today:** nothing to do — open the preview; sample data is already shown.
- **After integration (to build):** `?mock=true` in the URL or a `USE_MOCK_BACKEND = true` setting switches to sample data.

## Banner
Currently shown on every page:

> ⚠️ USING MOCK BACKEND - DATA NOT PERSISTENT

Brief's requested wording for the future switch: "⚠️ DEMONSTRATION MODE - USING SAMPLE DATA" in yellow (semantic warning colour, not hard-coded Tailwind yellow).

## Behaviour in sample-data mode (what the prototype does today)
- **Job submission:** client-side validation works; Submit creates an ID like `JOB-1xx` locally after ~1 s. No API call is made.
- **Job queue:** submitted jobs move PENDING → QUEUED → ASSIGNED → RUNNING → COMPLETED about every 6 s. Sample jobs include a FAILED one.
- **Workers:** 4 sample workers (online light load, online heavy load, draining, offline). Values are greyed with an orange `*` and dashed card borders.
- **All navigation, filters and dialogs keep working.**

## Presenter lines
- "The backend is not connected, so this is demonstration mode with clearly marked sample data."
- "What you're seeing is demonstration mode — the UI is fully functional but connected to a sample data source."
- "I will never present sample data as real GPU execution or live telemetry."

## If the preview itself fails
1. Reload once. 2. Open the published link, if published. 3. Fall back to the evaluation screenshots from Phases 1–6.
