
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { createPreset, cx, cy } from './utils';

export const Level14: Challenge = {
    id: 14,
    title: "The Cage",
    titleZh: "籠子",
    description: "The motor is trapped! Route power through the gap in the wall to the target.",
    descriptionZh: "馬達被困住了！將動力穿過牆上的縫隙傳輸到目標。",
    preset: () => {
        const p = createPreset();
        
        // --- The Cage Structure ---
        // Centered around cx, cy
        
        // Top Wall (Solid)
        p.bricks.push({ id: uuidv4(), length: 9, brickType: 'brick', x: cx, y: cy - 100, rotation: 0, fixed: true, isObstacle: true });
        
        // Bottom Wall (Solid)
        p.bricks.push({ id: uuidv4(), length: 9, brickType: 'brick', x: cx, y: cy + 100, rotation: 0, fixed: true, isObstacle: true });
        
        // Left Wall (Solid)
        p.bricks.push({ id: uuidv4(), length: 5, brickType: 'brick', x: cx - 160, y: cy, rotation: 90, fixed: true, isObstacle: true });
        
        // Right Wall (Split with Gap)
        // Gap is at y=0. Top part moves up, bottom part moves down.
        p.bricks.push({ id: uuidv4(), length: 2, brickType: 'brick', x: cx + 160, y: cy - 60, rotation: 90, fixed: true, isObstacle: true });
        p.bricks.push({ id: uuidv4(), length: 2, brickType: 'brick', x: cx + 160, y: cy + 60, rotation: 90, fixed: true, isObstacle: true });
        
        // Motor (Inside)
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: cx, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        // Target (Outside, Far Right)
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: cx + 300, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.fixed && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
};
