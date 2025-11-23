
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { createPreset, cx, cy } from './utils';

export const Level18: Challenge = {
    id: 18,
    title: "Grand Finale",
    titleZh: "大結局",
    description: "Load: 2000Nm. Distance: Far. Obstacles: Yes. Good Luck.",
    descriptionZh: "負載：2000Nm。距離：遠。障礙物：有。祝你好運。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 7, brickType: 'brick', x: cx - 200, y: cy, rotation: 0, fixed: true };
        const b2: BrickState = { id: uuidv4(), length: 7, brickType: 'brick', x: cx + 200, y: cy - 150, rotation: 0, fixed: true };
        p.bricks.push(b1, b2);
        
        // Obstacle Wall
        p.bricks.push({ id: uuidv4(), length: 9, brickType: 'brick', x: cx, y: cy, rotation: 90, fixed: true, isObstacle: true });

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b2.x, y: b2.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, 
            load: 2000,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.load >= 2000 && !g.isStalled && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
};
