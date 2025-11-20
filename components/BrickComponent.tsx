
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
  
  // Logic Separation
  // BEAM (Studless): length = number of holes. Origin = Center of First Hole.
  // BRICK (Studded): length = number of studs. Number of holes = length - 1. Origin = Center of First Hole.

  const isBeam = brick.brickType === 'beam';
  const holeCount = isBeam ? brick.length : Math.max(1, brick.length - 1);
  const studCount = isBeam ? 0 : brick.length;
  
  // Geometry Calculations
  let rectX, rectWidth;
  
  if (isBeam) {
      // Beam: Rounded capsule around holes 0 to N-1
      // Start X: -Radius. End X: (N-1)*40 + Radius
      const radius = BRICK_WIDTH / 2; // 17px
      rectX = -radius;
      rectWidth = ((brick.length - 1) * HOLE_SPACING) + BRICK_WIDTH;
  } else {
      // Brick: Rectangular block enclosing studs
      // Studs are at -20, 20, 60... relative to First Hole (0)
      // Brick body must cover from -40 to end
      rectX = -HOLE_SPACING; // -40px
      rectWidth = brick.length * HOLE_SPACING; // e.g., 2 studs * 40 = 80px width
  }

  const rectY = -BRICK_WIDTH / 2;
  const displayColor = brick.color;
  const transform = `translate(${brick.x} ${brick.y}) rotate(${brick.rotation})`;
  
  // Stud Dimensions
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
      {/* Studs are located BETWEEN holes. 
          Hole 0 is at 0. Stud 0 is at -20 (0 - 40/2). Stud 1 is at 20.
      */}
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

      {/* Main Body - explicit pointer-events to capture clicks */}
      <rect 
        x={rectX} 
        y={rectY} 
        width={rectWidth} 
        height={BRICK_WIDTH} 
        rx={isBeam ? BRICK_CORNER_RADIUS : 2} 
        fill={displayColor}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.5)'}
        strokeWidth={isSelected ? 2 : 1}
        className="drop-shadow-md transition-colors duration-200"
        style={{ pointerEvents: 'all' }}
      />
      
      {/* Holes - pass through events to the body */}
      {Array.from({ length: holeCount }).map((_, i) => (
        <g key={i} transform={`translate(${i * HOLE_SPACING}, 0)`} style={{ pointerEvents: 'none' }}>
            {/* Outer rim of hole */}
            <circle r={12} fill="rgba(0,0,0,0.2)" />
            {/* Inner hole (background color to simulate see-through) */}
            <circle r={8} fill="var(--bg-app)" />
            {/* Cross shape (Technic axle hole) */}
            <path d="M -2 -7 L 2 -7 L 2 -2 L 7 -2 L 7 2 L 2 2 L 2 7 L -2 7 L -2 2 L -7 2 L -7 -2 L -2 -2 Z" fill="rgba(0,0,0,0.1)" />
        </g>
      ))}

      {/* Delete Button (Only when selected) */}
      {isSelected && onDelete && (
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
