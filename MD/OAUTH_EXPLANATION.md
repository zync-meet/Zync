# Google OAuth Verification — Scope Justification

**Application Name:** ZYNC
**Scope Requested:** `https://www.googleapis.com/auth/calendar`

## Justification for Scope Use

ZYNC is a centralized real-time collaboration desktop application designed to unify team communication and project management. Access to the `https://www.googleapis.com/auth/calendar` scope is a fundamental requirement for our "Team Schedule" feature. By integrating with Google Calendar, ZYNC allows teams to synchronize and view their deadline-driven events and collaborative meetings directly within the application's unified dashboard. This integration eliminates the friction of switching between multiple applications, ensuring that project timelines and team availability are consistently visible alongside active collaboration tasks.

The calendar data is primarily used to populate the "Synchronized Timeline" in the ZYNC dashboard, which provides users with a comprehensive view of their day. Seeing these events in context is essential for effective project management; it allows users to schedule collaborative sessions around existing commitments and ensures that team-wide deadlines are never missed. Without this scope, the application would lose its ability to provide a real-time, holistic view of a team's schedule, significantly diminishing its value as an all-in-one productivity and collaboration platform.

We prioritize user privacy and data security by ensuring that all information retrieved from the Google Calendar API is processed and cached locally on the user's machine. ZYNC does not store your calendar data on any centralized external servers, nor do we share or sell this information to any third parties. Our implementation strictly adheres to the principle of data minimization—only accessing the specific event details required to render the schedule interface—and complies fully with the Google API Services User Data Policy, including all Limited Use requirements.
