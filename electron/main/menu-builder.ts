import {
    app,
    Menu,
    MenuItem,
    BrowserWindow,
    shell,
    MenuItemConstructorOptions,
} from 'electron';


const APP_NAME = 'ZYNC';


const IS_MAC = process.platform === 'darwin';


const IS_LINUX = process.platform === 'linux';


export function buildMenuTemplate(
    mainWindow: BrowserWindow | null,
): MenuItemConstructorOptions[] {
    const template: MenuItemConstructorOptions[] = [];


    if (IS_MAC) {
        template.push({
            label: APP_NAME,
            submenu: [
                { role: 'about', label: `About ${APP_NAME}` },
                { type: 'separator' },
                {
                    label: 'Preferences…',
                    accelerator: 'Cmd+,',
                    click: () => {
                        mainWindow?.webContents.send('main:message', {
                            type: 'open-settings',
                        });
                    },
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide', label: `Hide ${APP_NAME}` },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit', label: `Quit ${APP_NAME}` },
            ],
        });
    }


    template.push({
        label: 'File',
        submenu: [
            {
                label: 'New Project',
                accelerator: IS_MAC ? 'Cmd+N' : 'Ctrl+N',
                click: () => {
                    mainWindow?.webContents.send('main:message', {
                        type: 'new-project',
                    });
                },
            },
            {
                label: 'Open Project…',
                accelerator: IS_MAC ? 'Cmd+O' : 'Ctrl+O',
                click: () => {
                    mainWindow?.webContents.send('main:message', {
                        type: 'open-project',
                    });
                },
            },
            { type: 'separator' },
            {
                label: 'Save',
                accelerator: IS_MAC ? 'Cmd+S' : 'Ctrl+S',
                click: () => {
                    mainWindow?.webContents.send('main:message', {
                        type: 'save',
                    });
                },
            },
            {
                label: 'Save As…',
                accelerator: IS_MAC ? 'Shift+Cmd+S' : 'Ctrl+Shift+S',
                click: () => {
                    mainWindow?.webContents.send('main:message', {
                        type: 'save-as',
                    });
                },
            },
            { type: 'separator' },
            ...(IS_MAC
                ? []
                : [
                      {
                          label: 'Settings',
                          accelerator: 'Ctrl+,',
                          click: () => {
                              mainWindow?.webContents.send('main:message', {
                                  type: 'open-settings',
                              });
                          },
                      } satisfies MenuItemConstructorOptions,
                      { type: 'separator' as const } satisfies MenuItemConstructorOptions,
                  ]),
            IS_MAC ? { role: 'close' as const } : { role: 'quit' as const },
        ],
    });


    template.push({
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(IS_MAC
                ? [
                      { role: 'pasteAndMatchStyle' as const },
                      { role: 'delete' as const },
                      { role: 'selectAll' as const },
                      { type: 'separator' as const },
                      {
                          label: 'Speech',
                          submenu: [
                              { role: 'startSpeaking' as const },
                              { role: 'stopSpeaking' as const },
                          ],
                      } satisfies MenuItemConstructorOptions,
                  ]
                : [
                      { role: 'delete' as const },
                      { type: 'separator' as const },
                      { role: 'selectAll' as const },
                  ]),
        ],
    });


    template.push({
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
            { type: 'separator' },
            {
                label: 'Toggle Sidebar',
                accelerator: IS_MAC ? 'Cmd+B' : 'Ctrl+B',
                click: () => {
                    mainWindow?.webContents.send('main:message', {
                        type: 'toggle-sidebar',
                    });
                },
            },
        ],
    });


    template.push({
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(IS_MAC
                ? [
                      { type: 'separator' as const },
                      { role: 'front' as const },
                      { type: 'separator' as const },
                      { role: 'window' as const },
                  ]
                : [{ role: 'close' as const }]),
        ],
    });


    template.push({
        label: 'Help',
        submenu: [
            {
                label: 'Documentation',
                click: async () => {
                    await shell.openExternal('https://docs.zync.dev');
                },
            },
            {
                label: 'Report an Issue',
                click: async () => {
                    await shell.openExternal(
                        'https://github.com/zync-app/zync/issues',
                    );
                },
            },
            { type: 'separator' },
            {
                label: 'View License',
                click: async () => {
                    await shell.openExternal(
                        'https://github.com/zync-app/zync/blob/main/LICENSE',
                    );
                },
            },
            { type: 'separator' },
            ...(IS_MAC
                ? []
                : [
                      {
                          label: `About ${APP_NAME}`,
                          click: () => {
                              mainWindow?.webContents.send('main:message', {
                                  type: 'show-about',
                              });
                          },
                      } satisfies MenuItemConstructorOptions,
                  ]),
        ],
    });

    return template;
}


export function applyApplicationMenu(mainWindow: BrowserWindow | null): void {
    const template = buildMenuTemplate(mainWindow);
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}


export function createContextMenu(
    window: BrowserWindow,
    options: MenuItemConstructorOptions[] = [],
): Menu {
    const contextTemplate: MenuItemConstructorOptions[] = [
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectAll' },
    ];

    if (options.length > 0) {
        contextTemplate.push({ type: 'separator' }, ...options);
    }

    return Menu.buildFromTemplate(contextTemplate);
}


export function disableMenu(): void {
    Menu.setApplicationMenu(null);
}
