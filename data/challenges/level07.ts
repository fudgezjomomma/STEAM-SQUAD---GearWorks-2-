
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level07: Challenge = {
    id: 7,
    title: "Cross Output",
    titleZh: "交叉輸出",
    description: "Make the TWO output gears turn Counter-Clockwise (Opposite to motor).",
    descriptionZh: "讓這兩個輸出齒輪都逆時針旋轉（與馬達相反）。",
    preset: () => {
         const p = createPreset();
         const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 120, y: cy, rotation: 0, fixed: true };
         p.bricks.push(b1);

         const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 4*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
         };

         const gOut1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET A"
         };

         const gOut2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 8*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET B"
         };

         p.gears.push(gMotor, gOut1, gOut2);
         return p;
    },
    check: (gears: GearState[]) => {
        const motor = gears.find(g => g.isMotor);
        if (!motor) return [];
        const correctDir = gears.filter(g => !g.isMotor && !g.isJammed && g.rpm !== 0 && g.direction !== motor.direction);
        if (correctDir.length >= 2) return [motor.id, ...correctDir.map(g => g.id)];
        return [];
    }
};
