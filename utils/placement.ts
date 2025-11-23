
import { GearState, BrickState, GearType } from '../types';
import { GEAR_DEFS, HOLE_SPACING } from '../constants';
import { getDistance } from './gearMath';
import { isOverlappingAxle, getClosestPointOnAxle, lineIntersectsLine } from './geometry';

// Find a free spot on the canvas spiraling out from center
export const findFreeSpot = (
    preferredX: number, 
    preferredY: number, 
    radius: number,
    gears: GearState[],
    bricks: BrickState[]
  ): { x: number, y: number } => {
    let x = preferredX;
    let y = preferredY;
    let angle = 0;
    let dist = 0;
    const angleStep = 0.5; 
    let iterations = 0;
    const maxIterations = 100; 

    while (iterations < maxIterations) {
        let collision = false;
        for (const g of gears) {
            const gDef = GEAR_DEFS[g.type];
            const d = Math.hypot(x - g.x, y - g.y);
            if (d < (radius + gDef.radius + 15)) {
                collision = true;
                break;
            }
        }

        if (!collision) {
             for (const b of bricks) {
                const rad = (b.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const isBeam = b.brickType === 'beam';
                const loopLimit = isBeam ? b.length : Math.max(1, b.length - 1);

                for(let i=0; i<loopLimit; i++) {
                    const hx = b.x + i * 40 * cos;
                    const hy = b.y + i * 40 * sin;
                    const d = Math.hypot(x - hx, y - hy);
                    if (d < (radius + 20 + 15)) { 
                        collision = true;
                        break;
                    }
                }
                if (collision) break;
             }
        }

        if (!collision) {
            return { x, y };
        }
        angle += angleStep;
        dist = 50 + (angle * 10);
        x = preferredX + Math.cos(angle) * dist;
        y = preferredY + Math.sin(angle) * dist;
        iterations++;
    }
    return { 
        x: preferredX + (Math.random() - 0.5) * 50, 
        y: preferredY + (Math.random() - 0.5) * 50 
    };
};

// Check collision with obstacles
export const checkCollision = (gear: Partial<GearState> & {type: GearType, x: number, y: number}, x: number, y: number, bricks: BrickState[]): boolean => {
    const gearRadius = GEAR_DEFS[gear.type].radius;
    const collisionRadius = gearRadius + 15; 

    for (const b of bricks) {
        if (!b.isObstacle) continue;

        const rad = (b.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const len = b.brickType === 'beam' ? b.length : Math.max(1, b.length);
        
        for(let i=0; i < len; i++) {
            const hx = b.x + i * 40 * cos;
            const hy = b.y + i * 40 * sin;
            const dist = Math.hypot(x - hx, y - hy);
            
            if (dist < (collisionRadius + 17)) {
                return true;
            }
        }
    }
    return false;
};

// Check if a belt segment obstructs an obstacle
export const checkBeltObstruction = (g1: GearState, g2: GearState, bricks: BrickState[]): boolean => {
    for (const b of bricks) {
        if (!b.isObstacle) continue;
        const angle = -b.rotation * (Math.PI / 180);
        const dx = b.x;
        const dy = b.y;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const lx1 = (g1.x - dx) * cos - (g1.y - dy) * sin;
        const ly1 = (g1.x - dx) * sin + (g1.y - dy) * cos;
        const lx2 = (g2.x - dx) * cos - (g2.y - dy) * sin;
        const ly2 = (g2.x - dx) * sin + (g2.y - dy) * cos;
        const brickHeightHalf = 17; 
        const minY = -brickHeightHalf;
        const maxY = brickHeightHalf;
        let minX, maxX;
        if (b.brickType === 'beam') {
            minX = -17;
            maxX = (b.length - 1) * 40 + 17;
        } else {
            minX = -40;
            maxX = (b.length * 40) - 40;
        }
        const safePadding = 5; 
        if (lineIntersectsLine(lx1, ly1, lx2, ly2, minX-safePadding, minY-safePadding, maxX+safePadding, minY-safePadding)) return true; 
        if (lineIntersectsLine(lx1, ly1, lx2, ly2, minX-safePadding, maxY+safePadding, maxX+safePadding, maxY+safePadding)) return true; 
        if (lineIntersectsLine(lx1, ly1, lx2, ly2, minX-safePadding, minY-safePadding, minX-safePadding, maxY+safePadding)) return true; 
        if (lineIntersectsLine(lx1, ly1, lx2, ly2, maxX+safePadding, minY-safePadding, maxX+safePadding, maxY+safePadding)) return true; 
    }
    return false;
};

export const snapBrick = (brick: BrickState, others: BrickState[]) => {
    return {
        ...brick,
        x: Math.round(brick.x / 20) * 20,
        y: Math.round(brick.y / 20) * 20
    };
};

export const snapGear = (gear: GearState, others: GearState[], bricks: BrickState[]): GearState => {
    const def = GEAR_DEFS[gear.type];
    let bestX = gear.x;
    let bestY = gear.y;
    let bestRotation = gear.rotation;
    let snapped = false;

    // 0. MOUNTING / STACKING
    // A: Snap to Center of other gears (Standard Stacking)
    for (const other of others) {
        if (other.axleId === gear.axleId) continue;
        if (Math.abs(gear.x - other.x) < 15 && Math.abs(gear.y - other.y) < 15) {
            bestX = other.x;
            bestY = other.y;
            snapped = true;
            break; 
        }
    }

    // B: Snap to ANYWHERE along an Axle's length
    if (!snapped) {
        if (def.isAxle) {
            // If I am an axle, do I overlap a gear?
            for(const other of others) {
                if(other.axleId === gear.axleId) continue;
                const otherDef = GEAR_DEFS[other.type];
                if(!otherDef.isAxle) {
                    // Check if the gear is on this axle
                    if (isOverlappingAxle(other.x, other.y, gear, 20)) {
                        if (Math.abs(gear.x - other.x) < 20 && Math.abs(gear.y - other.y) < 20) {
                            bestX = other.x;
                            bestY = other.y;
                            snapped = true;
                            break;
                        }
                    }
                }
            }
        } else {
            // I am a gear, am I over an axle?
            for(const other of others) {
                if (other.axleId === gear.axleId) continue;
                const otherDef = GEAR_DEFS[other.type];
                if (otherDef.isAxle) {
                    // Project gear position onto axle
                    if (isOverlappingAxle(gear.x, gear.y, other, 30)) {
                        const point = getClosestPointOnAxle(gear.x, gear.y, other);
                        bestX = point.x;
                        bestY = point.y;
                        snapped = true;
                        break;
                    }
                }
            }
        }
    }

    // 0.5 Snap Axle Tips to Gear Centers (End-to-End / Tip Connection)
    if (!snapped) {
    if (def.isAxle) {
        const len = (gear.length || 3) * HOLE_SPACING;
        const isHorz = gear.rotation === 0;
        const tips = isHorz 
            ? [{x: gear.x - len/2, y: gear.y}, {x: gear.x + len/2, y: gear.y}]
            : [{x: gear.x, y: gear.y - len/2}, {x: gear.x, y: gear.y + len/2}];
        
        for(const tip of tips) {
            for(const other of others) {
                if (other.axleId === gear.axleId) continue;
                if (Math.hypot(tip.x - other.x, tip.y - other.y) < 20) { // Tolerant snap
                    const offsetX = tip.x - gear.x;
                    const offsetY = tip.y - gear.y;
                    bestX = other.x - offsetX;
                    bestY = other.y - offsetY;
                    snapped = true;
                    break;
                }
            }
            if (snapped) break;
        }
    }
    else {
            for(const other of others) {
                const otherDef = GEAR_DEFS[other.type];
                if (otherDef.isAxle) {
                    const len = (other.length || 3) * HOLE_SPACING;
                    const isHorz = other.rotation === 0;
                    const tips = isHorz 
                    ? [{x: other.x - len/2, y: other.y}, {x: other.x + len/2, y: other.y}]
                    : [{x: other.x, y: other.y - len/2}, {x: other.x, y: other.y + len/2}];
                    
                    for(const tip of tips) {
                        if (Math.hypot(gear.x - tip.x, gear.y - tip.y) < 20) { // Tolerant snap
                            bestX = tip.x;
                            bestY = tip.y;
                            snapped = true;
                            break;
                        }
                    }
                }
                if (snapped) break;
            }
    }
    }

    // 1. Snap to mesh with other gears (Side-by-Side)
    if (!snapped && !def.isAxle) {
        const isBevel = def.isBevel;
        const isVertical = gear.orientation && gear.orientation !== 'flat';
        const isWorm = def.isWorm;

        let minDiff = 15; 
        for (const other of others) {
            const otherDef = GEAR_DEFS[other.type];
            if (other.axleId === gear.axleId) continue;
            if (otherDef.isAxle) continue; // Already handled mounting

            // Smart Axis Alignment
            if (Math.abs(gear.x - other.x) < 5) bestX = other.x;
            if (Math.abs(gear.y - other.y) < 5) bestY = other.y;

            const currentDist = getDistance(gear.x, gear.y, other.x, other.y);
            
            let idealDist = def.radius + otherDef.radius;
            const MESH_PADDING = -1; 

            if (isBevel && isVertical && (!other.orientation || other.orientation === 'flat')) {
                idealDist = otherDef.radius + 9; 
            }
            if (isWorm) {
                idealDist = otherDef.radius + def.radius; // Worm radius is approx 15px
            }
            
            if (Math.abs(currentDist - idealDist) < minDiff) {
                const angle = Math.atan2(gear.y - other.y, gear.x - other.x);
                
                const deg = angle * (180/Math.PI);
                let snapAngle = angle;
                if (Math.abs(deg - 0) < 10) snapAngle = 0;
                if (Math.abs(deg - 90) < 10) snapAngle = Math.PI/2;
                if (Math.abs(deg - 180) < 10) snapAngle = Math.PI;
                if (Math.abs(deg + 180) < 10) snapAngle = Math.PI;
                if (Math.abs(deg + 90) < 10) snapAngle = -Math.PI/2;

                bestX = other.x + Math.cos(snapAngle) * (idealDist + MESH_PADDING);
                bestY = other.y + Math.sin(snapAngle) * (idealDist + MESH_PADDING);
                snapped = true;
                break;
            }
        }
    }

    // 2. Snap to Bricks (Holes)
    if (!snapped) {
        let minDist = 15;
        for (const b of bricks) {
            const isBeam = b.brickType === 'beam';
            const holeCount = isBeam ? b.length : Math.max(1, b.length - 1);
            const rad = (b.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            for (let i=0; i<holeCount; i++) {
                const hx = b.x + (i * HOLE_SPACING) * cos;
                const hy = b.y + (i * HOLE_SPACING) * sin;
                
                const d = getDistance(gear.x, gear.y, hx, hy);
                if (d < minDist) {
                    bestX = hx;
                    bestY = hy;
                    snapped = true;
                    minDist = d;
                }
            }
        }
    }
    
    // 3. Grid Snap
    if (!snapped) {
        bestX = Math.round(gear.x / 20) * 20;
        bestY = Math.round(gear.y / 20) * 20;
    }

    return { ...gear, x: bestX, y: bestY, rotation: bestRotation };
};
