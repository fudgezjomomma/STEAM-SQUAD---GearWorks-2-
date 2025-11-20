
import React, { useState } from 'react';
import { GearState, GearType } from '../types';
import { GEAR_DEFS } from '../constants';
import { TRANSLATIONS, Language } from '../utils/translations';

interface GearPropertiesProps {
  gear: GearState;
  allGears: GearState[];
  onUpdate: (id: string, updates: Partial<GearState>) => void;
  onAddSibling: (sourceGearId: string, type: GearType) => void;
  onConnectBelt: (sourceGearId: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  lang: Language;
}

export const GearProperties: React.FC<GearPropertiesProps> = ({ gear, allGears, onUpdate, onAddSibling, onConnectBelt, onDelete, onClose, lang }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const t = TRANSLATIONS[lang];

  // Find siblings (same axle)
  const siblings = allGears.filter(g => g.axleId === gear.axleId && g.id !== gear.id);

  return (
    <div 
        className="absolute top-24 right-6 w-96 rounded-3xl shadow-2xl border-2 p-6 animate-in fade-in slide-in-from-right-8 z-50 backdrop-blur-md"
        style={{ 
            backgroundColor: 'var(--bg-panel-translucent)', 
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
        }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="font-bold uppercase tracking-widest text-base" style={{ color: 'var(--text-accent)' }}>{t.propTitle}</h3>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity bg-black/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold leading-none">&times;</button>
      </div>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
        {/* Telemetry Section */}
        <div className="p-5 rounded-2xl border-2 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
          <div className="absolute top-3 right-3">
             <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${gear.isStalled ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">{t.telemetry}</div>
          <div className="grid grid-cols-2 gap-6">
            <div>
                <div className="text-xs mb-1 opacity-70 font-bold">{t.speed}</div>
                <div className="font-mono font-bold text-xl tracking-tight" style={{ color: 'var(--text-accent)' }}>{Math.abs(gear.speed).toFixed(2)}x</div>
            </div>
            <div>
                <div className="text-xs mb-1 opacity-70 font-bold">{t.direction}</div>
                <div className="font-mono font-bold text-xl tracking-tight" style={{ color: 'var(--text-accent)' }}>{gear.speed === 0 ? '-' : (gear.direction === 1 ? 'CW' : 'CCW')}</div>
            </div>
            <div className="col-span-2 bg-purple-900/20 p-3 rounded-xl border border-purple-500/30">
                <div className="text-xs text-purple-400 mb-1 font-bold uppercase">{t.outputTorque}</div>
                <div className="font-mono font-bold text-2xl text-purple-400">{gear.torque.toFixed(1)} <span className="text-sm">{t.nm}</span></div>
            </div>
          </div>
          
          {/* Load / Resistance Slider */}
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
                />
            </div>
          </div>

          {/* Alerts */}
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

        {/* Compound Gear Section */}
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
               <div className="space-y-3 animate-in fade-in zoom-in duration-200 bg-black/10 p-3 rounded-xl">
                  <div className="text-xs opacity-70 text-center font-bold">{t.selectSize}</div>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(GEAR_DEFS).map(def => (
                        <button
                            key={def.type}
                            onClick={() => { onAddSibling(gear.id, def.type); setShowAddMenu(false); }}
                            className="p-2 text-xs font-mono font-bold border-2 rounded-lg transition-all hover:bg-white/10 active:bg-white/20"
                            style={{ color: 'var(--text-accent)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-panel)' }}
                        >
                            {def.teeth}T
                        </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowAddMenu(false)}
                    className="w-full py-2 text-xs font-bold opacity-60 hover:opacity-100 bg-black/20 rounded-lg"
                  >
                    {t.cancel}
                  </button>
               </div>
           )}
        </div>
        
        {/* Connections / Belts */}
        <div className="p-2">
             <button 
                 onClick={() => onConnectBelt(gear.id)}
                 className="w-full py-4 text-sm font-bold border-2 rounded-2xl transition-all uppercase tracking-wide hover:brightness-110 active:scale-95 shadow-sm"
                 style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-panel)' }}
             >
                🔗 {t.connectBelt}
             </button>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t-2 space-y-5" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between bg-black/10 p-3 rounded-xl">
            <label className="text-sm font-bold uppercase tracking-wide cursor-pointer" htmlFor='motor-toggle' style={{ color: 'var(--text-accent)' }}>{t.setMotor}</label>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                id='motor-toggle'
                type="checkbox" 
                className="sr-only peer"
                checked={gear.isMotor}
                onChange={(e) => onUpdate(gear.id, { isMotor: e.target.checked })}
                />
                <div className="w-14 h-8 bg-gray-700 border-2 border-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-600 peer-checked:border-cyan-400 shadow-inner"></div>
            </label>
            </div>

            {gear.isMotor && (
            <div className="space-y-5 p-4 rounded-2xl border-2" style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderColor: 'var(--border-color)' }}>
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-cyan-400 uppercase">{t.motorSpeed}</label>
                        <span className="text-sm font-mono font-bold text-cyan-400 bg-cyan-900/30 px-2 rounded">{gear.motorSpeed}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="5" step="0.5"
                        value={gear.motorSpeed}
                        onChange={(e) => onUpdate(gear.id, { motorSpeed: parseFloat(e.target.value) })}
                        className="kid-slider accent-cyan-500"
                    />
                </div>
                
                {/* Input Torque Control */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-purple-400 uppercase">{t.inputTorque}</label>
                        <span className="text-sm font-mono font-bold text-purple-400 bg-purple-900/30 px-2 rounded">{gear.motorTorque || 100}</span>
                    </div>
                    <input 
                        type="range" 
                        min="10" max="500" step="10"
                        value={gear.motorTorque || 100}
                        onChange={(e) => onUpdate(gear.id, { motorTorque: parseInt(e.target.value) })}
                        className="kid-slider accent-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-cyan-400 uppercase mb-2">{t.direction}</label>
                    <div className="flex gap-3">
                    <button 
                        onClick={() => onUpdate(gear.id, { motorDirection: 1 })}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl border-2 transition-all ${gear.motorDirection === 1 ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg' : 'bg-transparent text-cyan-500 border-cyan-800'}`}
                    >
                        {t.cw}
                    </button>
                    <button 
                        onClick={() => onUpdate(gear.id, { motorDirection: -1 })}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl border-2 transition-all ${gear.motorDirection === -1 ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg' : 'bg-transparent text-cyan-500 border-cyan-800'}`}
                    >
                        {t.ccw}
                    </button>
                    </div>
                </div>
            </div>
            )}

            <button 
            onClick={() => onDelete(gear.id)}
            className="w-full py-4 text-sm font-bold text-red-300 bg-red-900/20 hover:bg-red-900/40 rounded-2xl border-2 border-red-800 hover:border-red-500 transition-all flex items-center justify-center gap-2 uppercase tracking-wide mt-4 active:scale-95"
            >
            <span className="text-lg">🗑️</span> {t.dismantle}
            </button>
        </div>
      </div>
    </div>
  );
};
