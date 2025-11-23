
import { GearState } from '../types';
import { HOLE_SPACING } from '../constants';

// Helper: Line Segment Intersection
export const lineIntersectsLine = (p0_x: number, p0_y: number, p1_x: number, p1_y: number, p2_x: number, p2_y: number, p3_x: number, p3_y: number) => {
    let s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;
    let s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) return true;
    return false;
}

// Helper: Check if a point is on an axle (segment) with tolerance
export const isOverlappingAxle = (pointX: number, pointY: number, axle: GearState, tolerance: number = 10) => {
    const len = (axle.length || 3) * HOLE_SPACING;
    const isHorz = axle.rotation === 0; // Axle rotation is 0 or 90
    
    if (isHorz) {
        // Horizontal: Y must match, X must be within range
        if (Math.abs(pointY - axle.y) > tolerance) return false;
        const minX = axle.x - len / 2;
        const maxX = axle.x + len / 2;
        return pointX >= minX - tolerance && pointX <= maxX + tolerance;
    } else {
        // Vertical: X must match, Y must be within range
        if (Math.abs(pointX - axle.x) > tolerance) return false;
        const minY = axle.y - len / 2;
        const maxY = axle.y + len / 2;
        return pointY >= minY - tolerance && pointY <= maxY + tolerance;
    }
};

// Helper: Get closest valid mounting point on an axle
export const getClosestPointOnAxle = (x: number, y: number, axle: GearState) => {
    const len = (axle.length || 3) * HOLE_SPACING;
    const isHorz = axle.rotation === 0;
    
    if (isHorz) {
        // Project X onto segment
        const minX = axle.x - len / 2;
        const maxX = axle.x + len / 2;
        let clampedX = Math.max(minX, Math.min(maxX, x));
        
        // Snap to nearest HOLE_SPACING relative to center to align with studs
        const relX = clampedX - axle.x;
        const snappedRelX = Math.round(relX / 20) * 20;
        clampedX = axle.x + snappedRelX;

        if (clampedX < minX) clampedX = minX;
        if (clampedX > maxX) clampedX = maxX;

        return { x: clampedX, y: axle.y };
    } else {
        // Project Y onto segment
        const minY = axle.y - len / 2;
        const maxY = axle.y + len / 2;
        let clampedY = Math.max(minY, Math.min(maxY, y));

        const relY = clampedY - axle.y;
        const snappedRelY = Math.round(relY / 20) * 20;
        clampedY = axle.y + snappedRelY;

        if (clampedY < minY) clampedY = minY;
        if (clampedY > maxY) clampedY = maxY;

        return { x: axle.x, y: clampedY };
    }
};
