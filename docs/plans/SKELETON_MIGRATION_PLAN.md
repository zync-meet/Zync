# Skeleton Loading Migration Plan

## Overview

Replace all 31 loading spinner instances across 20 files with skeleton loading placeholders. The goal is to eliminate the frustrating spinning indicator and provide a smoother, content-aware loading experience.

---

## Current State

| Pattern | Count | Description |
|---------|-------|-------------|
| `Loader2` + `animate-spin` | 22 | Lucide icon with Tailwind spin animation |
| Custom CSS border spinner | 4 | `<div className="border-2 border-t-transparent rounded-full animate-spin" />` |
| Text-only loading states | 3 | `{loading ? "Creating..." : "Submit"}` |

**Existing infrastructure:** `src/components/ui/skeleton.tsx` already provides a reusable `<Skeleton />` component, and `PeopleView.tsx` already uses skeletons for page-level loading.

---

## Migration Categories

Instances are divided into two replacement strategies based on their context:

### Category A: Page/View-Level Loading (8 instances)

These show a spinner centered on the page while data loads. Replace with **content-shaped skeletons** that mirror the actual layout.

| # | File | Line | Current | Skeleton Replacement |
|---|------|------|---------|---------------------|
| A1 | `GlobalLoading.tsx` | 1-37 | Full-screen blur overlay + spinner | Remove entirely or replace with a top-bar progress indicator |
| A2 | `App.tsx` | 58 | Suspense fallback spinner | Page skeleton matching the target route layout |
| A3 | `MyProjectsView.tsx` | 180 | Centered spinner | Grid of project card skeletons |
| A4 | `ProjectDetails.tsx` | 471 | Centered spinner | Split layout skeleton (sidebar + main content area) |
| A5 | `TasksView.tsx` | 258 | Centered spinner | Kanban column / task list skeletons |
| A6 | `CalendarView.tsx` | 138 | Centered spinner | Calendar grid skeleton |
| A7 | `DashboardView.tsx` | 164 | Centered spinner | Dashboard widget skeletons (stats cards + charts) |
| A8 | `SettingsView.tsx` | 1086 | Centered spinner | Settings form skeleton |
| A9 | `DesktopView.tsx` | 791 | Centered spinner | Desktop layout skeleton |
| A10 | `Workspace.tsx` | 482, 549 | Centered spinner (2x) | Repository list skeleton |

### Category B: Button/Action-Level Loading (14 instances)

These are small inline spinners inside buttons during async actions. Replace with **disabled button state + subtle text change** (no skeleton needed here).

| # | File | Line | Current | Replacement |
|---|------|------|---------|-------------|
| B1 | `ProjectDetails.tsx` | 575 | Spinner + "Analyzing Repository..." | Disabled button + "Analyzing..." text (keep text, remove spinner) |
| B2 | `ProjectDetails.tsx` | 984 | Inline spinner | Disabled state, no spinner |
| B3 | `ProjectDetails.tsx` | 1064 | Inline spinner | Disabled state, no spinner |
| B4 | `ProjectDetails.tsx` | 1112 | Inline spinner | Disabled state, no spinner |
| B5 | `CreateProject.tsx` | 121 | Spinner + "Generating Architecture..." | Disabled button + "Generating..." text |
| B6 | `TasksView.tsx` | 488 | Inline spinner | Disabled state, no spinner |
| B7 | `MeetView.tsx` | 385, 515, 523, 536, 663 | Spinner replaces icon (5x) | Disabled state + swap icon to subtle pulse |
| B8 | `SettingsView.tsx` | 679, 811, 890, 908, 1214, 1221 | Inline spinner (6x) | Disabled button + text change |
| B9 | `PeopleView.tsx` | 550 | Inline spinner | Disabled state, no spinner |
| B10 | `NoteEditor.tsx` | 251 | Spinner + "Loading editor..." | Editor skeleton (toolbar + content block) |
| B11 | `NotesLayout.tsx` | 579 | Spinner + "Loading Notes..." | Note list skeleton |
| B12 | `EditorHeader.tsx` | 33 | Spinning clock icon | Pulsing dot or static "Saving..." text |
| B13 | `ShareDialog.tsx` | 104 | Spinner replaces "Invite" text | Disabled button + "Inviting..." text |
| B14 | `ChatView.tsx` | 468 | Spinner replaces send icon | Disabled send icon or subtle pulse |
| B15 | `MessagesPage.tsx` | 277, 469 | Spinner (2x) | Disabled state + text change |

