# ZYNC Electron Module

> Desktop application layer for ZYNC — built with Electron, TypeScript, and a security-first architecture.

## Architecture Overview

```
electron/
├── main.ts                 # Application entry point — window creation, IPC, lifecycle
├── preload.ts              # Secure context bridge — exposes safe APIs to renderer
├── vitest.config.ts        # Test configuration for Electron-specific tests
│
├── config/                 # Static configuration & security policies
│   ├── app-paths.ts        # Resolved application paths (userData, logs, temp)
│   ├── defaults.ts         # Default window dimensions, CSP, app constants
│   ├── dev-tools.ts        # DevTools setup and React DevTools installer
│   ├── permissions.ts      # Permission handlers with trusted origin list
│   ├── security.ts         # Global security hardening (webSecurity, nodeIntegration)
│   └── shortcuts.ts        # Keyboard shortcut accelerator definitions
│
├── interfaces/             # TypeScript type definitions
│   ├── config.ts           # WindowCreationConfig, CSPDirectives, AppConstants
│   ├── ipc.ts              # IPC channel maps and typed event payloads
│   ├── menu.ts             # Menu template, menu item state, context menu types
│   ├── services.ts         # Service interfaces (IAutoUpdater, INotification, etc.)
│   ├── settings.ts         # ZyncSettings, DEFAULT_ZYNC_SETTINGS, SettingKey
│   ├── tray.ts             # TrayConfig, TrayMenuItem, TrayState
│   ├── updater.ts          # UpdateState enum, UpdateConfig, download progress
│   └── window.ts           # WindowType enum, WindowState, WindowEvent
│
├── main/                   # Main process modules
│   ├── app-lifecycle.ts    # Lifecycle hooks with priority ordering
│   ├── content-protection.ts # Screen capture protection per window
│   ├── crash-reporter.ts   # Crash reporter with log rotation & diagnostics
│   ├── deep-link.ts        # zync:// protocol handler & URL routing
│   ├── dialog-manager.ts   # Centralized dialog API (open/save/message/error)
│   └── native-theme.ts     # System theme detection, IPC broadcast
│
├── preload/                # Preload-specific modules
│   ├── channels.ts         # IPC channel name constants (SEND/INVOKE/RECEIVE)
│   └── validators.ts       # Preload-side validation (URL safety, serialization)
│
├── services/               # Long-running background services
│   ├── download-manager.ts # Download progress tracking, pause/resume, history
│   ├── file-association.ts # File type association & OS integration
│   ├── power-monitor.ts    # Power events (suspend/resume/lock/battery)
│   ├── session-manager.ts  # Cookie, cache, proxy, and spell-check management
│   ├── shortcut-manager.ts # Global keyboard shortcut registration
│   └── theme-watcher.ts    # System theme monitoring with event emission
│
├── settings/               # Settings window
│   ├── index.html          # 8-tab settings UI with sidebar navigation
│   ├── renderer.js         # Tab switching, IPC integration, theme selector
│   ├── store.ts            # electron-store persistence layer with IPC handlers
│   └── style.css           # Settings window styles with dark mode support
│
├── splash/                 # Splash screen
│   └── index.html          # Animated splash shown during app startup
│
├── types/                  # Ambient type declarations
│   ├── electron-env.d.ts   # NodeJS.Process augmentation, ImportMetaEnv
│   └── global.d.ts         # Window augmentation with ElectronAPI interface
│
├── utils/                  # Pure utility functions
│   ├── clipboard.ts        # Safe clipboard read/write wrapper
│   ├── fs-helpers.ts       # Atomic writes, JSON read/write, temp file helpers
│   ├── notifications.ts    # Notification queue, Do Not Disturb, badge count
│   ├── platform.ts         # OS detection, Linux DE detection, system info
│   ├── process-info.ts     # CPU/memory diagnostics, process report
│   ├── screenshot.ts       # Screen capture via desktopCapturer
│   ├── throttle.ts         # Throttle, debounce, and rate limiter
│   └── validator.ts        # URL, file path, IPC payload, string validators
│
└── tests/                  # Test suites
    ├── deep-link.test.ts   # Deep link URL parsing & route classification
    ├── ipc-validation.test.ts # IPC channel validation & serialization checks
    ├── notification.test.ts # Notification queue & DND tests
    ├── security.test.ts    # CSP validation, origin checking, webPreferences
    ├── settings.test.ts    # Settings store CRUD, defaults, validation
    └── window-state.test.ts # Window bounds clamping, multi-display support
```

## Security Model

ZYNC follows the **principle of least privilege** for Electron security:

| Layer | Protection |
|-------|-----------|
| `contextIsolation` | Renderer cannot access Node.js or Electron internals |
| `nodeIntegration: false` | No `require()` or `process` in renderer |
| `sandbox: true` | OS-level sandbox for renderer processes |
| Channel whitelists | Only explicitly listed IPC channels are allowed |
| Payload validation | All IPC payloads checked for serializability |
| CSP headers | Strict Content Security Policy on all windows |
| Permission handlers | Media, geolocation, notifications require explicit approval |
| URL validation | External URLs verified before `shell.openExternal()` |

## IPC Architecture

```
Renderer (React)
    │
    ▼
contextBridge API  (preload.ts)
    │  channel validation
    │  payload serialization check
    ▼
ipcRenderer.invoke / send
    │
    ▼
ipcMain.handle / on  (main.ts)
    │
    ▼
Service / Module
```

All IPC communication flows through the `contextBridge` with:
- **Send channels**: Fire-and-forget messages (close, minimize, etc.)
- **Invoke channels**: Request-response (settings, dialogs, updater)
- **Receive channels**: Main → renderer broadcasts (theme changes, deep links)

## Settings System

Settings are persisted via `electron-store` with:
- Schema validation
- Default values for every key
- IPC integration for renderer read/write
- File watching for external changes
- Settings window with 8 categorized tabs

## Deep Linking

ZYNC registers the `zync://` protocol for:
- `zync://project/<id>` — Open a project
- `zync://invite?code=<code>` — Accept team invite
- `zync://meeting/<room>` — Join a meeting
- `zync://note/<id>` — Open a specific note
- `zync://settings` — Open settings window

## Development

```bash
# Run Electron in development mode
npm run electron:dev

# Run Electron tests
npx vitest --config electron/vitest.config.ts

# Build for Linux AppImage
npm run electron:build
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `electron-store` | Persistent settings storage |
| `electron-updater` | Auto-update (Squirrel / AppImage) |
| `electron-log` | Structured file logging |
| `electron-is-dev` | Development mode detection |

## License

MIT — See [LICENSE](../LICENSE) for details.
