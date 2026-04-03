# Zync Backend Overview

The Zync backend is a **Node.js/Express** monolith acting as the central orchestrator for the platform. It connects multiple services (Firebase, MongoDB, GitHub, Google AI) and handles real-time collaboration.

## 1. Core Responsibilities

### **A. User & Identity Management (`userRoutes.js`)**
-   **Auth Sync**: Bridges Firebase Auth with MongoDB. The client authenticates with Firebase, then syncs the profile to MongoDB via `/api/users/sync`.
-   **Social Graph**: Manages friend connections, "Close Friends", and connection requests.
-   **Chat Requests**: Handles permission-based chat logic (users must request to chat).
-   **Integrations**: Stores encrypted access tokens for GitHub and Google.

### **B. Project Management & AI (`projectRoutes.js`)**
-   **CRUD Operations**: Manages Projects, Steps, and Tasks.
-   **AI Architecture Analysis**:
    -   Fetches file trees and content from linked GitHub repositories.
    -   Feeds this context into **Google Gemini (Flash models)** to generate architectural diagrams and summaries.
    -   Generates project structures (phases, tasks) from natural language descriptions.
-   **Task System**: Assigning tasks to users, triggering email notifications.

### **C. Real-time Collaboration (`sockets/`)**
-   **Notes (`noteSocketHandler.js`)**:
    -   **Presence**: Tracks who is viewing a note.
    -   **Cursors**: Broadcasts real-time cursor positions.
    -   **CRDT Sync**: Relays `Yjs` update binaries for collaborative auditing (though full persistence logic seems lightweight).
-   **General**: Emits `projectUpdate` events when tasks change, allowing live boards to update without refreshing.

### **D. Integrations**
-   **GitHub (`github.js`)**:
    -   **OAuth**: Authenticates users to read their private repos.
    -   **GitHub App**: A separate integration for deeper repo access (webhooks, extensive read permissions).
    -   **Stats**: Fetches contribution graphs and activity feeds.
-   **Google Meet (`meetRoutes.js`)**:
    -   Generates instant meeting links.
    -   Schedules meetings and emails invites to participants.

### **E. Communication**
-   **Email**: Uses a mailer service (likely Nodemailer) to send:
    -   Task assignments
    -   Meeting invites
    -   Friend requests
    -   verification codes

## 2. Technical Stack Observation
-   **Database**: Uses **Both** Mongoose (Users, Notes) and Prisma (Projects, Tasks). This is unusual and contributes to connection overhead.
-   **Crypto**: Manually encrypts/decrypts integration tokens using `crypto-js`.
-   **Security**: Uses `helmet` for Content Security Policy (CSP).

## 3. Current "Hidden" Work
-   **Polling vs Webhooks**: It seems to rely heavily on fetching data on-demand (e.g., GitHub stats) rather than listening to webhooks for everything, which might be slower but simpler.
-   **Dual-Write**: It writes user data to MongoDB *after* Firebase Auth returns, which is the source of the "drift" risk mentioned in the architecture analysis.
