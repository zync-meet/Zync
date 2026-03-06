import { BrowserWindow } from 'electron';
export declare const DEEP_LINK_PROTOCOL = "zync";
export interface DeepLinkData {
    raw: string;
    path: string;
    segments: string[];
    params: Record<string, string>;
    type: DeepLinkType;
    entityId?: string;
}
export declare enum DeepLinkType {
    OPEN = "open",
    PROJECT = "project",
    MEETING = "meeting",
    INVITE = "invite",
    SETTINGS = "settings",
    OAUTH_CALLBACK = "oauth_callback",
    UNKNOWN = "unknown"
}
export type DeepLinkHandler = (data: DeepLinkData) => void;
export declare function initializeDeepLinks(mainWindow?: BrowserWindow | null): void;
export declare function handleSecondInstanceArgs(argv: string[], mainWindow: BrowserWindow | null): void;
export declare function processPendingDeepLink(mainWindow: BrowserWindow): void;
export declare function onDeepLink(type: DeepLinkType, handler: DeepLinkHandler): void;
export declare function offDeepLink(type: DeepLinkType, handler: DeepLinkHandler): void;
export declare function clearDeepLinkHandlers(type?: DeepLinkType): void;
export declare function parseDeepLink(url: string): DeepLinkData | null;
export declare function isValidDeepLink(url: string): boolean;
export declare function getDeepLinkState(): {
    initialized: boolean;
    hasPending: boolean;
    handlerCount: number;
};
