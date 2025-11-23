

import React from 'react';
import { TRANSLATIONS, Language } from '../utils/translations';

interface ToolbarProps {
    lang: Language;
    globalRpm: number;
    onGlobalRpmChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showSpecs: boolean;
    setShowSpecs: (v: boolean) => void;
    showRpm: boolean;
    setShowRpm: (v: boolean) => void;
    showRatio: boolean;
    setShowRatio: (v: boolean) => void;
    showTorque: boolean;
    setShowTorque: (v: boolean) => void;
    showRoles: boolean;
    setShowRoles: (v: boolean) => void;
    showLayers: boolean;
    setShowLayers: (v: boolean) => void;
    onReset: () => void;
    onExample: () => void;
    onFit: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    isMobileToolbarOpen: boolean;
    setIsMobileToolbarOpen: (v: boolean) => void;
    beltSourceId: string | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    lang,
    globalRpm,
    onGlobalRpmChange,
    showSpecs, setShowSpecs,
    showRpm, setShowRpm,
    showRatio, setShowRatio,
    showTorque, setShowTorque,
    showRoles, setShowRoles,
    showLayers, setShowLayers,
    onReset,
    onExample,
    onFit,
    onZoomIn,
    onZoomOut,
    isMobileToolbarOpen,
    setIsMobileToolbarOpen,
    beltSourceId
}) => {
    const t = TRANSLATIONS[lang];

    return (
        <div id="toolbar-controls" className="absolute top-6 left-6 z-30 flex flex-col gap-4 pointer-events-none">
          <button 
            className="pointer-events-auto md:hidden w-12 h-12 bg-[var(--button-bg)] border-2 border-[var(--border-color)] rounded-xl flex items-center justify-center shadow-lg text-2xl text-[var(--text-accent)] hover:brightness-110 active:scale-95 transition-transform"
            onClick={() => setIsMobileToolbarOpen(!isMobileToolbarOpen)}
          >
            {isMobileToolbarOpen ? '✕' : '⚙️'}
          </button>

          <div className={`
            flex flex-col gap-4 transition-all duration-300 origin-top-left
            ${isMobileToolbarOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none h-0 overflow-hidden md:scale-100 md:opacity-100 md:pointer-events-auto md:h-auto md:overflow-visible'}
          `}>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pointer-events-auto">
                <div className="flex gap-3 backdrop-blur-md p-3 rounded-2xl shadow-xl border-2" style={{ backgroundColor: 'var(--bg-panel-translucent)', borderColor: 'var(--border-color)' }}>
                    <button onClick={onReset} className="px-5 py-3 border-2 rounded-xl hover:opacity-80 text-sm font-bold transition-colors shadow-sm uppercase tracking-wide" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>{t.reset}</button>
                    <button id="btn-example" onClick={onExample} className="px-5 py-3 border-2 rounded-xl hover:opacity-80 text-sm font-bold transition-colors shadow-sm uppercase tracking-wide" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>🎲 {t.example}</button>
                </div>

                <div className="flex gap-2 backdrop-blur-md p-3 rounded-2xl shadow-xl border-2" style={{ backgroundColor: 'var(--bg-panel-translucent)', borderColor: 'var(--border-color)' }}>
                    <button onClick={onZoomIn} className="w-12 h-12 flex items-center justify-center rounded-xl border-2 hover:bg-white/10 text-2xl font-bold" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>+</button>
                    <button onClick={onZoomOut} className="w-12 h-12 flex items-center justify-center rounded-xl border-2 hover:bg-white/10 text-2xl font-bold" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>-</button>
                    <button onClick={onFit} className="px-4 h-12 flex items-center justify-center rounded-xl border-2 hover:bg-white/10 text-sm font-bold uppercase" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>{t.fit}</button>
                </div>
            </div>

            <div className="pointer-events-auto backdrop-blur-md p-4 rounded-2xl shadow-xl border-2 max-w-[300px] sm:max-w-none" style={{ backgroundColor: 'var(--bg-panel-translucent)', borderColor: 'var(--border-color)' }}>
                <div className="flex flex-wrap items-center gap-6 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[150px]">
                        <label htmlFor="global-rpm" className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t.rpm}</label>
                        <input id="global-rpm" type="range" min="1" max="300" step="1" value={globalRpm} onChange={onGlobalRpmChange} className="kid-slider accent-cyan-500" />
                        <span className="text-sm font-mono font-bold w-12 text-right" style={{ color: 'var(--text-accent)' }}>{globalRpm}</span>
                    </div>
                </div>
                <div className="w-full h-px my-2 bg-gray-700/50"></div>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                        <input type="checkbox" checked={showSpecs} onChange={(e) => setShowSpecs(e.target.checked)} className="peer sr-only" />
                        <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showSpecs ? 'var(--text-accent)' : 'var(--border-color)', borderColor: showSpecs ? 'var(--text-accent)' : 'var(--text-secondary)' }}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showSpecs ? 'translate-x-3' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showSpecs ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t.spec}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                        <input type="checkbox" checked={showRpm} onChange={(e) => setShowRpm(e.target.checked)} className="peer sr-only" />
                        <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showRpm ? 'var(--text-accent)' : 'var(--border-color)', borderColor: showRpm ? 'var(--text-accent)' : 'var(--text-secondary)' }}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showRpm ? 'translate-x-3' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showRpm ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t.rpm}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                        <input type="checkbox" checked={showRatio} onChange={(e) => setShowRatio(e.target.checked)} className="peer sr-only" />
                        <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showRatio ? 'var(--text-accent)' : 'var(--border-color)', borderColor: showRatio ? 'var(--text-accent)' : 'var(--text-secondary)' }}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showRatio ? 'translate-x-3' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showRatio ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t.ratio}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                        <input type="checkbox" checked={showTorque} onChange={(e) => setShowTorque(e.target.checked)} className="peer sr-only" />
                        <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showTorque ? '#a855f7' : 'var(--border-color)', borderColor: showTorque ? '#a855f7' : 'var(--text-secondary)' }}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showTorque ? 'translate-x-3' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showTorque ? '#d8b4fe' : 'var(--text-muted)' }}>{t.torque}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                        <input type="checkbox" checked={showRoles} onChange={(e) => setShowRoles(e.target.checked)} className="peer sr-only" />
                        <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showRoles ? '#4ade80' : 'var(--border-color)', borderColor: showRoles ? '#4ade80' : 'var(--text-secondary)' }}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showRoles ? 'translate-x-3' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showRoles ? '#4ade80' : 'var(--text-muted)' }}>{t.role}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                        <input type="checkbox" checked={showLayers} onChange={(e) => setShowLayers(e.target.checked)} className="peer sr-only" />
                        <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showLayers ? '#fbbf24' : 'var(--border-color)', borderColor: showLayers ? '#fbbf24' : 'var(--text-secondary)' }}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showLayers ? 'translate-x-3' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showLayers ? '#fbbf24' : 'var(--text-muted)' }}>{t.layer}</span>
                    </label>
                </div>
            </div>
          
            {beltSourceId && (
                <div className="pointer-events-auto w-full max-w-sm bg-purple-600/90 border-2 border-purple-400 text-white text-base font-bold px-6 py-4 rounded-2xl shadow-2xl animate-pulse text-center">
                    {t.beltMode}
                    <div className="text-xs opacity-80 mt-1 font-normal">(Tap target gear or ESC)</div>
                </div>
            )}

          </div>
        </div>
    );
};