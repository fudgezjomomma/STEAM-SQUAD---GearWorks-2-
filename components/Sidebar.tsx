
import React, { useMemo, useState } from 'react';
import { GearType } from '../types';
import { GEAR_DEFS, BEAM_SIZES, BRICK_SIZES, HOLE_SPACING, BRICK_WIDTH } from '../constants';
import { generateGearPath } from '../utils/gearMath';
import { CHALLENGES } from '../data/challenges';
import { TRANSLATIONS, Language } from '../utils/translations';

interface SidebarProps {
  onDragStart: (e: React.DragEvent, type: string, category: 'gear' | 'brick') => void;
  onAddGear: (type: GearType) => void;
  onAddBrick: (length: number, type: 'beam' | 'brick') => void;
  activeChallengeId: number | null;
  onSelectChallenge: (id: number | null) => void;
  completedChallenges: number[];
  lang: Language;
  theme: 'dark' | 'light' | 'steam';
}

const PreviewGear: React.FC<{ def: any, theme: 'dark' | 'light' | 'steam' }> = ({ def, theme }) => {
    const pathData = useMemo(() => generateGearPath(def.teeth, def.radius), [def.teeth, def.radius]);
    const color = def.colors[theme];

    return (
        <svg width={def.radius * 2.2} height={def.radius * 2.2} viewBox={`-${def.radius*1.2} -${def.radius*1.2} ${def.radius * 2.4} ${def.radius * 2.4}`} className="overflow-visible pointer-events-none block drop-shadow-lg">
            <path 
                d={pathData} 
                fill={color} 
                fillOpacity="0.8"
                fillRule="evenodd"
                stroke={color}
                strokeOpacity="0.5"
                strokeWidth="1"
                style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' }}
            />
        </svg>
    );
};

