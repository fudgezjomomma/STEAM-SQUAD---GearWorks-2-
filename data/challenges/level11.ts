
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level11: Challenge = {
    id: 11,
    title: "The Relay",
    titleZh: "中繼站",
    description: "A wall blocks the direct path. Use the high beam as a relay station to route power OVER the obstacle.",
    descriptionZh: "一堵牆擋住了直接的路徑。使用高處的橫梁作為中繼站，將動力從障礙物上方傳輸過去。",
    preset: () => {
        const p = createPreset();
        
        // Ground mounts
        const bLeft: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx - 200, y: cy + 150, rotation: 0, fixed: true };
        const bRight: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx + 200, y: cy + 150, rotation: 0, fixed: true };
        
        // Relay Station (High up)
        const bRelay: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx, y: cy - 150, rotation: 0, fixed: true };
        
        // The Obstacle (Tall Wall in middle)
        const wall: BrickState = { id: uuidv4(), length: 12, brickType: 'brick', x: cx, y: cy + 50, rotation: 90, fixed: true, isObstacle: true };
        
        p.bricks.push(bLeft, bRight, bRelay, wall);
        
        // Motor (Green, Left)
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: bLeft.x, y: bLeft.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        // Target (Red, Right)
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: bRight.x, y: bRight.y, rotation: 0, connectedTo: [], fixed: true,
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
