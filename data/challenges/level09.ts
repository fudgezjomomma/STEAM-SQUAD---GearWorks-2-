
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level09: Challenge = {
    id: 9,
    title: "Speed Racer",
    titleZh: "極速賽車",
    description: "The motor is slow (60 RPM). Make the target gear spin faster than 200 RPM.",
    descriptionZh: "馬達很慢 (60 RPM)。讓目標齒輪轉速超過 200 RPM。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 500, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 500, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };
        
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x + 5*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        // Must be the FIXED target gear (user added gears are not fixed)
        const fastGear = gears.find(g => 
            !g.isMotor && 
            g.fixed && 
            g.type === GearType.Small &&
            Math.abs(g.rpm) > 200 && 
            !g.isJammed
        );
        if (fastGear) return [fastGear.id];
        return [];
    }
};
