export type ThemeSource = 'system' | 'light' | 'dark';
export interface ThemeInfo {
    effectiveTheme: 'light' | 'dark';
    themeSource: ThemeSource;
    highContrast: boolean;
    invertedColors: boolean;
}
export declare function initNativeTheme(): void;
export declare function getCurrentThemeInfo(): ThemeInfo;
export declare function setThemeSource(source: ThemeSource): void;
export declare function isDarkMode(): boolean;
