
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { createPreset, cx, cy } from './utils';

export const Level16: Challenge = {
    id: 16,
    title: "Island Hopping",
    titleZh: "跳島戰術",
    description: "Connect the gears across 3 separate islands.",
    descriptionZh: "連接 3 個獨立島嶼上的齒輪。",
    preset: () => {
        const p = createPreset();
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx - 200, y: cy, rotation: 0, fixed: true });
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx, y: cy - 100, rotation: 0, fixed: true });
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx + 200, y: cy, rotation: 0, fixed: true });
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: cx - 200, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: cx + 200, y: cy, rotation: 0, connectedTo: [], fixed: true,
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
