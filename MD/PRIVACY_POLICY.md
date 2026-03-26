# Privacy Policy — ZYNC Desktop Application

**Last Updated: February 13, 2026**

<!--
  =============================================================================
  PRIVACY_POLICY.md — ZYNC Desktop Application
  =============================================================================
  This document outlines how ZYNC ("we", "our", or "us") collects, uses, and
  protects your information when you use our desktop application and its
  integrations, specifically with Google APIs.
  =============================================================================
-->

## Introduction
ZYNC is a real-time collaboration desktop application designed to streamline team workflows. This Privacy Policy explains our practices regarding the collection, use, and disclosure of your information, including data received from Google APIs.

## Information We Collect
To provide our core collaboration features, ZYNC collects the following information:

### Google User Data
When you connect your Google Account to ZYNC, we request access to your **Google Calendar** data via OAuth 2.0. The specific information we collect includes:
- **Calendar Events**: Summaries, start/end times, and descriptions of team meetings.
- **Calendar Metadata**: Names and identifiers of calendars you choose to synchronize.

### Local Application Data
- **Application Settings**: Preferences stored locally on your device (theme, notification settings).
- **Log Data**: Technical logs created during app usage (stored locally) to assist with debugging.

## How We Use Your Information
We use the information collected from Google Calendar exclusively to:
1. **Display Team Meetings**: Show your upcoming schedule directly within the ZYNC dashboard.
2. **Synchronize Schedules**: Ensure that meeting changes made in Google Calendar are reflected in ZYNC in real-time.
3. **Notify Users**: Provide desktop notifications for upcoming meetings.

**We do not use your Google Calendar data for any other purpose, such as marketing, profiling, or selling to third parties.**

## Google API "Limited Use" Disclosure
ZYNC's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

## Data Retention and Deletion
- **Local Cache**: Google Calendar data is cached locally on your device to improve performance. This cache is cleared when you log out of the application or disconnect the integration.
- **Authentication Tokens**: OAuth tokens are stored securely in your system's keychain/credentials manager.
- **Deletion**: You can revoke ZYNC's access to your Google Account at any time via your [Google Security Settings](https://myaccount.google.com/permissions). Upon revocation, ZYNC will no longer be able to access your calendar data, and local caches will be purged.

## Third-Party Disclosure
We do not share your personal information or Google Calendar data with third-party services, except as required to provide the core functionality (e.g., Firebase for real-time synchronization of non-calendar ZYNC data) or as required by law.

## Security
We implement industry-standard security measures to protect your data, including:
- **Encryption**: All data in transit is encrypted via HTTPS/TLS.
- **Context Isolation**: The ZYNC desktop app uses Electron's security features (context isolation and sandboxing) to ensure your local data remains secure.

## Changes to This Policy
We may update this Privacy Policy from time to time. We will notify you of any significant changes via the application or our official website.

## Contact Information
If you have any questions or concerns about this Privacy Policy or our data practices, please contact:

**Lakshya Chitkul**
Lead Developer, ZYNC
Email: [lakshya@zync.io](mailto:lakshya@zync.io)
GitHub: [ChitkulLakshya](https://github.com/ChitkulLakshya)
