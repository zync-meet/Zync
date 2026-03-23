# ZYNC — Real-Time Collaboration Desktop Application

<p align="center">
  <img src="build/icons/icon.png" alt="ZYNC Logo" width="128" height="128" />
</p>

<p align="center">
  <strong>A modern, cross-platform desktop application for real-time team collaboration.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#building">Building</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Table of Contents

<!--
  This table of contents provides a comprehensive overview of all sections
  in this README. Each section is designed to help developers, contributors,
  and users understand the ZYNC desktop application from different perspectives.
-->

- [Overview](#overview)
- [Features](#features)
  - [Core Features](#core-features)
  - [Desktop-Specific Features](#desktop-specific-features)
  - [Collaboration Features](#collaboration-features)
  - [Developer Features](#developer-features)
- [System Requirements](#system-requirements)
  - [Minimum Requirements](#minimum-requirements)
  - [Recommended Specifications](#recommended-specifications)
  - [Supported Operating Systems](#supported-operating-systems)
- [Installation](#installation)
  - [Download Pre-built Binaries](#download-pre-built-binaries)
  - [Windows Installation](#windows-installation)
  - [macOS Installation](#macos-installation)
  - [Linux Installation](#linux-installation)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
  - [Running in Development Mode](#running-in-development-mode)
  - [Project Structure](#project-structure)
  - [Environment Variables](#environment-variables)
- [Building](#building)
  - [Building for Windows](#building-for-windows)
  - [Building for macOS](#building-for-macos)
  - [Building for Linux](#building-for-linux)
  - [Build Configuration](#build-configuration)
- [Architecture](#architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Main Process](#main-process)
  - [Renderer Process](#renderer-process)
  - [Preload Scripts](#preload-scripts)
  - [IPC Communication](#ipc-communication)
  - [Security Model](#security-model)
- [User Profile Data Storage](#user-profile-data-storage)
  - [Profile Information (MongoDB)](#profile-information-mongodb)
  - [Profile Photo (Cloudinary)](#profile-photo-cloudinary)
  - [New User Notifications](#new-user-notifications)
- [Configuration](#configuration)
  - [Application Settings](#application-settings)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Theme Configuration](#theme-configuration)
- [Testing](#testing)
  - [Running Tests](#running-tests)
  - [Test Coverage](#test-coverage)
  - [Writing Tests](#writing-tests)
- [Deployment](#deployment)
  - [Auto-Updates](#auto-updates)
  - [Code Signing](#code-signing)
  - [Release Process](#release-process)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Debug Mode](#debug-mode)
  - [Logging](#logging)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Overview

<!--
  ZYNC is a comprehensive real-time collaboration platform designed for modern
  development teams. The desktop application wraps the web platform in an
  Electron shell, providing native OS integration, system tray functionality,
  desktop notifications, and offline capabilities.
  
  The application uses a hybrid architecture where the web application is loaded
  via URL in the main window, while native features like settings, system tray,
  and auto-updates are handled by the Electron main process.
-->

ZYNC is a **real-time collaboration platform** built for development teams who need
seamless communication, project management, and code collaboration tools in one
unified interface. The desktop application extends the web platform with native
operating system integrations that enhance productivity and user experience.

### Why a Desktop Application?

While the ZYNC web application provides full functionality through any modern
browser, the desktop application offers several advantages that justify its
existence as a standalone native application:

1. **System Tray Integration**: ZYNC runs in the background and provides instant
   access through the system tray icon, allowing users to stay connected without
   keeping a browser tab open.

2. **Native Notifications**: Desktop notifications are delivered through the
   operating system's native notification system, ensuring they are visible even
   when the application is minimized or in the background.

3. **Keyboard Shortcuts**: Global keyboard shortcuts allow users to quickly
   access ZYNC features from anywhere on their desktop, regardless of which
   application is currently in focus.

4. **Auto-Updates**: The application automatically checks for and installs
   updates, ensuring users always have the latest features and security patches
   without manual intervention.

5. **Offline Capabilities**: Certain features continue to work offline, with
   automatic synchronization when connectivity is restored.

6. **Deep Linking**: Custom protocol handlers (`zync://`) allow other applications
   to deep-link directly into specific ZYNC features or conversations.

7. **Window Management**: Multi-window support with persistent window state
   (position, size, maximization state) across application restarts.

---

## Features

### Core Features

<!--
  The core features section describes the primary functionality available
  in the ZYNC desktop application. These features are the foundation of
  the collaboration platform and are accessible through the main application
  window.
-->

| Feature | Description |
|---------|-------------|
| **Dashboard** | Centralized overview of all team activities, recent projects, and quick actions |
| **Workspace** | Kanban-style project boards with drag-and-drop task management |
| **Calendar** | Team calendar with meeting scheduling and deadline tracking |
| **Notes** | Real-time collaborative note editor with rich text formatting |
| **Tasks** | Comprehensive task management with assignments, due dates, and priorities |
| **Chat** | Real-time messaging with @mentions, file attachments, and message reactions |
| **Meet** | Video conferencing integration for team meetings and pair programming |
| **Activity Log** | Detailed activity tracking with time logging and contribution graphs |

### Desktop-Specific Features

<!--
  These features are exclusive to the desktop application and are not
  available in the web version. They leverage Electron's access to native
  OS APIs to provide enhanced functionality.
-->

| Feature | Description |
|---------|-------------|
| **System Tray** | Background operation with quick-access context menu |
| **Auto-Updates** | Automatic application updates with progress notifications |
| **Native Notifications** | OS-level notifications for messages, mentions, and reminders |
| **Global Shortcuts** | System-wide keyboard shortcuts for quick access |
| **Deep Linking** | `zync://` protocol support for external integrations |
| **Window Persistence** | Remembers window position, size, and state across sessions |
| **Splash Screen** | Branded loading screen during application startup |
| **Crash Reporting** | Automatic crash report collection and submission |
| **Settings Page** | Native settings interface with download links for all platforms |

### Collaboration Features

<!--
  Collaboration features enable team members to work together effectively
  in real-time. These features are powered by WebSocket connections and
  Firebase Realtime Database for instant synchronization.
-->

- **Real-Time Presence**: See who is online, away, or offline in real-time
- **Collaborative Editing**: Multiple users can edit the same document simultaneously
- **Screen Sharing**: Share your screen during video calls for pair programming
- **File Sharing**: Drag-and-drop file sharing with preview support
- **@Mentions**: Tag team members in conversations and notes for notifications
- **Activity Graphs**: Visual representation of team activity and contributions
- **Team Management**: Create and manage teams with role-based access control

### Developer Features

<!--
  Developer features are designed to integrate ZYNC into the software
  development workflow, providing tools for code review, version control,
  and deployment tracking.
-->

- **GitHub Integration**: Connect GitHub accounts for repository management
- **Git Commands**: Built-in Git command reference and quick actions
- **Repository Selector**: Browse and manage connected repositories
- **Task-Git Sync**: Link tasks to Git branches, commits, and pull requests
- **Contribution Graph**: GitHub-style contribution visualization

---

## System Requirements

### Minimum Requirements

<!--
  These are the minimum system requirements needed to run the ZYNC desktop
  application. The application may run on systems below these specifications
  but performance may be degraded.
-->

| Component | Requirement |
|-----------|-------------|
| **CPU** | 1.6 GHz dual-core processor |
| **RAM** | 2 GB |
| **Storage** | 500 MB available disk space |
| **Display** | 1280 x 720 resolution |
| **Network** | Broadband internet connection (for real-time features) |

### Recommended Specifications

<!--
  These specifications provide the best experience when using the ZYNC
  desktop application, especially when using resource-intensive features
  like video conferencing and collaborative editing.
-->

| Component | Specification |
|-----------|---------------|
| **CPU** | 2.0 GHz quad-core processor or better |
| **RAM** | 4 GB or more |
| **Storage** | 1 GB available disk space |
| **Display** | 1920 x 1080 resolution or higher |
| **Network** | High-speed internet connection (10 Mbps+) |
| **Camera** | Webcam (for video conferencing features) |
| **Microphone** | Built-in or external microphone (for audio features) |

### Supported Operating Systems

<!--
  The following operating systems are officially supported and tested.
  The application may work on other versions but is not guaranteed to
  function correctly. Each platform has specific build targets and
  installer formats.
-->

| Platform | Versions | Architecture | Installer |
|----------|----------|-------------|-----------|
| **Windows** | Windows 10, Windows 11 | x64, arm64 | NSIS (.exe) |
| **macOS** | macOS 10.15 (Catalina) and later | x64, arm64 (Apple Silicon) | DMG (.dmg) |
| **Linux** | Ubuntu 18.04+, Fedora 32+, Debian 10+ | x64 | AppImage (.AppImage) |

---

## Installation

### Download Pre-built Binaries

<!--
  Pre-built binaries are the easiest way to install ZYNC. They are
  available for all supported platforms from the GitHub Releases page.
  Each release includes checksums for verifying download integrity.
-->

Visit the [Releases](https://github.com/ChitkulLakshya/Zync/releases) page to
download the latest version for your platform.

### Windows Installation

<!--
  The Windows installer uses NSIS (Nullsoft Scriptable Install System) to
  provide a familiar installation experience. Users can choose the
  installation directory and whether to create desktop/start menu shortcuts.
-->

1. Download `ZYNC-Setup-x.x.x.exe` from the Releases page
2. Run the installer
3. Choose the installation directory (default: `C:\Program Files\ZYNC`)
4. Select whether to create desktop and Start Menu shortcuts
5. Click "Install" to complete the installation
6. Launch ZYNC from the desktop shortcut or Start Menu

**Silent Installation (for system administrators):**
```powershell
# Install silently with default options
ZYNC-Setup-x.x.x.exe /S

# Install to a custom directory
ZYNC-Setup-x.x.x.exe /S /D=C:\CustomPath\ZYNC
```

### macOS Installation

<!--
  The macOS installer uses a DMG (Disk Image) format, which is the standard
  installation method on macOS. Users simply drag the application to the
  Applications folder.
-->

1. Download `ZYNC-x.x.x.dmg` from the Releases page
2. Open the DMG file
3. Drag `ZYNC.app` to the `Applications` folder
4. Launch ZYNC from the Applications folder or Spotlight search
5. If prompted about the application being from an unidentified developer:
   - Go to System Preferences → Security & Privacy
   - Click "Open Anyway"

**Installation via Homebrew (coming soon):**
```bash
# Install via Homebrew Cask
brew install --cask zync
```

### Linux Installation

<!--
  The Linux build uses AppImage format, which is a portable application
  format that works on most Linux distributions without requiring
  installation. Simply make the file executable and run it.
-->

1. Download `ZYNC-x.x.x.AppImage` from the Releases page
2. Make the file executable:
   ```bash
   chmod +x ZYNC-x.x.x.AppImage
   ```
3. Run the application:
   ```bash
   ./ZYNC-x.x.x.AppImage
   ```

**Desktop Integration:**
```bash
# Install AppImageLauncher for desktop integration
# Then double-click the AppImage to integrate it into your desktop
sudo apt install appimagelauncher
```

---

## Development

### Prerequisites

<!--
  Before setting up the development environment, ensure you have the
  following tools installed on your system. These are required for
  building and running the ZYNC desktop application from source.
-->

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18.x or later | JavaScript runtime for building and running |
| **npm** | 9.x or later | Package manager for installing dependencies |
| **Git** | 2.x or later | Version control for source code management |
| **Python** | 3.x | Required by some native Node.js modules |
| **Visual Studio Build Tools** | 2019+ (Windows only) | Required for compiling native modules on Windows |
| **Xcode Command Line Tools** | (macOS only) | Required for compiling native modules on macOS |

### Setting Up the Development Environment

<!--
  Follow these steps to set up a local development environment for the
  ZYNC desktop application. This will allow you to make changes to the
  source code and test them locally before submitting a pull request.
-->

```bash
# Step 1: Clone the repository from GitHub
# This creates a local copy of the source code on your machine
git clone https://github.com/ChitkulLakshya/Zync.git

# Step 2: Navigate into the project directory
# All subsequent commands should be run from this directory
cd Zync

# Step 3: Install all project dependencies
# This installs both production and development dependencies
# defined in package.json. The installation may take several
# minutes depending on your internet connection speed.
npm install

# Step 4: Create a local environment file
# Copy the example environment file and fill in your own values
# for the Firebase configuration and API URLs
cp .env.example .env

# Step 5: Verify the installation
# Run the TypeScript compiler to check for any type errors
npx tsc --noEmit
```

### Running in Development Mode

<!--
  Development mode starts the Vite development server for the frontend
  and the Electron application simultaneously. Changes to the frontend
  code will be hot-reloaded automatically, while changes to the Electron
  main process code will require a restart.
-->

```bash
# Start the application in development mode
# This runs both the Vite dev server and Electron concurrently
npm run electron:dev

# Alternatively, run just the web application without Electron
# Useful for frontend development and testing
npm run dev

# Run with verbose logging enabled
# This provides detailed output for debugging purposes
ELECTRON_ENABLE_LOGGING=1 npm run electron:dev
```

### Project Structure

<!--
  The following directory structure shows the organization of the ZYNC
  project. Each directory serves a specific purpose in the application
  architecture. Understanding this structure is essential for contributing
  to the project.
-->

```
Zync/
├── .github/                    # GitHub-specific configuration files
│   ├── workflows/              # GitHub Actions CI/CD workflows
│   │   ├── electron-build.yml  # Automated build pipeline for all platforms
│   │   ├── release.yml         # Automated release pipeline
│   │   └── codeql.yml          # Security analysis workflow
│   └── dependabot.yml          # Automated dependency update configuration
│
├── build/                      # Build resources for electron-builder
│   └── icons/                  # Application icons for all platforms
│       ├── icon.ico            # Windows icon (256x256, multi-size ICO)
│       ├── icon.icns           # macOS icon (512x512, Apple Icon format)
│       └── icon.png            # Linux icon (512x512, PNG format)
│
├── docs/                       # Developer documentation
│   ├── ARCHITECTURE.md         # System architecture documentation
│   ├── DEVELOPMENT.md          # Development setup guide
│   └── DEPLOYMENT.md           # Deployment and release guide
│
├── electron/                   # Electron main process source code
│   ├── assets/                 # Static assets for the Electron app
│   │   ├── icons.ts            # Base64-encoded SVG icons
│   │   ├── platform-logos.ts   # Base64-encoded platform logos
│   │   ├── sounds.ts           # Base64-encoded notification sounds
│   │   └── splash.ts           # Splash screen resources
│   │
│   ├── config/                 # Configuration modules
│   │   ├── constants.ts        # Application-wide constants
│   │   ├── csp.ts              # Content Security Policy configuration
│   │   ├── defaults.ts         # Default configuration values
│   │   ├── permissions.ts      # Permission handler configuration
│   │   └── security.ts         # Security policy configuration
│   │
│   ├── interfaces/             # TypeScript interface definitions
│   │   ├── config.ts           # Configuration interfaces
│   │   ├── ipc.ts              # IPC message interfaces
│   │   ├── services.ts         # Service interfaces
│   │   ├── settings.ts         # Settings interfaces
│   │   ├── updater.ts          # Auto-updater interfaces
│   │   └── window.ts           # Window management interfaces
│   │
│   ├── main/                   # Main process modules
│   │   ├── crash-reporter.ts   # Crash reporting service
│   │   ├── deep-link.ts        # Deep linking handler
│   │   ├── ipc-handlers.ts     # IPC event handlers
│   │   ├── menu.ts             # Application menu builder
│   │   ├── tray.ts             # System tray manager
│   │   └── window-state.ts     # Window state persistence
│   │
│   ├── preload/                # Preload script modules
│   │   └── types.d.ts          # Type definitions for exposed APIs
│   │
│   ├── renderer/               # Renderer process helpers
│   │
│   ├── services/               # Background services
│   │   └── auto-updater.ts     # Auto-update service
│   │
│   ├── settings/               # Settings window
│   │   ├── about.html          # About page
│   │   ├── about.js            # About page logic
│   │   ├── animations.css      # Settings page animations
│   │   ├── index.html          # Settings page layout
│   │   ├── platform-utils.js   # Platform detection utilities
│   │   ├── renderer.js         # Settings page renderer
│   │   ├── shortcuts.html      # Keyboard shortcuts reference
│   │   ├── shortcuts.js        # Shortcuts page logic
│   │   ├── store.ts            # Settings persistence
│   │   └── style.css           # Settings page styles
│   │
│   ├── splash/                 # Splash screen
│   │   ├── index.html          # Splash screen layout
│   │   └── style.css           # Splash screen styles
│   │
│   ├── types/                  # Global type definitions
│   │   ├── electron-env.d.ts   # Electron environment types
│   │   └── global.d.ts         # Global type augmentations
│   │
│   ├── utils/                  # Utility modules
│   │   ├── clipboard.ts        # Clipboard utilities
│   │   ├── fs-helpers.ts       # File system helpers
│   │   ├── logger.ts           # Logging utility
│   │   ├── network.ts          # Network connectivity checker
│   │   ├── notifications.ts    # Notification manager
│   │   ├── paths.ts            # Platform-specific path resolver
│   │   └── screenshot.ts       # Screenshot utility
│   │
│   ├── main.ts                 # Main process entry point
│   └── preload.ts              # Preload script entry point
│
├── src/                        # Frontend (renderer process) source code
│   ├── api/                    # API client modules
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── kibo-ui/            # Custom UI components
│   │   ├── landing/            # Landing page components
│   │   ├── layout/             # Layout components (navbar, etc.)
│   │   ├── notes/              # Note editor components
│   │   ├── ui/                 # Shadcn/UI component library
│   │   ├── views/              # View components (pages within dashboard)
│   │   └── workspace/          # Workspace components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Library utilities
│   ├── pages/                  # Top-level page components
│   ├── services/               # Frontend service modules
│   ├── App.tsx                 # Root application component
│   ├── index.css               # Global styles
│   ├── main.tsx                # Application entry point
│   └── vite-env.d.ts           # Vite type definitions
│
├── tests/                      # Test files
│   ├── main/                   # Main process tests
│   └── utils/                  # Utility tests
│
├── backend/                    # Backend server source code
│
├── .editorconfig               # Editor configuration for consistent formatting
├── .eslintrc.cjs               # ESLint configuration
├── .gitignore                  # Git ignore rules
├── .prettierrc.json            # Prettier formatting configuration
├── CHANGELOG.md                # Version changelog
├── CODE_OF_CONDUCT.md          # Community code of conduct
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # MIT License
├── SECURITY.md                 # Security policy
├── electron-builder.yml        # Electron Builder configuration
├── index.html                  # Application entry HTML
├── package.json                # Project metadata and dependencies
├── package-lock.json           # Locked dependency versions
├── tsconfig.json               # Root TypeScript configuration
├── tsconfig.app.json           # Frontend TypeScript configuration
├── tsconfig.electron.json      # Electron TypeScript configuration
├── tsconfig.node.json          # Node.js TypeScript configuration
└── vite.config.ts              # Vite build configuration
```

### Environment Variables

<!--
  The following environment variables are used by the ZYNC application.
  These should be defined in a .env file in the project root directory.
  Never commit the .env file to version control; use .env.example as
  a template instead.
-->

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | `http://localhost:5000` |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes | — |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes | — |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes | — |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes | — |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes | — |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes | — |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | No | — |
| `ELECTRON_ENABLE_LOGGING` | Enable verbose Electron logging | No | `false` |

---

## Building

### Building for Windows

<!--
  Building for Windows requires the NSIS (Nullsoft Scriptable Install System)
  to create the installer. This is automatically handled by electron-builder.
  Code signing requires a valid certificate from a Certificate Authority.
-->

```bash
# Build the Windows installer (.exe)
# This creates an NSIS installer in the dist_electron directory
npm run electron:build -- --win

# Build without code signing (for development/testing)
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build -- --win
```

### Building for macOS

<!--
  Building for macOS requires Xcode Command Line Tools and creates a
  DMG disk image. For distribution through the Mac App Store, additional
  code signing and notarization steps are required.
-->

```bash
# Build the macOS DMG installer
# Note: Must be run on a macOS machine
npm run electron:build -- --mac

# Build for both Intel and Apple Silicon
npm run electron:build -- --mac --x64 --arm64
```

### Building for Linux

<!--
  Building for Linux creates an AppImage, which is a portable application
  format that works across most Linux distributions without requiring
  installation or root access.
-->

```bash
# Build the Linux AppImage
npm run electron:build -- --linux

# Build for specific architectures
npm run electron:build -- --linux --x64
```

### Build Configuration

<!--
  The build configuration is defined in electron-builder.yml. This file
  controls all aspects of the build process, including output directories,
  file inclusion/exclusion patterns, and platform-specific settings.
  
  See the electron-builder documentation for all available options:
  https://www.electron.build/configuration/configuration
-->

The build process is configured through `electron-builder.yml`. Key settings:

- **Output Directory**: `dist_electron/` — All build artifacts are placed here
- **Build Resources**: `build/` — Icons and other build-time resources
- **File Patterns**: Only `electron/**/*` and `package.json` are included
- **Windows**: NSIS installer with optional installation directory selection
- **macOS**: DMG with drag-to-Applications layout
- **Linux**: AppImage for maximum compatibility

---

## Architecture

### High-Level Architecture

<!--
  The ZYNC desktop application follows a multi-process architecture as
  defined by Electron. The main process manages the application lifecycle,
  creates windows, and handles native OS interactions. The renderer process
  runs the React-based web application. Communication between processes
  happens through IPC (Inter-Process Communication) channels.
-->

```
┌─────────────────────────────────────────────────────────────────┐
│                     ZYNC Desktop Application                      │
│                                                                   │
│  ┌──────────────────────┐          ┌──────────────────────────┐  │
│  │    Main Process       │          │   Renderer Process        │  │
│  │   (electron/main.ts)  │   IPC    │  (Vite + React App)       │  │
│  │                       │◄────────►│                           │  │
│  │  • Window Management  │          │  • Dashboard              │  │
│  │  • System Tray        │          │  • Workspace              │  │
│  │  • Auto-Updates       │          │  • Chat                   │  │
│  │  • Native Menus       │          │  • Notes                  │  │
│  │  • Deep Linking       │          │  • Calendar               │  │
│  │  • Notifications      │          │  • Tasks                  │  │
│  │  • File System        │          │  • Settings               │  │
│  │                       │          │  • Meet                   │  │
│  └──────────────────────┘          └──────────────────────────┘  │
│           │                                    │                   │
│           │ Preload Script                     │ Web APIs          │
│           │ (electron/preload.ts)              │                   │
│           │                                    │                   │
│           ▼                                    ▼                   │
│  ┌──────────────────────┐          ┌──────────────────────────┐  │
│  │   Node.js APIs        │          │   Backend Server          │  │
│  │  (File System, OS)    │          │  (Express + MongoDB)      │  │
│  └──────────────────────┘          └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Main Process

<!--
  The main process is the entry point of the Electron application. It runs
  in a Node.js environment and has full access to the operating system.
  The main process is responsible for creating and managing browser windows,
  handling application lifecycle events, and providing native OS integration.
-->

The main process (`electron/main.ts`) is responsible for:

1. **Application Lifecycle**: Handling `ready`, `window-all-closed`, and
   `activate` events to manage the application lifecycle correctly across
   all platforms.

2. **Window Management**: Creating and managing the main application window
   and secondary windows (settings, about). Window state (position, size,
   maximized state) is persisted across sessions.

3. **System Tray**: Creating a system tray icon with a context menu that
   allows users to show/hide the window, check for updates, and quit.

4. **Menu System**: Building the application menu bar with keyboard shortcuts
   for common actions.

5. **Auto-Updates**: Checking for updates on startup and periodically,
   downloading updates in the background, and notifying users when updates
   are ready to install.

6. **IPC Handlers**: Handling messages from the renderer process for actions
   that require Node.js or native OS access.

### Renderer Process

<!--
  The renderer process runs the web application inside a Chromium-based
  browser window. In ZYNC, the renderer process loads the web application
  from a URL (development server or production URL) and renders the React
  application.
-->

The renderer process loads the ZYNC web application, which is built with:

- **React** — UI component library
- **Vite** — Build tool and development server
- **React Router** — Client-side routing
- **TanStack Query** — Data fetching and caching
- **Firebase** — Authentication and real-time database
- **Tailwind CSS** — Utility-first CSS framework
- **Shadcn/UI** — Component library built on Radix UI primitives

### Preload Scripts

<!--
  Preload scripts run before the renderer process is loaded and serve as
  a secure bridge between the main process and the renderer process. They
  use Electron's contextBridge API to selectively expose Node.js and
  Electron APIs to the renderer process.
-->

The preload script (`electron/preload.ts`) provides a secure bridge between
the main and renderer processes by exposing specific APIs through
`contextBridge`:

- `electron.downloadPlatform(platform)` — Request platform-specific downloads
- `electron.openSettings()` — Open the native settings window
- `electron.on(channel, callback)` — Listen for main process messages
- `versions.node()` — Get Node.js version
- `versions.chrome()` — Get Chrome version
- `versions.electron()` — Get Electron version

### IPC Communication

<!--
  IPC (Inter-Process Communication) is the mechanism by which the main
  process and renderer process exchange messages. ZYNC uses a whitelist-based
  approach where only pre-approved channels are allowed, preventing arbitrary
  IPC calls from the renderer process.
-->

Communication between processes uses Electron's IPC module with strict
channel whitelisting:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `download-platform` | Renderer → Main | Request platform download |
| `open-settings` | Renderer → Main | Open settings window |
| `check-for-updates` | Renderer → Main | Trigger update check |
| `get-app-version` | Renderer → Main | Get application version |
| `fromMain` | Main → Renderer | Send messages to renderer |

### Security Model

<!--
  Security is a top priority for the ZYNC desktop application. The following
  security measures are implemented to protect users and their data:
-->

1. **Context Isolation**: Enabled by default, preventing the renderer process
   from directly accessing Node.js APIs.

2. **Node Integration**: Disabled in the renderer process, requiring all
   Node.js access to go through the preload script.

3. **Content Security Policy**: Strict CSP headers prevent XSS attacks and
   unauthorized script execution.

4. **Channel Whitelisting**: Only pre-approved IPC channels are allowed,
   preventing arbitrary communication between processes.

5. **Input Validation**: All IPC messages are validated before processing
   to prevent injection attacks.

6. **HTTPS Only**: The application only loads content over HTTPS in
   production mode.

---

## User Profile Data Storage

When a user creates an account or updates their profile, the data is stored across the following services:

### Profile Information (MongoDB)

All user profile fields are stored in the **MongoDB** database (`ZYNC_USER` → `users` collection). This includes:

| Field | Description | Updated When |
|-------|-------------|--------------|
| `displayName` | User's display name | Account creation / profile edit |
| `firstName`, `lastName` | First and last name | Account creation / profile edit |
| `email` | Email address | Account creation |
| `photoURL` | Cloudinary URL to profile photo | Profile photo upload |
| `phoneNumber` | Phone number | Profile edit |
| `status`, `lastSeen` | Online presence | Every login / disconnect |
| `githubIntegration` | Linked GitHub account details | GitHub OAuth sync |

**Backend route**: `POST /api/users/sync` (`backend/routes/userRoutes.js`) — called automatically on every login via the `useUserSync` hook (`src/hooks/use-user-sync.ts`). If the user already exists, only `status`, `lastSeen`, and missing fields are updated. If the user is new, a full record is created.

**Profile updates**: `PUT /api/users/:uid` (`backend/routes/userRoutes.js`) — called when a user edits their profile from the Settings page.

### Profile Photo (Cloudinary)

Profile photos are uploaded to **Cloudinary** under the `zync-profiles` folder.

- **Backend route**: `POST /api/upload/profile-photo` (`backend/routes/uploadRoutes.js`)
- The image is cropped to **400×400** with face detection (`gravity: face`)
- Stored as `profile_{uid}` in Cloudinary (overwrites on re-upload)
- The resulting Cloudinary URL is saved back to the `photoURL` field in MongoDB

### New User Notifications

When a **new** user creates an account (first-time sync only):

1. **Admin Email** — A notification email is sent to `consolemaster.app@gmail.com` with the new user's name, email, and UID
2. **Google Sheets** — A new row is appended to the tracking spreadsheet with the user's name, email, and registration date (`backend/services/sheetLogger.js`)

> **Note:** These notifications are triggered only once per user — on their very first login when their record is created in the database. Subsequent logins do not trigger any email or sheet logging.

---

## Configuration

### Application Settings

<!--
  Application settings are stored locally using electron-store and
  are persisted across application restarts. The settings interface
  provides a user-friendly way to configure the application.
-->

The ZYNC desktop application can be configured through the Settings page,
accessible from the application menu or by pressing `Ctrl+,` (Windows/Linux)
or `Cmd+,` (macOS).

Available settings include:

| Setting | Description | Default |
|---------|-------------|---------|
| **Start on Login** | Launch ZYNC when the system starts | Disabled |
| **Minimize to Tray** | Minimize to system tray instead of taskbar | Enabled |
| **Auto-Update** | Automatically download and install updates | Enabled |
| **Notifications** | Enable desktop notifications | Enabled |
| **Theme** | Application theme (Light, Dark, System) | System |
| **Language** | Application language | English |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Create new note |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + Q` | Quit application |
| `Ctrl/Cmd + R` | Reload application |
| `Ctrl/Cmd + Shift + I` | Open Developer Tools |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Reset zoom |
| `F11` | Toggle fullscreen |

---

## Testing

### Running Tests

<!--
  Tests are organized into categories based on the module being tested.
  Main process tests verify the Electron-specific functionality, while
  utility tests verify the helper modules used across the application.
-->

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run only main process tests
npm test -- --testPathPattern=tests/main

# Run only utility tests
npm test -- --testPathPattern=tests/utils

# Run tests in watch mode during development
npm run test:watch
```

---

## Troubleshooting

### Common Issues

<!--
  This section documents frequently encountered issues and their solutions.
  If you encounter an issue not listed here, please open a GitHub issue
  with detailed reproduction steps.
-->

#### Application won't start

```bash
# Clear the application cache and try again
# Windows
rmdir /s /q "%APPDATA%\ZYNC"

# macOS
rm -rf ~/Library/Application\ Support/ZYNC

# Linux
rm -rf ~/.config/ZYNC
```

#### Build fails on Windows

Ensure Visual Studio Build Tools are installed:
```powershell
npm install --global windows-build-tools
```

#### Blank screen after launch

This usually indicates the web application URL is unreachable:
1. Check your internet connection
2. Verify the `VITE_API_URL` environment variable is set correctly
3. Try running `npm run dev` separately to verify the dev server works

### Debug Mode

<!--
  Debug mode enables additional logging and developer tools that are
  useful for diagnosing issues. This should not be used in production
  as it may expose sensitive information.
-->

```bash
# Enable debug mode with verbose logging
ELECTRON_ENABLE_LOGGING=1 DEBUG=* npm run electron:dev

# Open DevTools automatically on startup
npm run electron:dev -- --inspect
```

### Logging

<!--
  Application logs are stored in platform-specific locations and can be
  useful for diagnosing issues that are difficult to reproduce.
-->

Log files are stored in the following locations:

| Platform | Log Location |
|----------|-------------|
| **Windows** | `%APPDATA%\ZYNC\logs\` |
| **macOS** | `~/Library/Logs/ZYNC/` |
| **Linux** | `~/.config/ZYNC/logs/` |

---

## Contributing

We welcome contributions from the community! Please read our
[Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Commit using conventional commits: `git commit -m "feat: add new feature"`
5. Push to your fork: `git push origin feature/my-feature`
6. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE)
file for details.

---

## Acknowledgments

<!--
  This section acknowledges the open-source projects and contributors
  that make ZYNC possible. We are grateful for the incredible work done
  by these communities.
-->

- [Electron](https://www.electronjs.org/) — Framework for cross-platform desktop apps
- [React](https://react.dev/) — UI component library
- [Vite](https://vitejs.dev/) — Next-generation frontend build tool
- [Firebase](https://firebase.google.com/) — Backend-as-a-Service platform
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Shadcn/UI](https://ui.shadcn.com/) — Beautifully designed components
- [electron-builder](https://www.electron.build/) — Complete solution for packaging Electron apps

---

<p align="center">
  Made with ❤️ by the ZYNC Team
</p>
