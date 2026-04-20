# Free-Tier Scalability Execution Requirements (April 2026)

## Purpose

This document converts the Free-Tier Scalability Plan into an execution contract for an implementation teammate.

Primary outcome:
- Production-safe rollout for 500+ users on free-tier constraints.
- Clear Definition of Done with mandatory passing tests.

Source plan:
- docs/plans/FREE_TIER_SCALABILITY_PLAN_APRIL_2026.md

## Implementation Context Snapshot

Current state observed in codebase:
- Raw body parsing is already scoped to webhook routes.
- Webhook signature middleware does not fail closed when secret is missing.
- In-memory caches exist, but env values are parsed without strict clamp/validation.
- Webhook push handling is per-commit and emits repeated updates.
- Socket presence and delivery maps are process-local.
- Queue worker path and saturation metrics are not yet complete.

## Scope

In scope:
1. Phase 1 hardening: webhook fail-closed, config validation and clamps, pagination safety checks.
2. Phase 2 throughput improvements: commit aggregation, fanout reduction, reconnect efficiency, log-level guards.
3. Phase 3 async isolation: queue-backed heavy processing for webhook and AI architecture analysis.
4. Phase 4 guardrails: runtime metrics, latency, queue depth, alerts, and overload controls.

Out of scope for this cycle:
1. Full horizontal multi-instance socket state coordination.
2. Major domain model rewrites.
3. Vendor/platform migration.

## Work Plan (Teammate Execution)

## Phase A: Security and Memory Safety Gate

Tasks:
1. Make GitHub webhook verification fail closed in production if secret is absent.
2. Reject unsigned requests and invalid signatures with 401.
3. Add strict env validation utilities for cache and catchup settings:
   - Positive integer only.
   - Hard min and max bounds.
   - Safe fallback defaults.
4. Apply validated values to:
   - ARCHITECTURE_CACHE_MAX_ENTRIES
   - ARCHITECTURE_CACHE_TTL_MS
   - DELIVERY_CATCHUP_BATCH_SIZE
   - DELIVERY_CATCHUP_MAX_BATCHES
5. Confirm pagination boundary caps for any endpoint accepting page size style inputs.

Acceptance criteria:
1. Production webhook endpoints cannot process events when secret/config is missing.
2. Invalid env values cannot disable pruning/TTL behavior.
3. Invalid signatures never enter heavy processing path.

## Phase B: Throughput per MB

Tasks:
1. Aggregate webhook commit effects by project and task before DB writes.
2. Replace per-commit projectUpdate fanout with one consolidated project update per webhook event.
3. Minimize repeated reads for project/step/task lookup during webhook bursts.
4. Add log-level checks so debug logs do not flood hot paths.

Acceptance criteria:
1. Push bursts trigger bounded DB operations instead of commit-amplified loops.
2. One webhook event yields one project-level broadcast per affected project.
3. p95 latency and peak memory improve under synthetic push bursts.

## Phase C: Async Queue Isolation

Tasks:
1. Move heavy webhook processing to internal queue worker path.
2. Move AI architecture analysis to async jobs with status endpoint.
3. Keep API handlers lightweight and immediately acknowledge accepted work.
4. Implement idempotency for webhook deliveries.

Acceptance criteria:
1. API remains responsive during webhook and AI spikes.
2. Queue backlog, retry state, and failure reasons are visible.
3. Duplicate webhook deliveries do not duplicate side effects.

## Phase D: Operational Guardrails

Tasks:
1. Expose metrics for rss, heapUsed, heapTotal, event-loop lag, route latency.
2. Expose queue depth and queue lag metrics.
3. Add pressure controls:
   - Defer non-critical work when memory threshold is crossed.
   - Preserve core auth/session/chat behavior.
4. Add alert thresholds tied to free-tier limits.

Acceptance criteria:
1. Saturation is detected before user-visible failure.
2. Degradation mode is controlled and reversible.

## Definition of Done

All items below are mandatory:
1. Phase A complete and merged.
2. Phase B complete and merged.
3. Queue-based processing path merged for at least webhook heavy work.
4. Metrics endpoint/logging added with memory, latency, and queue indicators.
5. Mandatory test gate passes.
6. Verification report attached to PR.

## Mandatory Test Gate (Must Pass)

Run from repository root:

1. Unit and integration baseline
   - npm run test:jest

2. Type safety
   - npm run typecheck

3. Frontend lint baseline
   - npm run lint

4. Build validation
   - npm run build

Expected current Jest-discovered suites include:
1. backend/tests/user_sync_security.test.js
2. backend/tests/project_security.test.js
3. backend/tests/session_security.test.js
4. backend/tests/regexUtils.test.js

PR cannot be marked complete if any command above fails.

## Recommended Additional Tests for This Workstream

These should be added in the same implementation branch:
1. Webhook verification tests:
   - Missing secret in production returns reject status.
   - Missing signature rejected.
   - Invalid signature rejected.
   - Valid signature accepted.
2. Config clamp tests:
   - NaN, zero, negative, huge values are clamped/fallback correctly.
3. Webhook aggregation tests:
   - Multi-commit payload yields consolidated DB update behavior.
   - Single projectUpdate event emitted per project per webhook payload.
4. Queue idempotency tests:
   - Duplicate delivery id does not re-run side effects.

## Suggested PR Breakdown (Rollback Safe)

PR 1: Security and config hardening
1. Fail-closed webhook behavior.
2. Shared env clamp utility.
3. Tests for verification and clamp behavior.

PR 2: Webhook aggregation and fanout reduction
1. Consolidated processing path.
2. Socket emit dedup/consolidation.
3. Burst scenario tests.

PR 3: Queue offload for webhook and AI
1. Producer plus worker implementation.
2. Job status endpoints.
3. Idempotency tests.

PR 4: Metrics and overload guardrails
1. Runtime and queue metrics.
2. Alert thresholds and controlled degradation.
3. Smoke verification under synthetic load.

## PR Verification Template (Attach to Every PR)

1. Scope completed:
2. Non-goals untouched:
3. Risks introduced:
4. Test commands run:
5. Test results summary:
6. Rollback plan:
7. Follow-up tasks:

## Owner and Timeline

Owner: Assigned teammate
Reviewer: Engineering lead
Target window: 6 to 10 working days across four PRs

Status: Ready for execution