const PreviewBrick: React.FC<{ length: number, type: 'beam' | 'brick' }> = ({ length, type }) => {
    const isBeam = type === 'beam';
    const color = isBeam ? '#64748B' : '#475569';
    
    // Correct logic mirroring BrickComponent
    const holeCount = isBeam ? length : Math.max(1, length - 1);
    const studCount = isBeam ? 0 : length;

    // Calculate visual bounds
    let rectX, rectWidth;
    if (isBeam) {
        const radius = BRICK_WIDTH / 2; 
        rectX = -radius;
        rectWidth = ((length - 1) * HOLE_SPACING) + BRICK_WIDTH;
    } else {
        rectX = -HOLE_SPACING;
        rectWidth = length * HOLE_SPACING;
    }

    const padding = 10;
    // ViewBox logic: We need to contain rectX -> rectX + rectWidth
    // The drawing assumes origin at (0,0) for first hole.
    // We need to shift the origin so the brick is centered in SVG.
    const totalWidth = rectWidth;
    const totalHeight = BRICK_WIDTH + (isBeam ? 0 : 4);
    
    const shiftX = -rectX + padding; // shift so rectX is at padding
    const shiftY = BRICK_WIDTH/2 + (isBeam ? 0 : 4);

    return (
        <svg 
            viewBox={`0 0 ${totalWidth + padding*2} ${totalHeight + padding*2}`} 
            className="w-full max-h-16 drop-shadow-sm overflow-visible pointer-events-none"
        >
            <g transform={`translate(${shiftX}, ${shiftY})`}>
                {/* Studs */}
                {!isBeam && Array.from({ length: studCount }).map((_, i) => (
                    <rect 
                        key={`stud-${i}`}
                        x={(i * HOLE_SPACING) - (HOLE_SPACING / 2) - 10}
                        y={-BRICK_WIDTH/2 - 4}
                        width={20}
                        height={4}
                        fill={color}
                        className="brightness-110"
                    />
                ))}
                
                {/* Body */}
                <rect 
                    x={rectX} 
                    y={-BRICK_WIDTH/2} 
                    width={rectWidth} 
                    height={BRICK_WIDTH} 
                    rx={isBeam ? BRICK_WIDTH/2 : 2} 
                    fill={color}
                />

                {/* Holes */}
                {Array.from({ length: holeCount }).map((_, i) => (
                    <g key={i} transform={`translate(${i * HOLE_SPACING}, 0)`}>
                        <circle r={12} fill="rgba(0,0,0,0.2)" />
                        <circle r={8} fill="var(--bg-app)" />
                        <path d="M -2 -7 L 2 -7 L 2 -2 L 7 -2 L 7 2 L 2 2 L 2 7 L -2 7 L -2 2 L -7 2 L -7 -2 L -2 -2 Z" fill="rgba(0,0,0,0.1)" />
                    </g>
                ))}
            </g>
        </svg>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ onDragStart, onAddGear, onAddBrick, activeChallengeId, onSelectChallenge, completedChallenges, lang, theme }) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'structure' | 'missions'>('parts');
  const t = TRANSLATIONS[lang];

  return (
    <div 
        className="w-96 border-r flex flex-col shadow-2xl z-20 h-full transition-colors duration-300 flex-shrink-0"
        style={{ 
            backgroundColor: 'var(--bg-panel)', 
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
        }}
    >
      <div className="p-6 border-b pb-6" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight" style={{ color: 'var(--text-accent)' }}>
          <span className="text-3xl">⚙️</span> 
          <span>{t.appTitle}</span>
        </h1>
        
        {/* Tabs */}
        <div className="flex mt-6 p-1.5 rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('parts')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all`}
            style={{ 
                backgroundColor: activeTab === 'parts' ? 'var(--text-accent)' : 'transparent',
                color: activeTab === 'parts' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            {t.partsTray}
          </button>
          <button 
            onClick={() => setActiveTab('structure')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all`}
            style={{ 
                backgroundColor: activeTab === 'structure' ? 'var(--text-accent)' : 'transparent',
                color: activeTab === 'structure' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Structure
          </button>
          <button 
            onClick={() => setActiveTab('missions')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all`}
            style={{ 
                backgroundColor: activeTab === 'missions' ? 'var(--text-accent)' : 'transparent',
                color: activeTab === 'missions' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            {t.missions} {completedChallenges.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px]">{completedChallenges.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'parts' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-10 animate-in fade-in slide-in-from-left-4 duration-300 no-scrollbar">
           <p className="text-sm font-bold uppercase tracking-widest text-center mb-6 border-b pb-4" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>{t.componentTray}</p>
          {Object.values(GEAR_DEFS).map((def) => (
            <div key={def.type} className="flex flex-col items-center">
              <div 
                className="cursor-pointer active:scale-95 hover:scale-105 transition-transform duration-200 relative group p-8 rounded-full border-2 border-dashed hover:border-solid"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                draggable={true}
                onDragStart={(e) => onDragStart(e, def.type, 'gear')}
                onClick={() => onAddGear(def.type)}
              >
                <PreviewGear def={def} theme={theme} />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="text-white text-sm px-5 py-2.5 rounded-xl shadow-lg border-2 font-extrabold cursor-pointer uppercase tracking-wider transform scale-110"
                    style={{ backgroundColor: 'var(--text-accent)', borderColor: 'white' }}
                    onClick={(e) => { e.stopPropagation(); onAddGear(def.type); }}
                    draggable={false}
                  >
                    {t.add}
                  </button>
                </div>
              </div>
              <span className="font-mono font-bold mt-4 text-sm tracking-wider" style={{ color: 'var(--text-secondary)' }}>{def.teeth} {t.teeth}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'structure' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300 no-scrollbar">
            
            {/* Technic Beams */}
            <div>
                <p className="text-sm font-bold uppercase tracking-widest text-center mb-6 border-b pb-4" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>Technic Beams (Odd)</p>
                <div className="space-y-6">
                {BEAM_SIZES.map((size) => (
                    <div key={`beam-${size}`} className="flex flex-col items-center">
                        <div 
                            className="w-full cursor-pointer active:scale-95 hover:scale-105 transition-transform duration-200 relative group p-6 rounded-2xl border-2 border-dashed hover:border-solid flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                            draggable={true}
                            onDragStart={(e) => onDragStart(e, JSON.stringify({ length: size, brickType: 'beam' }), 'brick')}
                            onClick={() => onAddBrick(size, 'beam')}
                        >
                            <PreviewBrick length={size} type="beam" />
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    className="text-white text-sm px-5 py-2.5 rounded-xl shadow-lg border-2 font-extrabold cursor-pointer uppercase tracking-wider transform scale-110"
                                    style={{ backgroundColor: 'var(--text-accent)', borderColor: 'white' }}
                                    onClick={(e) => { e.stopPropagation(); onAddBrick(size, 'beam'); }}
                                    draggable={false}
                                >
                                    {t.add}
                                </button>
                            </div>
                        </div>
                        <span className="font-mono font-bold mt-2 text-sm tracking-wider" style={{ color: 'var(--text-secondary)' }}>{size}L Beam</span>
                    </div>
                ))}
                </div>
            </div>

            {/* Technic Bricks */}
            <div>
                <p className="text-sm font-bold uppercase tracking-widest text-center mb-6 mt-6 border-b pb-4" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>Technic Bricks (Even)</p>
                <div className="space-y-6">
                {BRICK_SIZES.map((size) => (
                    <div key={`brick-${size}`} className="flex flex-col items-center">
                        <div 
                            className="w-full cursor-pointer active:scale-95 hover:scale-105 transition-transform duration-200 relative group p-6 rounded-2xl border-2 border-dashed hover:border-solid flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                            draggable={true}
                            onDragStart={(e) => onDragStart(e, JSON.stringify({ length: size, brickType: 'brick' }), 'brick')}
                            onClick={() => onAddBrick(size, 'brick')}
                        >
                            <PreviewBrick length={size} type="brick" />
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    className="text-white text-sm px-5 py-2.5 rounded-xl shadow-lg border-2 font-extrabold cursor-pointer uppercase tracking-wider transform scale-110"
                                    style={{ backgroundColor: 'var(--text-accent)', borderColor: 'white' }}
                                    onClick={(e) => { e.stopPropagation(); onAddBrick(size, 'brick'); }}
                                    draggable={false}
                                >
                                    {t.add}
                                </button>
                            </div>
                        </div>
                        <span className="font-mono font-bold mt-2 text-sm tracking-wider" style={{ color: 'var(--text-secondary)' }}>{size} Stud Brick</span>
                    </div>
                ))}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'missions' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 no-scrollbar" style={{ backgroundColor: 'var(--bg-panel)' }}>
           <p className="text-sm font-bold uppercase tracking-widest text-center mb-4 mt-2" style={{ color: 'var(--text-muted)' }}>{t.missionLog}</p>
           {CHALLENGES.map(challenge => {
             const isCompleted = completedChallenges.includes(challenge.id);
             const isActive = activeChallengeId === challenge.id;
             const title = lang === 'zh-TW' ? challenge.titleZh : challenge.title;
             const desc = lang === 'zh-TW' ? challenge.descriptionZh : challenge.description;
             
             return (
               <div 
                 key={challenge.id}
                 onClick={() => onSelectChallenge(isActive ? null : challenge.id)}
                 className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden`}
                 style={{ 
                    backgroundColor: isActive ? 'var(--bg-app)' : 'rgba(0,0,0,0.05)',
                    borderColor: isActive ? 'var(--text-accent)' : 'var(--border-color)',
                    boxShadow: isActive ? '0 0 20px var(--grid-color)' : 'none'
                 }}
               >
                 {isCompleted && (
                   <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold border-l border-b border-green-700/50 uppercase tracking-wide shadow-sm">
                     {t.solved}
                   </div>
                 )}
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-base" style={{ color: isActive ? 'var(--text-accent)' : 'var(--text-primary)' }}>
                     <span className="opacity-50 mr-2">#{challenge.id}</span> {title}
                   </h3>
                 </div>
                 <p className="text-sm leading-relaxed opacity-80" style={{ color: 'var(--text-primary)' }}>{desc}</p>
                 
                 {isActive && !isCompleted && (
                   <div className="mt-4 text-sm font-bold flex items-center gap-2 animate-pulse" style={{ color: 'var(--text-accent)' }}>
                     <span>🎯 {t.targeting}</span>
                   </div>
                 )}
                 
                 {isActive && isCompleted && (
                   <div className="mt-4 text-sm font-bold text-green-500 flex items-center gap-2">
                     <span>✓ {t.missionAccomplished}</span>
                   </div>
                 )}
               </div>
             );
           })}
        </div>
      )}
      
      <div className="p-4 border-t text-xs text-center font-medium opacity-60" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        {t.buildClubFooter}
      </div>
    </div>
  );
};
