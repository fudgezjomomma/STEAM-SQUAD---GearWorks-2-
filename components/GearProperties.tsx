
import React, { useState, useEffect } from 'react';
import { GearState, GearType, BrickState } from '../types';
import { GEAR_DEFS } from '../constants';
import { TRANSLATIONS, Language } from '../utils/translations';

interface GearPropertiesProps {
  gear?: GearState; 
  brick?: BrickState;
  allGears: GearState[];
  onUpdate: (id: string, updates: Partial<GearState>) => void;
  onAddSibling: (sourceGearId: string, type: GearType) => void;
  onConnectBelt: (sourceGearId: string) => void;
  onDelete: (id: string) => void;
  onDeleteBrick: (id: string) => void;
  onRotateBrick: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  lang: Language;
}

export const GearProperties: React.FC<GearPropertiesProps> = ({ 
    gear, 
    brick,
    allGears, 
    onUpdate, 
    onAddSibling, 
    onConnectBelt, 
    onDelete, 
    onDeleteBrick,
    onRotateBrick,
    isOpen,
    onToggle, 
    lang 
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const siblings = gear ? allGears.filter(g => g.axleId === gear.axleId && g.id !== gear.id) : [];
  const def = gear ? GEAR_DEFS[gear.type] : null;
  
  const isAxle = def?.isAxle;
  const isWorm = def?.isWorm;

  // --- Dynamic Header Logic ---
  let title = t.noSelection;
  let icon = "⚙️";
  
  if (gear && def) {
      if (isAxle) {
          title = `${gear.length || 3}L ${t.typeAxle.toUpperCase()}`; // "6L DRIVE SHAFT"
          icon = "➖";
      } else if (isWorm) {
          title = "WORM GEAR"; 
          icon = "🐛";
      } else {
          const typeName = def.isBevel ? "BEVEL GEAR" : t.typeGear.toUpperCase();
          title = `${def.teeth}T ${typeName}`; // "40T GEAR"
          icon = "⚙️";
      }
  } else if (brick) {
      if (brick.brickType === 'beam') {
          title = `${brick.length}L ${t.typeBeam.toUpperCase()}`; // "15L TECHNIC BEAM"
          icon = "🦴"; 
      } else {
          title = `${brick.length}L ${t.typeBrick.toUpperCase()}`; // "2L TECHNIC BRICK"
          icon = "🧱";
      }
  }

  return (
    <>
        {/* Toggle Button - Fixed Position (Outside Drawer) */}
        <button 
            id="prop-toggle-btn"
            onClick={onToggle}
            className={`
                fixed z-50 flex items-center justify-center 
                bg-[var(--bg-panel)] border border-[var(--border-color)] shadow-2xl 
                hover:bg-[var(--bg-app)] text-[var(--text-accent)] font-bold text-xl focus:outline-none
                transition-all duration-300 ease-in-out
            `}
            style={isMobile ? {
                // Mobile Styles (Bottom Center)
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: isOpen ? '60vh' : '0',
                width: '4rem',
                height: '2.5rem',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem',
                borderBottomWidth: '0',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
            } : {
                // Desktop Styles (Right Side Center)
                right: isOpen ? '24rem' : '0',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2.5rem',
                height: '5rem',
                borderTopLeftRadius: '0.75rem',
                borderBottomLeftRadius: '0.75rem',
                borderRightWidth: '0',
                borderTopRightRadius: '0',
                borderBottomRightRadius: '0',
                left: 'auto'
            }}
        >
            {isOpen ? (
                <span className={`text-lg transform ${isMobile ? 'rotate-90' : 'rotate-0'}`}>›</span>
            ) : (
                <span className={`text-lg transform ${isMobile ? '-rotate-90 scale-75' : 'rotate-0 scale-100'}`}>🛠️</span>
            )}
        </button>

        {/* Sidebar / Drawer Container */}
        <div 
            id="prop-panel"
            className={`
                fixed z-40 shadow-2xl transition-transform duration-300 ease-in-out
                flex flex-col
                bg-[var(--bg-panel)] border-[var(--border-color)]
                ${isMobile 
                    ? `inset-x-0 bottom-0 h-[60vh] border-t-2 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`
                    : `inset-y-0 right-0 h-full w-96 border-l-2 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
                }
            `}
        >
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-[var(--bg-app)]" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold uppercase tracking-widest text-base flex items-center gap-2" style={{ color: 'var(--text-accent)' }}>
                    <span>{icon}</span> {title}
                </h3>
                {(gear?.fixed || brick?.fixed) && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded ml-2">LOCKED</span>}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-24">
                {(!gear && !brick) ? (
                    // EMPTY STATE
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <div className="text-6xl mb-4 grayscale opacity-50">🛠️</div>
                        <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.noSelection}</h4>
                        <p className="text-sm max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{t.noSelectionDesc}</p>
                    </div>
                ) : (
                    <>
                        {/* --- BRICK/BEAM PROPERTIES --- */}
                        {brick && (
                            <div className="space-y-6">
                                <div className="p-5 rounded-2xl border-2 bg-[var(--bg-app)]" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">{t.spec}</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs mb-1 opacity-70 font-bold">{t.length}</div>
                                            <div className="font-mono font-bold text-xl tracking-tight" style={{ color: 'var(--text-accent)' }}>
                                                {brick.length} <span className="text-sm opacity-50">Studs</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs mb-1 opacity-70 font-bold">{t.rotation}</div>
                                            <div className="font-mono font-bold text-xl tracking-tight" style={{ color: 'var(--text-accent)' }}>
                                                {brick.rotation}°
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!brick.fixed && (
                                    <>
                                        <button 
                                            onClick={() => onRotateBrick(brick.id)}
                                            className="w-full py-3 text-sm font-bold border-2 rounded-xl transition-all uppercase tracking-wide hover:brightness-110 active:scale-95"
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                                        >
                                            🔄 {t.rotate90}
                                        </button>
                                        <button 
                                            onClick={() => onDeleteBrick(brick.id)}
                                            className="w-full py-4 text-sm font-bold text-red-300 bg-red-900/20 hover:bg-red-900/40 rounded-2xl border-2 border-red-800 hover:border-red-500 transition-all flex items-center justify-center gap-2 uppercase tracking-wide active:scale-95"
                                        >
                                            <span className="text-lg">🗑️</span> {t.delete}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* --- GEAR/AXLE PROPERTIES --- */}
                        {gear && (
                            <>
                                {/* Layer Selector (Depth) */}
                                {!isAxle && (
                                    <div className="p-5 rounded-2xl border-2" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                                        <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-60">Layer (Depth)</div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3].map((l) => (
                                                <button 
                                                    key={l}
                                                    onClick={() => onUpdate(gear.id, { layer: l })}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${(gear.layer || 1) === l ? 'bg-white text-black border-white' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                                >
                                                    L{l}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] mt-2 opacity-50 text-center">Gears only mesh if they are on the same layer.</p>
                                    </div>
                                )}

                                {/* Telemetry Card */}
                                <div className="p-5 rounded-2xl border-2 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                                    <div className="absolute top-3 right-3">
                                        <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${gear.isStalled ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">{t.telemetry}</div>
                                    
                                    {/* Primary Stats: RPM & Torque */}
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <div className="text-xs mb-1 opacity-70 font-bold uppercase">{t.rpm}</div>
                                            <div className="font-mono font-bold text-3xl tracking-tight" style={{ color: 'var(--text-accent)' }}>
                                                {gear.isStalled || gear.isJammed ? 0 : Math.round(Math.abs(gear.rpm))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs mb-1 opacity-70 font-bold uppercase text-purple-400">{t.outputTorque}</div>
                                            <div className="font-mono font-bold text-3xl text-purple-400">
                                                {gear.torque.toFixed(1)} <span className="text-sm">{t.nm}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secondary Stats: Ratio & Direction */}
                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                                        <div>
                                            <div className="text-xs mb-1 opacity-50 font-bold">{t.speed} ({t.ratio})</div>
                                            <div className="font-mono font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {Math.abs(gear.speed).toFixed(2)}x
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs mb-1 opacity-50 font-bold">{t.direction}</div>
                                            <div className="font-mono font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {gear.speed === 0 ? '-' : (gear.direction === 1 ? 'CW' : 'CCW')}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-purple-400 uppercase">{t.load}</label>
                                            <span className="text-sm font-mono font-bold text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded">{gear.load}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="range" 
                                                min="0" max="5000" step="50"
                                                value={gear.load}
                                                onChange={(e) => onUpdate(gear.id, { load: parseInt(e.target.value) })}
                                                className="kid-slider accent-purple-500"
                                                disabled={gear.fixed && gear.load > 0}
                                            />
                                        </div>
                                    </div>

                                    {gear.isJammed && (
                                        <div className="mt-4 text-sm font-bold text-red-100 bg-red-600 border-2 border-red-400 p-3 rounded-xl flex items-center gap-3 shadow-lg animate-pulse">
                                        <span className="text-xl">⚠️</span> {t.jamDetected}
                                        </div>
                                    )}
                                    {gear.isStalled && (
                                        <div className="mt-4 text-sm font-bold text-red-100 bg-red-600 border-2 border-red-400 p-3 rounded-xl flex flex-col gap-1 shadow-lg animate-pulse">
                                        <div className="flex items-center gap-2"><span className="text-xl">🛑</span> {t.stallDetected}</div>
                                        <span className="text-xs opacity-90 font-medium bg-black/20 p-1 rounded px-2">{t.stallWarning}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Axles and Worms do NOT show Compound/Stacking options */}
                                {!isAxle && !isWorm && (
                                    <div className="p-5 rounded-2xl border-2" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                                        <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">{t.compoundAssembly}</div>
                                        
                                        {siblings.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                <div className="text-xs opacity-70 font-bold">{t.attachedComponents}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {siblings.map(sib => (
                                                        <div key={sib.id} className="text-sm font-mono font-bold border-2 rounded-lg px-3 py-1.5" style={{ color: 'var(--text-accent)', borderColor: 'var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                                            {GEAR_DEFS[sib.type].teeth}T
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!showAddMenu ? (
                                            <button 
                                                onClick={() => setShowAddMenu(true)}
                                                className="w-full py-3 text-sm font-bold text-white rounded-xl border-2 transition-all uppercase tracking-wide shadow-lg hover:brightness-110 active:scale-95"
                                                style={{ backgroundColor: 'var(--text-accent)', borderColor: 'var(--text-accent)' }}
                                            >
                                                {t.addStacked}
                                            </button>
                                        ) : (
                                            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                                <div className="text-xs text-center mb-2 opacity-70 font-bold">{t.selectSize}</div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button onClick={() => { onAddSibling(gear.id, GearType.Small); setShowAddMenu(false); }} className="p-2 rounded border bg-white/5 hover:bg-white/10 font-bold text-xs">8T</button>
                                                    <button onClick={() => { onAddSibling(gear.id, GearType.Medium); setShowAddMenu(false); }} className="p-2 rounded border bg-white/5 hover:bg-white/10 font-bold text-xs">16T</button>
                                                    <button onClick={() => { onAddSibling(gear.id, GearType.Large); setShowAddMenu(false); }} className="p-2 rounded border bg-white/5 hover:bg-white/10 font-bold text-xs">24T</button>
                                                    <button onClick={() => { onAddSibling(gear.id, GearType.ExtraLarge); setShowAddMenu(false); }} className="p-2 rounded border bg-white/5 hover:bg-white/10 font-bold text-xs">40T</button>
                                                </div>
                                                <button 
                                                    onClick={() => setShowAddMenu(false)}
                                                    className="w-full py-2 text-xs font-bold opacity-60 hover:opacity-100"
                                                >
                                                    {t.cancel}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Connect Belt Logic - Hide for Axles/Worms */}
                                {!isAxle && !isWorm && (
                                    <button 
                                        onClick={() => onConnectBelt(gear.id)}
                                        className="w-full py-3 text-sm font-bold border-2 rounded-xl transition-all uppercase tracking-wide hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--text-accent)', backgroundColor: 'var(--bg-app)' }}
                                    >
                                        <span>🔗</span> {t.connectBelt}
                                    </button>
                                )}

                                {/* Motor Control */}
                                {!gear.fixed && !isAxle && !isWorm && (
                                    <div className="p-5 rounded-2xl border-2" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="font-bold uppercase tracking-wide text-sm">{t.setMotor}</span>
                                            <div className={`w-12 h-7 rounded-full border-2 transition-colors relative ${gear.isMotor ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-500'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only"
                                                    checked={gear.isMotor}
                                                    onChange={(e) => onUpdate(gear.id, { isMotor: e.target.checked })}
                                                />
                                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${gear.isMotor ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </label>

                                        {gear.isMotor && (
                                            <div className="mt-4 space-y-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => onUpdate(gear.id, { motorDirection: 1 })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${gear.motorDirection === 1 ? 'bg-white text-black border-white' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                                    >
                                                        {t.cw}
                                                    </button>
                                                    <button 
                                                        onClick={() => onUpdate(gear.id, { motorDirection: -1 })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${gear.motorDirection === -1 ? 'bg-white text-black border-white' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                                    >
                                                        {t.ccw}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!gear.fixed && (
                                    <div className="pt-4">
                                        <button 
                                            onClick={() => onDelete(gear.id)}
                                            className="w-full py-4 text-sm font-bold text-red-300 bg-red-900/20 hover:bg-red-900/40 rounded-2xl border-2 border-red-800 hover:border-red-500 transition-all flex items-center justify-center gap-2 uppercase tracking-wide active:scale-95"
                                        >
                                            <span className="text-lg">🗑️</span> {t.dismantle}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    </>
  );
};
