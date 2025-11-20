
import React from 'react';
import { BrickState } from '../types';
import { HOLE_SPACING, BRICK_WIDTH, BRICK_CORNER_RADIUS } from '../constants';

interface BrickProps {
  brick: BrickState;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, brickId: string) => void;
  onTouchStart: (e: React.TouchEvent, brickId: string) => void;
  onDoubleClick: (e: React.MouseEvent, brickId: string) => void;
  onDelete?: (id: string) => void;
}

export const BrickComponent: React.FC<BrickProps> = ({
  brick,
  isSelected,
  onMouseDown,
  onTouchStart,
  onDoubleClick,
  onDelete
}) => {
  
  // Calculate geometry
  // Origin is the center of the FIRST hole.
  const totalLength = (brick.length - 1) * HOLE_SPACING + BRICK_WIDTH;
  const offsetX = -BRICK_WIDTH / 2; // Start drawing relative to first hole center
  const offsetY = -BRICK_WIDTH / 2;

  // SVG transform attribute must NOT have units
  const transform = `translate(${brick.x} ${brick.y}) rotate(${brick.rotation})`;
  
  // Beam vs Brick Styles
  const isBeam = brick.brickType === 'beam';
  const cornerRadius = isBeam ? BRICK_CORNER_RADIUS : 2; // Rounded for beam, sharp for brick
  
  // Determine color based on type for better visual distinction if not overridden
  const displayColor = brick.color;
  
  // Stud Geometry
  const studWidth = 20;
  const studHeight = 4;

  return (
    <g 
      transform={transform}
      className="group"
      onMouseDown={(e) => onMouseDown(e, brick.id)}
      onTouchStart={(e) => onTouchStart(e, brick.id)}
      onDoubleClick={(e) => onDoubleClick(e, brick.id)}
      style={{ cursor: isSelected ? 'grabbing' : 'grab' }}
    >
      {/* STUDS (For Bricks) - Draw them "behind" (top edge) */}
      {/* Studs are positioned relative to the holes. 
          Hole center is at i * HOLE_SPACING. 
          Stud center matches hole center x.
      */}
      {!isBeam && Array.from({ length: brick.length }).map((_, i) => (
          <rect 
             key={`stud-${i}`}
             x={(i * HOLE_SPACING) - (studWidth / 2)}
             y={offsetY - studHeight}
             width={studWidth}
             height={studHeight}
             fill={displayColor}
             stroke="none"
             className="brightness-110"
          />
      ))}

      {/* Main Body - explicit pointer-events to capture clicks */}
      <rect 
        x={offsetX} 
        y={offsetY} 
        width={totalLength} 
        height={BRICK_WIDTH} 
        rx={cornerRadius} 
        fill={displayColor}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.5)'}
        strokeWidth={isSelected ? 2 : 1}
        className="drop-shadow-md transition-colors duration-200"
        style={{ pointerEvents: 'all' }}
      />
      
      {/* Holes - pass through events to the body */}
      {Array.from({ length: brick.length }).map((_, i) => (
        <g key={i} transform={`translate(${i * HOLE_SPACING}, 0)`} style={{ pointerEvents: 'none' }}>
            {/* Outer rim of hole */}
            <circle r={12} fill="rgba(0,0,0,0.2)" />
            {/* Inner hole (background color to simulate see-through) */}
            <circle r={8} fill="var(--bg-app)" />
            {/* Cross shape (Technic axle hole) */}
            <path d="M -2 -7 L 2 -7 L 2 -2 L 7 -2 L 7 2 L 2 2 L 2 7 L -2 7 L -2 2 L -7 2 L -7 -2 L -2 -2 Z" fill="rgba(0,0,0,0.1)" />
        </g>
      ))}

      {/* Delete Button (Only when selected) - Stabilized hover effect */}
      {isSelected && onDelete && (
        <g 
            transform={`translate(${totalLength / 2 - BRICK_WIDTH/2}, -45)`} 
            onClick={(e) => { e.stopPropagation(); onDelete(brick.id); }}
            className="cursor-pointer"
            style={{ pointerEvents: 'all' }}
        >
            {/* Larger invisible hit target for easier clicking */}
            <circle r={20} fill="transparent" />
            
            {/* Visible Button */}
            <circle 
                r={14} 
                fill="#ef4444" 
                stroke="white" 
                strokeWidth="2" 
                className="transition-all duration-200 hover:fill-red-600"
            />
            {/* Icon */}
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
