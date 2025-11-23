
import React from 'react';
import { TRANSLATIONS, Language } from '../utils/translations';

interface GlobalControlsProps {
    lang: Language;
    setLang: (lang: Language) => void;
    theme: 'dark' | 'light' | 'steam';
    toggleTheme: () => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    onOpenTutorial: () => void;
    getThemeTitle: () => string;
    getThemeIcon: () => string;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
    lang,
    setLang,
    theme,
    toggleTheme,
    isMuted,
    setIsMuted,
    onOpenTutorial,
    getThemeTitle,
    getThemeIcon
}) => {
    const t = TRANSLATIONS[lang];

    return (
        <div className="absolute z-50 flex gap-2 md:gap-3 bottom-6 right-6">
            <button 
                onClick={onOpenTutorial}
                className="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-colors text-xl shadow-lg hover:scale-105 active:scale-95 font-bold"
                style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}
                title={t.help}
            >?</button>
            <button 
                onClick={toggleTheme}
                className="flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-colors text-xl shadow-lg hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}
                title={getThemeTitle()}
            >{getThemeIcon()}</button>
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-2xl border-2 transition-colors shadow-lg hover:scale-105 active:scale-95`}
                style={{
                    backgroundColor: isMuted ? 'rgba(127, 29, 29, 0.5)' : 'var(--bg-panel)',
                    color: isMuted ? '#fca5a5' : 'var(--text-accent)',
                    borderColor: isMuted ? '#991b1b' : 'var(--border-color)'
                }}
            ><span className="text-lg">{isMuted ? '🔇' : '🔊'}</span><span className="hidden sm:inline">{isMuted ? t.mute : t.sound}</span></button>
            <div className="flex rounded-2xl border-2 p-1 shadow-lg" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }}>
                <button onClick={() => setLang('en')} className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors`} style={{ backgroundColor: lang === 'en' ? 'var(--text-accent)' : 'transparent', color: lang === 'en' ? '#fff' : 'var(--text-secondary)' }}>EN</button>
                <button onClick={() => setLang('zh-TW')} className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors`} style={{ backgroundColor: lang === 'zh-TW' ? 'var(--text-accent)' : 'transparent', color: lang === 'zh-TW' ? '#fff' : 'var(--text-secondary)' }}>中文</button>
            </div>
        </div>
    );
};
