
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level12: Challenge = {
    id: 12,
    title: "Heavy Haul",
    titleZh: "重型運輸",
    description: "Load: 500Nm. Distance: Far. Use a Belt AND Gear Reduction.",
    descriptionZh: "負載：500Nm。距離：遠。使用皮帶和齒輪減速。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx - 200, y: cy, rotation: 0, fixed: true };
        const b2: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx + 150, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1, b2);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x + HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 100, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 100, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b2.x + 3*HOLE_SPACING, y: b2.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 100, motorTorque: 100, motorDirection: 1, 
            load: 500,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.load >= 500 && !g.isStalled && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
};
