# Security Policy — ZYNC Desktop Application

<!--
  =============================================================================
  SECURITY.md — ZYNC Desktop Application
  =============================================================================

  This document outlines the security procedures and policies for the ZYNC
  desktop application, including how to report vulnerabilities, our response
  process, and the security measures built into the application.

  =============================================================================
-->

## Supported Versions

The following versions of ZYNC receive security updates:

| Version | Supported |
|---------|-----------|
| 1.x.x  | ✅ Active support |
| < 1.0  | ❌ No longer supported |

## Reporting a Vulnerability

**⚠️ Do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in ZYNC, please report it responsibly:

### How to Report

1. **Email**: Send details to [security@zync.io](mailto:security@zync.io)
2. **Subject**: Use the format: `[SECURITY] Brief description`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)
   - Your contact information

### Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment | Within 24 hours |
| Initial assessment | Within 72 hours |
| Status update | Within 7 days |
| Fix release | Within 30 days (critical) |

### What to Expect

- We will acknowledge receipt of your report
- We will investigate and validate the vulnerability
- We will work on a fix and coordinate disclosure
- We will credit you in the security advisory (unless you prefer anonymity)

## Security Measures

### Electron Security

ZYNC implements the following Electron security best practices:

1. **Context Isolation**: Enabled — renderer JavaScript cannot access Node.js
2. **Node Integration**: Disabled in renderer — prevents direct Node.js access
3. **Sandbox**: Enabled — renderer runs in a sandboxed environment
4. **Content Security Policy**: Strict CSP headers limit resource loading
5. **WebSecurity**: Enabled — enforces same-origin policy
6. **Preload Script**: Only whitelisted APIs exposed via `contextBridge`
7. **IPC Validation**: All IPC inputs validated and sanitized
8. **Protocol Handlers**: Only `http:` and `https:` URLs allowed for external links

### Data Security

- No sensitive data stored in plain text
- Firebase authentication tokens managed by Firebase SDK
- User preferences stored locally in the app data directory
- No telemetry or analytics data collected without consent

### Dependencies

- Dependencies regularly audited with `npm audit`
- Dependabot configured for automated security updates
- Electron and Chromium kept up-to-date for security patches

## Security Checklist for Contributors

When contributing code, ensure:

- [ ] No `nodeIntegration: true` in any BrowserWindow
- [ ] No `contextIsolation: false` in any BrowserWindow
- [ ] All IPC inputs are validated and type-checked
- [ ] No `eval()` or `Function()` in production code
- [ ] External URLs validated before opening with `shell.openExternal()`
- [ ] File paths sanitized to prevent directory traversal
- [ ] No secrets or API keys committed to the repository
- [ ] CSP headers not weakened without documented justification

## Disclosure Policy

- Security issues are disclosed after a fix is available
- CVE identifiers are requested for significant vulnerabilities
- Security advisories are published on the GitHub repository
- Users are notified through the auto-updater mechanism
