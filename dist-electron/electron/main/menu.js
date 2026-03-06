import { app, Menu, shell, dialog, } from 'electron';
const isMac = process.platform === 'darwin';
const APP_NAME = 'ZYNC';
export function buildApplicationMenu(mainWindow) {
    const macAppMenu = {
        label: APP_NAME,
        submenu: [
            {
                label: `About ${APP_NAME}`,
                role: 'about',
            },
            { type: 'separator' },
            {
                label: 'Preferences...',
                accelerator: 'Cmd+,',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'open-settings' });
                    }
                },
            },
            { type: 'separator' },
            {
                label: 'Services',
                role: 'services',
            },
            { type: 'separator' },
            {
                label: `Hide ${APP_NAME}`,
                role: 'hide',
            },
            {
                label: 'Hide Others',
                role: 'hideOthers',
            },
            {
                label: 'Show All',
                role: 'unhide',
            },
            { type: 'separator' },
            {
                label: `Quit ${APP_NAME}`,
                role: 'quit',
            },
        ],
    };
    const fileMenu = {
        label: 'File',
        submenu: [
            {
                label: 'New Window',
                accelerator: 'CmdOrCtrl+N',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'new-window' });
                    }
                },
            },
            { type: 'separator' },
            {
                label: 'Settings',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'open-settings' });
                    }
                },
            },
            { type: 'separator' },
            isMac
                ? { label: 'Close Window', role: 'close' }
                : { label: 'Exit', role: 'quit' },
        ],
    };
    const editMenu = {
        label: 'Edit',
        submenu: [
            { label: 'Undo', role: 'undo' },
            { label: 'Redo', role: 'redo' },
            { type: 'separator' },
            { label: 'Cut', role: 'cut' },
            { label: 'Copy', role: 'copy' },
            { label: 'Paste', role: 'paste' },
            { label: 'Delete', role: 'delete' },
            { type: 'separator' },
            { label: 'Select All', role: 'selectAll' },
            ...(isMac
                ? [
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { label: 'Start Speaking', role: 'startSpeaking' },
                            { label: 'Stop Speaking', role: 'stopSpeaking' },
                        ],
                    },
                ]
                : []),
        ],
    };
    const viewMenu = {
        label: 'View',
        submenu: [
            { label: 'Reload', role: 'reload' },
            { label: 'Force Reload', role: 'forceReload' },
            { label: 'Toggle Developer Tools', role: 'toggleDevTools' },
            { type: 'separator' },
            { label: 'Actual Size', role: 'resetZoom' },
            { label: 'Zoom In', role: 'zoomIn' },
            { label: 'Zoom Out', role: 'zoomOut' },
            { type: 'separator' },
            { label: 'Toggle Full Screen', role: 'togglefullscreen' },
        ],
    };
    const windowMenu = {
        label: 'Window',
        submenu: [
            { label: 'Minimize', role: 'minimize' },
            { label: 'Zoom', role: 'zoom' },
            ...(isMac
                ? [
                    { type: 'separator' },
                    { label: 'Bring All to Front', role: 'front' },
                ]
                : [
                    { label: 'Close', role: 'close' },
                ]),
        ],
    };
    const helpMenu = {
        label: 'Help',
        submenu: [
            {
                label: `${APP_NAME} Documentation`,
                click: async () => {
                    await shell.openExternal('https://github.com/ChitkulLakshya/Zync#readme');
                },
            },
            {
                label: 'Report an Issue',
                click: async () => {
                    await shell.openExternal('https://github.com/ChitkulLakshya/Zync/issues');
                },
            },
            { type: 'separator' },
            {
                label: 'Check for Updates...',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'check-updates' });
                    }
                },
            },
            { type: 'separator' },
            ...(!isMac
                ? [
                    {
                        label: `About ${APP_NAME}`,
                        click: () => {
                            dialog.showMessageBox({
                                type: 'info',
                                title: `About ${APP_NAME}`,
                                message: `${APP_NAME} Desktop Application`,
                                detail: [
                                    `Version: ${app.getVersion()}`,
                                    `Electron: ${process.versions.electron}`,
                                    `Chrome: ${process.versions.chrome}`,
                                    `Node.js: ${process.versions.node}`,
                                    `V8: ${process.versions.v8}`,
                                    `OS: ${process.platform} ${process.arch}`,
                                    '',
                                    '© 2024-2026 ZYNC Team',
                                    'Licensed under the MIT License',
                                ].join('\n'),
                            });
                        },
                    },
                ]
                : []),
        ],
    };
    const template = [
        ...(isMac ? [macAppMenu] : []),
        fileMenu,
        editMenu,
        viewMenu,
        windowMenu,
        helpMenu,
    ];
    const menu = Menu.buildFromTemplate(template);
    return menu;
}
export function setupApplicationMenu(mainWindow) {
    const menu = buildApplicationMenu(mainWindow);
    Menu.setApplicationMenu(menu);
}
//# sourceMappingURL=menu.js.map