
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level15: Challenge = {
    id: 15,
    title: "Exact Ratio",
    titleZh: "精確比率",
    description: "Motor is 60 RPM. Target must be exactly 30 RPM (2:1 Ratio).",
    descriptionZh: "馬達為 60 RPM。目標必須精確為 30 RPM (2:1 比率)。",
    preset: () => {
        const p = createPreset();
        const b: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b.x, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b.x + 4*HOLE_SPACING, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.fixed && Math.abs(g.rpm) === 30);
        if (t) return [t.id];
        return [];
    }
};
