# ZYNC Desktop Application

> A highly detailed, robust Electron application with extensive documentation, testing, and features.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

ZYNC is a cross-platform desktop application built with Electron, React, and TypeScript. It is designed to be a comprehensive example of a modern, scalable, and production-ready Electron app.

## Features

- **Hybrid Architecture**: Loads external web content while providing native local settings.
- **Cross-Platform**: Supports Windows, macOS, and Linux.
- **Robust State Management**: Uses Redux Toolkit with persistence.
- **Theming**: Extensive theme system with dark/light mode support.
- **Internationalization**: Support for 50+ languages.
- **Auto-Updates**: Integrated auto-updater logic.
- **Offline Support**: Local database and caching strategies.

## Architecture

The project follows a strict separation of concerns:

- **Main Process**: Handles window management, IPC, and system integration.
- **Renderer Process**: React-based UI for the frontend.
- **Preload Scripts**: Secure bridges between Main and Renderer processes.
- **Shared**: Common types, utilities, and constants.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

```bash
npm install
```

### Running in Development

```bash
npm run electron:dev
```

## Development

We use a strict set of tools to ensure code quality:

- **TypeScript**: For static typing.
- **ESLint**: For linting.
- **Prettier**: For formatting.
- **Husky**: For git hooks.

## Building

To build the application for your current platform:

```bash
npm run electron:build
```

To build for all platforms:

```bash
npm run electron:pack
```

## Testing

We use Jest for unit/integration tests and Playwright for E2E tests.

```bash
npm run test
npm run test:e2e
```

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
