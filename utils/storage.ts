
import { Language } from './translations';

const KEY_PROGRESS = 'gearworks_progress_v1';
const KEY_SETTINGS = 'gearworks_settings_v1';

export interface AppSettings {
    theme: 'dark' | 'light' | 'steam';
    lang: Language;
    isMuted: boolean;
    showSpecs: boolean;
    showRatio: boolean;
    showRpm: boolean;
    showTorque: boolean;
    showRoles: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    lang: 'en',
    isMuted: false,
    showSpecs: false,
    showRatio: false,
    showRpm: false,
    showTorque: false,
    showRoles: false
};

export const saveProgress = (completedIds: number[]) => {
    try {
        localStorage.setItem(KEY_PROGRESS, JSON.stringify(completedIds));
    } catch (e) {
        console.warn("Failed to save progress", e);
    }
};

export const loadProgress = (): number[] => {
    try {
        const data = localStorage.getItem(KEY_PROGRESS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

export const saveSettings = (settings: Partial<AppSettings>) => {
    try {
        const current = loadSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(KEY_SETTINGS, JSON.stringify(updated));
    } catch (e) {
        console.warn("Failed to save settings", e);
    }
};

export const loadSettings = (): AppSettings => {
    try {
        const data = localStorage.getItem(KEY_SETTINGS);
        if (!data) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
};
