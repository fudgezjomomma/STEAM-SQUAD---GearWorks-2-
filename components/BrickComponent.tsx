

import React from 'react';
import { BrickState } from '../types';
import { HOLE_SPACING, BRICK_WIDTH, BRICK_CORNER_RADIUS, BRICK_THEME_COLORS } from '../constants';

interface BrickProps {
  brick: BrickState;
  isSelected: boolean;
  theme: 'dark' | 'light' | 'steam';
  onMouseDown: (e: React.MouseEvent, brickId: string) => void;
  onTouchStart: (e: React.TouchEvent, brickId: string) => void;
  onDoubleClick: (e: React.MouseEvent, brickId: string) => void;
  onDelete?: (id: string) => void;
}

export const BrickComponent: React.FC<BrickProps> = ({
  brick,
  isSelected,
  theme,
  onMouseDown,
  onTouchStart,
  onDoubleClick,
  onDelete
}) => {
  
  const isBeam = brick.brickType === 'beam';
  const holeCount = isBeam ? brick.length : Math.max(1, brick.length - 1);
  const studCount = isBeam ? 0 : brick.length;
  
  let rectX, rectWidth;
  
  if (isBeam) {
      const radius = BRICK_WIDTH / 2; 
      rectX = -radius;
      rectWidth = ((brick.length - 1) * HOLE_SPACING) + BRICK_WIDTH;
  } else {
      rectX = -HOLE_SPACING; 
      rectWidth = brick.length * HOLE_SPACING; 
  }

  const rectY = -BRICK_WIDTH / 2;
  
  // Obstacle visual logic
  const displayColor = brick.isObstacle 
      ? (theme === 'dark' ? '#7f1d1d' : '#ef4444') // Dark Red vs Red-500
      : BRICK_THEME_COLORS[theme][brick.brickType];

  const transform = `translate(${brick.x} ${brick.y}) rotate(${brick.rotation})`;
  const studWidth = 20;
  const studHeight = 4;

  return (
    <g 
      transform={transform}
      className="group"
      onMouseDown={(e) => onMouseDown(e, brick.id)}
      onTouchStart={(e) => onTouchStart(e, brick.id)}
      onDoubleClick={(e) => onDoubleClick(e, brick.id)}
      style={{ cursor: brick.fixed ? 'default' : (isSelected ? 'grabbing' : 'grab') }}
    >
      {!isBeam && Array.from({ length: studCount }).map((_, i) => (
          <rect 
             key={`stud-${i}`}
             x={(i * HOLE_SPACING) - (HOLE_SPACING / 2) - (studWidth / 2)}
             y={rectY - studHeight}
             width={studWidth}
             height={studHeight}
             fill={displayColor}
             stroke="none"
             className="brightness-110"
          />
      ))}

      <rect 
        x={rectX} 
        y={rectY} 
        width={rectWidth} 
        height={BRICK_WIDTH} 
        rx={isBeam ? BRICK_CORNER_RADIUS : 2} 
        fill={displayColor}
        stroke={isSelected ? '#fff' : (brick.fixed ? '#334155' : 'rgba(0,0,0,0.5)')}
        strokeWidth={isSelected ? 2 : 1}
        className="drop-shadow-md transition-colors duration-200"
        style={{ pointerEvents: 'all' }}
      />

      {/* Obstacle Visuals (Stripes) */}
      {brick.isObstacle && (
          <rect 
            x={rectX} 
            y={rectY} 
            width={rectWidth} 
            height={BRICK_WIDTH} 
            fill="url(#hazard-pattern)" 
            rx={isBeam ? BRICK_CORNER_RADIUS : 2} 
            opacity="0.2" 
            pointerEvents="none"
          />
      )}
      
      {/* Fixed Indicator Overlay */}
      {brick.fixed && !brick.isObstacle && (
         <rect x={rectX} y={rectY} width={rectWidth} height={BRICK_WIDTH} fill="url(#striped-pattern)" rx={isBeam ? BRICK_CORNER_RADIUS : 2} opacity="0.05" pointerEvents="none"/>
      )}
      
      {Array.from({ length: holeCount }).map((_, i) => (
        <g key={i} transform={`translate(${i * HOLE_SPACING}, 0)`} style={{ pointerEvents: 'none' }}>
            <circle r={12} fill="rgba(0,0,0,0.2)" />
            <circle r={8} fill="var(--bg-app)" />
            <path d="M -2 -7 L 2 -7 L 2 -2 L 7 -2 L 7 2 L 2 2 L 2 7 L -2 7 L -2 2 L -7 2 L -7 -2 L -2 -2 Z" fill="rgba(0,0,0,0.1)" />
            {brick.fixed && (i === 0 || i === holeCount - 1) && (
                 <circle r="4" fill="#334155" />
            )}
        </g>
      ))}

      {isSelected && onDelete && !brick.fixed && (
        <g 
            transform={`translate(${rectX + rectWidth/2}, -45)`} 
            onClick={(e) => { e.stopPropagation(); onDelete(brick.id); }}
            className="cursor-pointer"
            style={{ pointerEvents: 'all' }}
        >
            <circle r={20} fill="transparent" />
            <circle 
                r={14} 
                fill="#ef4444" 
                stroke="white" 
                strokeWidth="2" 
                className="transition-all duration-200 hover:fill-red-600"
            />
            <path 
                d="M -5 -5 L 5 5 M 5 -5 L -5 5" 
                stroke="white" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                className="pointer-events-none"
            />
        </g>
      )}
    </g>
  );
};