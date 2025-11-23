
import React, { useMemo } from 'react';
import { GearState, GearType } from '../types';
import { GEAR_DEFS, HOLE_SPACING } from '../constants';
import { generateGearPath, generateBevelSideProfile, generateWormProfile, generateLiftarmProfile } from '../utils/gearMath';
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
  showLayers: boolean;
  lang: Language;     
  theme: 'dark' | 'light' | 'steam'; 
  onMouseDown: (e: React.MouseEvent, gearId: string) => void;
  onTouchStart: (e: React.TouchEvent, gearId: string) => void; 
  onClick: (e: React.MouseEvent, gearId: string) => void;
  onDoubleClick?: (e: React.MouseEvent, gearId: string) => void;
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
  showLayers,
  lang,
  theme,
  onMouseDown, 
  onTouchStart,
  onClick,
  onDoubleClick
}) => {
  const t = TRANSLATIONS[lang];
  const def = GEAR_DEFS[gear.type];
  
  // Determine Orientation State
  const orientation = gear.orientation || 'flat';
  const isFlat = orientation === 'flat';
  const isBevel = def.isBevel;
  const isAxle = def.isAxle;
  const isWorm = def.isWorm;
  const isLiftarm = gear.type === GearType.Liftarm;

  const pathData = useMemo(() => {
      if (isWorm) {
          return generateWormProfile(def.radius);
      }
      if (isBevel && !isFlat) {
          return generateBevelSideProfile(def.radius);
      }
      if (isAxle) return ""; // Handled via rects
      if (isLiftarm) {
          return generateLiftarmProfile(gear.length || 3, gear.liftarmShape || 'straight');
      }
      return generateGearPath(def.teeth, def.radius);
  }, [def.teeth, def.radius, isBevel, isFlat, isAxle, isWorm, isLiftarm, gear.length, gear.liftarmShape]);

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
      const teethCounts = allOnAxle.filter(g => !GEAR_DEFS[g.type].isAxle).map(g => GEAR_DEFS[g.type].teeth).sort((a,b) => a - b);
      if (isAxle && teethCounts.length === 0) return `${gear.length}L Axle`;
      return teethCounts.map(t => `${t}T`).join(' + ');
  }, [gear, axleMates, isTopGear, isAxle]);


  const positionStyle = {
    transform: `translate(${gear.x}px, ${gear.y}px)`,
    cursor: gear.fixed ? 'pointer' : (isSelected ? 'grab' : 'pointer'),
  };

  // Rotation logic
  let rotationStyle = {};
  let visualRotation = 0;
  let animationMultiplier = 1;

  if (isFlat || isAxle || isLiftarm) {
      rotationStyle = {
        transform: `rotate(${gear.rotation}deg)`,
        transition: isAxle ? 'transform 0.2s ease-out' : 'transform 0s linear' // Smooth rotate for axles when changing orientation
      };
  } else {
      switch (orientation) {
          case 'bevel_up': visualRotation = 0; break;
          case 'bevel_right': visualRotation = 90; break;
          case 'bevel_down': visualRotation = 180; animationMultiplier = -1; break;
          case 'bevel_left': visualRotation = 270; animationMultiplier = -1; break;
      }
      rotationStyle = { transform: `rotate(${visualRotation}deg)` };
  }
  
  // Worm gears also rotate like axles (0 or 90)
  if (isWorm) {
      rotationStyle = {
        transform: `rotate(${gear.rotation}deg)`,
        transition: 'transform 0.2s ease-out' 
      };
  }

  const isDark = theme === 'dark' || theme === 'steam';
  
  // Use override color if present, otherwise theme color
  const gearColor = gear.colorOverride ? gear.colorOverride : def.colors[theme];
  
  let glowColor = isDark ? '#38BDF8' : '#0EA5E9';
  if (theme === 'steam') glowColor = '#fecc00';

  let outlineColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)';
  if (theme === 'steam') outlineColor = '#fecc00';

  if (gear.isStalled) glowColor = '#F87171'; 
  else if (gear.isJammed) glowColor = '#ef4444';
  else if (isObjectiveTarget) glowColor = '#4ade80';
  else if (roleHighlight) {
    switch (roleHighlight) {
      case 'drive': glowColor = '#22c55e'; break;
      case 'driven': glowColor = '#ef4444'; break;
      case 'idler': glowColor = '#eab308'; break;
    }
  }

  if (isSelected) outlineColor = isDark ? '#ffffff' : '#000000';

  const labelBoxStroke = gear.isJammed ? "#ef4444" : (theme === 'steam' ? '#fecc00' : (isDark ? "#38BDF8" : "#0369A1"));
  const arrowStroke = theme === 'steam' ? '#fecc00' : (isDark ? "#7DD3FC" : "#0369A1");

  // Animation shifts
  const patternWidth = 20;
  const shift = (gear.rotation / 360) * patternWidth * 4 * gear.direction * -1 * animationMultiplier; 
  
  // Axle Animation: Shift stripes along X axis based on animation STEP (Visual Spin)
  // Use gear.step if available, fallback to rotation if standard gear.
  // Scale factor reduced to 0.5 to prevent stroboscopic effect at high RPMs
  const axleShift = (gear.step || 0) * 0.5; 
  const axleCrossRotation = (gear.step || 0); // Rotate crosses directly with step degrees

  // Worm Animation
  const wormShift = (gear.step || 0) * 0.5;

  // Bounding Box for clicking
  let clickRect = { x: 0, y: 0, width: 0, height: 0 };
  if (isAxle) {
      const len = (gear.length || 3) * HOLE_SPACING;
      clickRect = { x: -len/2, y: -10, width: len, height: 20 };
  } else if (isLiftarm) {
      // Simplified bounding box for liftarms - covers max extent
      // Ideally this matches the shape, but a rect is usually fine for clicking
      clickRect = { x: -20, y: -20, width: (gear.length || 3)*HOLE_SPACING + 40, height: (gear.liftarmShape === 'L' ? 3*HOLE_SPACING : 0) + 40 };
  } else if (isBevel && !isFlat) {
      if (orientation === 'bevel_up' || orientation === 'bevel_down') {
         clickRect = { x: -def.radius, y: -15, width: def.radius*2, height: 30 };
      } else {
         clickRect = { x: -15, y: -def.radius, width: 30, height: def.radius*2 };
      }
  } else if (isWorm) {
      // Worm bounding box (Standard size rect)
      clickRect = { x: -def.radius, y: -15, width: def.radius*2, height: 30 };
  } else {
     clickRect = { x: -def.radius, y: -def.radius, width: def.radius*2, height: def.radius*2 }; 
  }
  
  // Layer Tint Logic (Depth shading)
  const layer = gear.layer || 1;
  // Layer 1: Opacity 100% (Normal)
  // Layer 2: Opacity 80%
  // Layer 3: Opacity 60%
  const layerOpacity = layer === 1 ? 1 : (layer === 2 ? 0.8 : 0.6);
  // Darken tint for back layers
  const layerFilter = layer === 1 ? 'none' : (layer === 2 ? 'brightness(0.8)' : 'brightness(0.6)');

  return (
    <g 
      id={gear.id} 
      style={{ ...positionStyle, filter: layerFilter }} 
      className="select-none group"
      onMouseDown={(e) => onMouseDown(e, gear.id)}
      onTouchStart={(e) => onTouchStart(e, gear.id)}
      onClick={(e) => onClick(e, gear.id)}
      onDoubleClick={(e) => onDoubleClick && onDoubleClick(e, gear.id)}
    >
      {/* Invisible Click Area */}
      <rect 
        x={clickRect.x} y={clickRect.y} width={clickRect.width} height={clickRect.height} 
        fill="transparent" 
        className="cursor-pointer" 
        style={{ pointerEvents: 'all' }} 
      />

      <g style={rotationStyle} className="pointer-events-none">
        
        {/* --- AXLE RENDERING --- */}
        {isAxle && gear.length && (
            <g>
                <defs>
                    <clipPath id={`axle-clip-${gear.id}`}>
                         <rect x={-(gear.length * HOLE_SPACING)/2} y={-6} width={gear.length * HOLE_SPACING} height={12} rx="2" />
                    </clipPath>
                </defs>
                {/* Main Shaft */}
                <rect 
                    x={-(gear.length * HOLE_SPACING)/2} 
                    y={-6} 
                    width={gear.length * HOLE_SPACING} 
                    height={12} 
                    rx="2" 
                    fill={gearColor}
                    stroke={outlineColor}
                    strokeWidth={1}
                />
                {/* Animated Stripes (Spinning effect) */}
                <g clipPath={`url(#axle-clip-${gear.id})`}>
                     <rect 
                        x={-(gear.length * HOLE_SPACING)/2 - 20} 
                        y={-20} 
                        width={(gear.length * HOLE_SPACING) + 40} 
                        height={40} 
                        fill="url(#striped-pattern)" 
                        opacity="0.4"
                        transform={`translate(0, ${axleShift % 20})`}
                     />
                </g>
                {/* Center Cross details at ends - Now Rotating! */}
                <g transform={`translate(${-(gear.length * HOLE_SPACING)/2 + 5}, 0) rotate(${axleCrossRotation})`}>
                    <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="rgba(0,0,0,0.6)" strokeWidth="2"/>
                </g>
                <g transform={`translate(${(gear.length * HOLE_SPACING)/2 - 5}, 0) rotate(${axleCrossRotation})`}>
                    <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="rgba(0,0,0,0.6)" strokeWidth="2"/>
                </g>
            </g>
        )}

        {/* --- GEAR RENDERING --- */}
        {!isAxle && (
            <>
                {/* WORM GEAR RENDERING */}
                {isWorm && (
                    <g>
                        <defs>
                            <clipPath id={`worm-clip-${gear.id}`}>
                                <path d={pathData} />
                            </clipPath>
                        </defs>
                        <path 
                            d={pathData} 
                            fill={gearColor} 
                            stroke={outlineColor}
                            strokeWidth="1.5"
                            className="drop-shadow-sm"
                        />
                        {/* Animated Threads */}
                        <g clipPath={`url(#worm-clip-${gear.id})`}>
                            <rect 
                                x={-40} y={-20} width={80} height={40} 
                                fill={`url(#striped-pattern)`} 
                                opacity="0.6"
                                transform={`translate(${wormShift % 10}, 0)`} 
                            />
                            {/* Screw highlights */}
                            <path d={`M ${-def.radius} -8 L ${def.radius} -8`} stroke="white" strokeWidth="1" opacity="0.3" />
                            <path d={`M ${-def.radius} 8 L ${def.radius} 8`} stroke="white" strokeWidth="1" opacity="0.3" />
                        </g>
                    </g>
                )}

                {/* STANDARD / BEVEL / LIFTARM GEARS */}
                {!isWorm && (
                    <>
                        {isBevel && !isFlat && (
                            <defs>
                                <clipPath id={`clip-${gear.id}`}>
                                    <path d={pathData} />
                                </clipPath>
                            </defs>
                        )}

                        <path 
                            d={pathData} 
                            fill={gearColor} 
                            fillOpacity={theme === 'steam' ? `${0.9 * layerOpacity}` : (isDark ? `${0.65 * layerOpacity}` : `${0.85 * layerOpacity}`)}
                            fillRule="evenodd" 
                            stroke="none" 
                            className="drop-shadow-sm"
                        />
                        
                        {/* Bevel Flat Inner Circle */}
                        {isFlat && def.isBevel && (
                            <circle r={def.radius * 0.6} fill="none" stroke={outlineColor} strokeWidth="1" opacity="0.5" />
                        )}

                        {/* Vertical Bevel Animation */}
                        {isBevel && !isFlat && (
                            <g clipPath={`url(#clip-${gear.id})`}>
                                <rect 
                                    x={-100} y={-20} width={200} height={40} 
                                    fill={`url(#striped-pattern)`} 
                                    opacity="0.5"
                                    transform={`translate(${shift % 40}, 0)`} 
                                />
                                <path d={`M ${-def.radius} -10 L ${def.radius} -10`} stroke="white" strokeWidth="2" opacity="0.2" />
                            </g>
                        )}
                    </>
                )}

                {/* Selection Glow */}
                {isSelected && (
                    <path d={pathData} fill="none" stroke={isDark ? "white" : "black"} strokeWidth="4" strokeOpacity="0.8" className="animate-pulse" style={{ filter: 'blur(1px)' }} />
                )}
                {(roleHighlight || isObjectiveTarget) && !isSelected && !gear.isStalled && !gear.isJammed && (
                    <path d={pathData} fill="none" stroke={glowColor} strokeWidth="6" strokeOpacity="0.5" className="transition-all duration-300" style={{ filter: 'blur(3px)' }} />
                )}
                {gear.isStalled && (
                    <circle r={def.radius + 6} fill="none" stroke="#F87171" strokeWidth="6" strokeOpacity="0.4" className="animate-pulse" />
                )}
                
                {/* Jammed Indicator */}
                {gear.isJammed && (
                    <g className="pointer-events-none">
                        <circle r={def.radius + 6} fill="none" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.8" className="animate-pulse" />
                        <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                    </g>
                )}

                {/* Outline */}
                {!isWorm && (
                    <path 
                        d={pathData} 
                        fill="none" 
                        stroke={outlineColor} 
                        strokeWidth={theme === 'steam' ? "1" : "1.5"} 
                        className="transition-colors duration-200"
                        vectorEffect="non-scaling-stroke" 
                    />
                )}
                
                {/* Motor Icon */}
                {gear.isMotor && isFlat && !isWorm && !isLiftarm && (
                <g transform="rotate(0) scale(1.5)">
                    <path d="M -2 -7 L 2 -7 L 2 -2 L 7 -2 L 7 2 L 2 2 L 2 7 L -2 7 L -2 2 L -7 2 L -7 -2 L -2 -2 Z" fill="#ef4444" stroke="#ef4444" strokeWidth="1" fillOpacity="0.8" />
                </g>
                )}
                
                {/* Layer Badge (Large Visible Toggle) */}
                {showLayers && !isAxle && (
                    <g className="pointer-events-none">
                        <circle r="10" fill="#000" fillOpacity="0.7" stroke="#fbbf24" strokeWidth="2" />
                        <text y="4" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">L{layer}</text>
                    </g>
                )}
                
                {/* Layer Badge (Small - Always visible if > 1 and not toggled) */}
                {!showLayers && layer > 1 && !isAxle && (
                    <text y="4" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="bold" className="pointer-events-none">L{layer}</text>
                )}
            </>
        )}
      </g>

      {/* Fixed Indicator */}
      {gear.fixed && (
          <g className="pointer-events-none">
             <circle r="6" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
             <path d="M -2 -2 L 2 2 M 2 -2 L -2 2" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
      )}

      {/* Labels */}
      <g className="pointer-events-none">
          {/* Axle Labels */}
          {isAxle && showSpecs && (
              <g transform="translate(0, -15)">
                   <rect x="-30" y="-12" width="60" height="24" rx="4" fill="#020617" fillOpacity="0.85" stroke={labelBoxStroke} strokeWidth="1" />
                   <text y="5" textAnchor="middle" fill="#F9FAFB" fontSize="12" className="font-mono font-bold">{gear.length}L</text>
              </g>
          )}
          
          {/* Custom Label (Target, etc) */}
          {gear.customLabel && isTopGear && (
              <g transform={`translate(0, -${def.radius + 35})`}>
                  <rect x={-(gear.customLabel.length * 5 + 10)} y="-12" width={gear.customLabel.length * 10 + 20} height="24" rx="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                  <text y="5" textAnchor="middle" fill="white" fontSize="12" className="font-mono font-bold tracking-wider">{gear.customLabel}</text>
              </g>
          )}
          
          {showSpecs && !gear.isMotor && isTopGear && !isAxle && !isLiftarm && (
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
          {(gear.rpm !== 0 || gear.isStalled || gear.isJammed) && isTopGear && !isAxle && !isLiftarm && (
              <>
                  {showRatio && !gear.isStalled && !gear.isJammed && (
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
                          <text y="5" textAnchor="middle" fill="#F9FAFB" fontSize="14" className="font-mono font-bold">{gear.isStalled || gear.isJammed ? 0 : Math.round(Math.abs(gear.rpm))} RPM</text>
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
      </g>
    </g>
  );
};