### Category C: Special Cases (4 instances)

| # | File | Line | Current | Replacement |
|---|------|------|---------|-------------|
| C1 | `MeetView.tsx` | 172-173 | Custom CSS keyframe spinner in popup | Inline skeleton or "Connecting..." text |
| C2 | `LinkedinSignInButton.tsx` | 27 | Custom CSS spinner | LinkedIn logo pulse animation |
| C3 | `Workspace.tsx` | 79 | "Loading..." text placeholder | Skeleton dropdown |
| C4 | `GlobalLoading.tsx` | full file | Full-screen overlay | Top-bar progress indicator (NProgress style) |

---

## Implementation Phases

### Phase 1: Create Skeleton Components

Create purpose-built skeleton components in `src/components/ui/skeletons/`:

1. **`PageSkeleton.tsx`** — Generic page skeleton with header + content area
2. **`ProjectCardSkeleton.tsx`** — Card-shaped skeleton for project grids
3. **`TaskListSkeleton.tsx`** — Skeleton for task columns/rows
4. **`CalendarSkeleton.tsx`** — Skeleton for calendar grid
5. **`DashboardSkeleton.tsx`** — Skeleton for dashboard widgets
6. **`SettingsSkeleton.tsx`** — Skeleton for settings form sections
7. **`NoteListSkeleton.tsx`** — Skeleton for notes sidebar list
8. **`EditorSkeleton.tsx`** — Skeleton for editor toolbar + content
9. **`RepositoryListSkeleton.tsx`** — Skeleton for repo browser

### Phase 2: Replace Page-Level Spinners (Category A)

Order by impact (most-seen pages first):

1. `DashboardView.tsx` → `DashboardSkeleton`
2. `MyProjectsView.tsx` → `ProjectCardSkeleton` grid
3. `TasksView.tsx` → `TaskListSkeleton`
4. `ProjectDetails.tsx` (page load) → Split layout skeleton
5. `CalendarView.tsx` → `CalendarSkeleton`
6. `SettingsView.tsx` (page load) → `SettingsSkeleton`
7. `DesktopView.tsx` → Desktop layout skeleton
8. `Workspace.tsx` → `RepositoryListSkeleton`
9. `App.tsx` (Suspense fallback) → Generic `PageSkeleton`
10. `NoteEditor.tsx` → `EditorSkeleton`
11. `NotesLayout.tsx` → `NoteListSkeleton`

### Phase 3: Replace Global Loading Overlay (Category C4)

- Remove or redesign `GlobalLoading.tsx`
- Option A: Remove entirely (skeletons per-page replace the need)
- Option B: Replace with a thin top progress bar (like YouTube/GitHub)
- **Recommendation:** Option A — per-page skeletons make the global overlay redundant

### Phase 4: Replace Button-Level Spinners (Category B)

- Remove spinner icons from all buttons
- Use disabled state + text change pattern: `{loading ? "Saving..." : "Save"}`
- For icon buttons: subtle opacity reduction + disabled state

### Phase 5: Handle Special Cases (Category C)

- `MeetView.tsx` popup spinner → "Connecting..." text
- `LinkedinSignInButton.tsx` → LinkedIn logo with subtle pulse
- `RepositorySelector.tsx` → Skeleton dropdown

### Phase 6: Cleanup

