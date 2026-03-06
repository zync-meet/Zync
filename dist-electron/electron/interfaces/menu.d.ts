export type MenuItemRole = 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteAndMatchStyle' | 'delete' | 'selectAll' | 'reload' | 'forceReload' | 'toggleDevTools' | 'resetZoom' | 'zoomIn' | 'zoomOut' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideOthers' | 'unhide' | 'quit' | 'startSpeaking' | 'stopSpeaking' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'windowMenu';
export type MenuItemType = 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
export interface ZyncMenuItem {
    id?: string;
    label?: string;
    sublabel?: string;
    accelerator?: string;
    icon?: string;
    type?: MenuItemType;
    role?: MenuItemRole;
    enabled?: boolean;
    visible?: boolean;
    checked?: boolean;
    click?: () => void;
    submenu?: ZyncMenuItem[];
    toolTip?: string;
}
export type MenuTemplate = ZyncMenuItem[];
export type MenuSection = 'app' | 'file' | 'edit' | 'view' | 'project' | 'tools' | 'window' | 'help';
export interface MenuBarConfig {
    sections: Record<MenuSection, ZyncMenuItem[]>;
    includeDevTools: boolean;
    includeMacAppMenu: boolean;
}
export interface ContextMenuPosition {
    x: number;
    y: number;
}
export interface ContextMenuContext {
    hasSelection: boolean;
    selectedText?: string;
    isEditable: boolean;
    isLink: boolean;
    linkURL?: string;
    isImage: boolean;
    imageURL?: string;
    hasSpellingSuggestions: boolean;
    spellingSuggestions?: string[];
    pageURL: string;
    frameURL: string;
}
export type ContextMenuBuilder = (context: ContextMenuContext) => ZyncMenuItem[];
export interface MenuState {
    alwaysOnTop: boolean;
    focusMode: boolean;
    sidebarVisible: boolean;
    zoomLevel: number;
    isFullscreen: boolean;
}
export declare const DEFAULT_MENU_STATE: MenuState;
export interface MenuClickEvent {
    itemId: string;
    checked?: boolean;
    timestamp: number;
}
export type MenuEventCallback = (event: MenuClickEvent) => void;
