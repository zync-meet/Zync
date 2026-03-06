export interface ShortcutDefinition {
    id: string;
    label: string;
    accelerator: string;
    macAccelerator?: string;
    category: ShortcutCategory;
    global: boolean;
    customizable: boolean;
    description: string;
}
export type ShortcutCategory = 'general' | 'navigation' | 'editing' | 'view' | 'window' | 'tools' | 'development';
export declare function getModifierKey(modifier: 'cmd' | 'ctrl' | 'alt' | 'shift'): string;
export declare function formatAccelerator(accelerator: string): string;
export declare const SHORTCUTS: Record<string, ShortcutDefinition>;
export declare function getShortcutsByCategory(category: ShortcutCategory): ShortcutDefinition[];
export declare function getGlobalShortcuts(): ShortcutDefinition[];
export declare function getCustomizableShortcuts(): ShortcutDefinition[];
export declare function getAccelerator(id: string): string | undefined;