- Delete `src/components/ui/loading-spinner.tsx` if no longer used
- Remove `animate-spin` usage from `GlobalLoading.tsx`
- Remove custom CSS keyframes from `MeetView.tsx`
- Verify no remaining `Loader2` with `animate-spin` imports

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/loading-spinner.tsx` | Delete after migration |
| `src/components/GlobalLoading.tsx` | Remove or replace with progress bar |
| `src/App.tsx` | Update Suspense fallback |
| `src/components/auth/LinkedinSignInButton.tsx` | Replace spinner with pulse |
| `src/components/views/MyProjectsView.tsx` | Replace with skeleton grid |
| `src/pages/ProjectDetails.tsx` | Replace page spinner + button spinners (5x) |
| `src/components/dashboard/CreateProject.tsx` | Replace button spinner |
| `src/components/views/DashboardView.tsx` | Replace with dashboard skeleton |
| `src/components/views/DesktopView.tsx` | Replace with desktop skeleton |
| `src/components/workspace/Workspace.tsx` | Replace with repo list skeleton (2x) |
| `src/components/workspace/RepositorySelector.tsx` | Replace text with skeleton |
| `src/components/views/TasksView.tsx` | Replace page spinner + button spinner |
| `src/components/views/CalendarView.tsx` | Replace with calendar skeleton |
| `src/components/views/MeetView.tsx` | Replace all 7 instances |
| `src/components/notes/NoteEditor.tsx` | Replace with editor skeleton |
| `src/components/notes/NotesLayout.tsx` | Replace with note list skeleton |
| `src/components/notes/editor/EditorHeader.tsx` | Replace spinning clock |
| `src/components/notes/editor/ShareDialog.tsx` | Replace button spinner |
| `src/components/views/ChatView.tsx` | Replace send button spinner |
| `src/components/views/MessagesPage.tsx` | Replace search + send spinners |
| `src/components/views/PeopleView.tsx` | Replace invite button spinner |
| `src/components/views/SettingsView.tsx` | Replace page spinner + 6 button spinners |

**New files to create:**

| File | Purpose |
|------|---------|
| `src/components/ui/skeletons/` | Directory for skeleton components |
| `src/components/ui/skeletons/PageSkeleton.tsx` | Generic page skeleton |
| `src/components/ui/skeletons/ProjectCardSkeleton.tsx` | Project card grid skeleton |
| `src/components/ui/skeletons/TaskListSkeleton.tsx` | Task list skeleton |
| `src/components/ui/skeletons/CalendarSkeleton.tsx` | Calendar grid skeleton |
| `src/components/ui/skeletons/DashboardSkeleton.tsx` | Dashboard widget skeleton |
| `src/components/ui/skeletons/SettingsSkeleton.tsx` | Settings form skeleton |
| `src/components/ui/skeletons/NoteListSkeleton.tsx` | Notes sidebar skeleton |
| `src/components/ui/skeletons/EditorSkeleton.tsx` | Editor content skeleton |
| `src/components/ui/skeletons/RepositoryListSkeleton.tsx` | Repository browser skeleton |

---

## Design Guidelines for Skeletons

1. **Match real layout** — Skeletons should mirror the exact dimensions and structure of the loaded content
2. **Use `animate-pulse`** — Subtle pulse animation (already in `Skeleton` component)
3. **No brand colors** — Use `bg-muted` / `bg-secondary/30` for skeleton blocks
4. **Responsive** — Skeletons must match responsive breakpoints of real content
5. **Dark mode compatible** — Use theme-aware classes, not hardcoded colors
6. **Reasonable count** — Show 3-6 skeleton items for lists, not the full expected count

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Skeletons don't match real content layout | Build each skeleton by referencing the actual component's rendered markup |
| Loading state changes break existing logic | Only touch the rendering branch (`if (loading) { ... }`), keep state management untouched |
| Button spinners removed but users get no feedback | Ensure disabled state + text change is clear enough |
| GlobalLoading removal causes blank flashes | Per-page skeletons handle this; test with throttled network |
| Performance regression from many skeleton components | Skeletons are pure CSS (animate-pulse), cheaper than spinners |

---

## Acceptance Criteria

- [ ] Zero instances of `animate-spin` remain in production code
- [ ] Zero instances of `Loader2` import remain
- [ ] `loading-spinner.tsx` deleted
- [ ] `GlobalLoading.tsx` removed or replaced
- [ ] Every page shows a content-shaped skeleton during load
- [ ] All buttons show disabled state + text during actions
- [ ] Dark mode works for all new skeletons
- [ ] Mobile responsive skeletons match their real counterparts
