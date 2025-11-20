
import React, { useMemo } from 'react';
import { GearState } from '../types';
import { GEAR_DEFS } from '../constants';
import { generateGearPath } from '../utils/gearMath';
import { TRANSLATIONS, Language } from '../utils/translations';

interface GearProps {
  gear: GearState;
  isSelected: boolean;
  isObjectiveTarget?: boolean;
  roleHighlight?: 'drive' | 'driven' | 'idler' | null;
  axleMates?: GearState[]; 
  showSpecs: boolean; 
  showRatio: boolean; 
  showRpm: boolean;   
  showTorque: boolean; 
  lang: Language;     
  theme: 'dark' | 'light' | 'steam'; 
  onMouseDown: (e: React.MouseEvent, gearId: string) => void;
  onTouchStart: (e: React.TouchEvent, gearId: string) => void; 
  onClick: (e: React.MouseEvent, gearId: string) => void;
}

export const GearComponent: React.FC<GearProps> = ({ 
  gear, 
  isSelected, 
  isObjectiveTarget, 
  roleHighlight,
  axleMates = [],
  showSpecs,
  showRatio,
  showRpm,
  showTorque,
  lang,
  theme,
  onMouseDown, 
  onTouchStart,
  onClick 
}) => {
  const t = TRANSLATIONS[lang];
  const def = GEAR_DEFS[gear.type];
  
  const pathData = useMemo(() => generateGearPath(def.teeth, def.radius), [def.teeth, def.radius]);

  const isTopGear = useMemo(() => {
    if (axleMates.length === 0) return true;
    const allOnAxle = [gear, ...axleMates];
    allOnAxle.sort((a, b) => {
        const rA = GEAR_DEFS[a.type].radius;
        const rB = GEAR_DEFS[b.type].radius;
        if (rA !== rB) return rA - rB;
        return a.id.localeCompare(b.id);
    });
    return allOnAxle[0].id === gear.id;
  }, [gear, axleMates]);

  const labelText = useMemo(() => {
      if (!isTopGear) return "";
      const allOnAxle = [gear, ...axleMates];
      const teethCounts = allOnAxle.map(g => GEAR_DEFS[g.type].teeth).sort((a,b) => a - b);
      return teethCounts.map(t => `${t}T`).join(' + ');
  }, [gear, axleMates, isTopGear]);


  const positionStyle = {
    transform: `translate(${gear.x}px, ${gear.y}px)`,
    cursor: gear.fixed ? 'default' : (isSelected ? 'grab' : 'pointer'),
  };

  const rotationStyle = {
    transform: `rotate(${gear.rotation}deg)`,
    transition: 'transform 0s linear'
  };

  const isDark = theme === 'dark' || theme === 'steam';
  const gearColor = def.colors[theme];
  
  let glowColor = isDark ? '#38BDF8' : '#0EA5E9';
  if (theme === 'steam') glowColor = '#fecc00';

  let outlineColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)';

  if (gear.isStalled) {
      glowColor = '#F87171'; 
  } else if (gear.isJammed) {
    glowColor = '#ef4444';
  } else if (isObjectiveTarget) {
    glowColor = '#4ade80';
  } else if (roleHighlight) {
    switch (roleHighlight) {
      case 'drive': glowColor = '#22c55e'; break;
      case 'driven': glowColor = '#ef4444'; break;
      case 'idler': glowColor = '#eab308'; break;
    }
  }

  if (isSelected) {
    outlineColor = isDark ? '#ffffff' : '#000000';
  }

  const labelBoxStroke = gear.isJammed ? "#ef4444" : (theme === 'steam' ? '#fecc00' : (isDark ? "#38BDF8" : "#0369A1"));
  const arrowStroke = theme === 'steam' ? '#fecc00' : (isDark ? "#7DD3FC" : "#0369A1");

  return (
    <g 
      id={gear.id} 
      style={positionStyle} 
      className="select-none group"
      onMouseDown={(e) => onMouseDown(e, gear.id)}
      onTouchStart={(e) => onTouchStart(e, gear.id)}
      onClick={(e) => onClick(e, gear.id)}
    >
      <circle r={def.radius * 1.2} fill="transparent" className="cursor-pointer" style={{ pointerEvents: 'all' }} />

      <g style={rotationStyle} className="pointer-events-none">
        <path 
            d={pathData} 
            fill={gearColor} 
            fillOpacity={isDark ? "0.65" : "0.85"}
            fillRule="evenodd" 
            stroke="none" 
            className="drop-shadow-sm"
        />
        {isSelected && (
           <path d={pathData} fill="none" stroke={isDark ? "white" : "black"} strokeWidth="4" strokeOpacity="0.8" className="animate-pulse" style={{ filter: 'blur(1px)' }} />
        )}
        {(roleHighlight || isObjectiveTarget) && !isSelected && !gear.isStalled && (
          <path d={pathData} fill="none" stroke={glowColor} strokeWidth="6" strokeOpacity="0.5" className="transition-all duration-300" style={{ filter: 'blur(3px)' }} />
        )}
        {gear.isStalled && (
           <circle r={def.radius + 6} fill="none" stroke="#F87171" strokeWidth="6" strokeOpacity="0.4" className="animate-pulse" />
        )}
        <path 
            d={pathData} 
            fill="none" 
            stroke={outlineColor} 
            strokeWidth="1.5" 
            className="transition-colors duration-200"
            vectorEffect="non-scaling-stroke" 
        />
        {gear.isMotor && (
          <g transform="rotate(0) scale(1.5)">
               <path d="M -2 -7 L 2 -7 L 2 -2 L 7 -2 L 7 2 L 2 2 L 2 7 L -2 7 L -2 2 L -7 2 L -7 -2 L -2 -2 Z" fill="#ef4444" stroke="#ef4444" strokeWidth="1" fillOpacity="0.8" />
          </g>
        )}
      </g>

      {/* Fixed Indicator (Lock / Bolt) */}
      {gear.fixed && (
          <g className="pointer-events-none">
             <circle r="6" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
             <path d="M -2 -2 L 2 2 M 2 -2 L -2 2" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
      )}

      {/* Labels */}
      <g className="pointer-events-none">
          {showSpecs && !gear.isMotor && isTopGear && (
              <g transform="translate(0, -4)">
                  <rect x={-(labelText.length * 6 + 12)} y="-14" width={labelText.length * 12 + 24} height="28" rx="6" fill="#020617" fillOpacity="0.85" stroke={labelBoxStroke} strokeWidth="2" />
                  <text y="6" textAnchor="middle" fill="#F9FAFB" fontSize="18" className="font-mono font-bold">{labelText}</text>
              </g>
          )}
          {showSpecs && gear.isMotor && isTopGear && (
               <g transform="translate(0, -20)">
                  <rect x="-30" y="-12" width="60" height="24" rx="6" fill="#020617" fillOpacity="0.85" stroke="#ef4444" strokeWidth="2" />
                  <text y="5" textAnchor="middle" fill="#ef4444" fontSize="14" className="font-mono font-bold tracking-wider">DRIVE</text>
              </g>
          )}
          {(gear.rpm !== 0 || gear.isStalled) && !gear.isJammed && isTopGear && (
              <>
                  {showRatio && !gear.isStalled && (
                    <g transform={`translate(0, -${def.radius + 20})`}>
                        <path d="M -8 0 Q 0 -6 8 0" fill="none" stroke={arrowStroke} strokeWidth="3" markerEnd="url(#arrowhead)" transform={gear.direction === 1 ? "scale(1,1)" : "scale(-1,1)"} />
                    </g>
                  )}
                  {showRatio && (
                    <g transform={`translate(0, ${def.radius + 24})`}>
                        <rect x="-30" y="-14" width="60" height="28" rx="8" fill="#020617" fillOpacity="0.85" stroke={roleHighlight ? glowColor : labelBoxStroke} strokeWidth="2" />
                        <text y="7" textAnchor="middle" fill="#F9FAFB" fontSize="18" className="font-mono">{Math.abs(gear.ratio).toFixed(1)}x</text>
                    </g>
                  )}
                  {showRpm && (
                      <g transform={`translate(0, ${def.radius + (showRatio ? 56 : 24)})`}>
                          <rect x="-40" y="-12" width="80" height="24" rx="6" fill="#020617" fillOpacity="0.85" stroke={labelBoxStroke} strokeWidth="2" />
                          <text y="5" textAnchor="middle" fill="#F9FAFB" fontSize="14" className="font-mono font-bold">{gear.isStalled ? 0 : Math.round(Math.abs(gear.rpm))} RPM</text>
                      </g>
                  )}
                  {showTorque && (
                      <g transform={`translate(0, ${def.radius + (showRatio ? 56 : 24) + (showRpm ? 32 : 0)})`}>
                          <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#020617" fillOpacity="0.85" stroke="#A855F7" strokeWidth="2" />
                          <text y="5" textAnchor="middle" fill="#F3E8FF" fontSize="14" className="font-mono font-bold">{gear.torque.toFixed(1)} Nm</text>
                      </g>
                  )}
              </>
          )}
          {gear.isJammed && isTopGear && (
              <g transform={`translate(0, -${def.radius + 45})`}>
                  <circle r="18" fill="#7f1d1d" stroke="#ef4444" strokeWidth="3" className="animate-pulse" />
                  <text y="7" textAnchor="middle" fontSize="20">⚠️</text>
              </g>
          )}
          {gear.isStalled && isTopGear && (
              <g transform={`translate(0, -${def.radius + 45})`}>
                  <rect x="-40" y="-15" width="80" height="30" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="3" className="animate-pulse" />
                  <text y="5" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">STALLED</text>
              </g>
          )}
      </g>
    </g>
  );
};
