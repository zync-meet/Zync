export interface TrayConfig {
    iconPath: string;
    pressedIconPath?: string;
    tooltip: string;
    showBadge: boolean;
    badgeCount: number;
    clickToToggle: boolean;
    doubleClickToOpen: boolean;
}
export declare const DEFAULT_TRAY_CONFIG: TrayConfig;
export interface TrayMenuItem {
    id: string;
    label: string;
    isSeparator?: boolean;
    enabled?: boolean;
    visible?: boolean;
    isCheckbox?: boolean;
    checked?: boolean;
    click?: () => void;
    submenu?: TrayMenuItem[];
    icon?: string;
}
export interface TrayState {
    isVisible: boolean;
    isWindowVisible: boolean;
    badgeCount: number;
    tooltip: string;
    doNotDisturb: boolean;
    onlineStatus: 'online' | 'offline' | 'connecting';
}
export declare const DEFAULT_TRAY_STATE: TrayState;
export type TrayEventType = 'click' | 'double-click' | 'right-click' | 'balloon-click' | 'balloon-closed' | 'drop-files' | 'mouse-enter' | 'mouse-leave' | 'mouse-move';
export interface TrayEvent {
    type: TrayEventType;
    position?: {
        x: number;
        y: number;
    };
    modifiers?: {
        altKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        metaKey: boolean;
    };
    filePaths?: string[];
    timestamp: number;
}
export type TrayEventCallback = (event: TrayEvent) => void;
export type TrayAction = 'show-window' | 'hide-window' | 'toggle-window' | 'open-settings' | 'check-updates' | 'toggle-dnd' | 'quit';
export interface TrayActionConfig {
    action: TrayAction;
    label: string;
    accelerator?: string;
    enabled: boolean;
    visible: boolean;
}
