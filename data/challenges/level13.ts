
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level13: Challenge = {
    id: 13,
    title: "Direction Split",
    titleZh: "方向分離",
    description: "Target A must spin Clockwise. Target B must spin Counter-Clockwise. Use belts or idlers!",
    descriptionZh: "目標 A 必須順時針旋轉。目標 B 必須逆時針旋轉。使用皮帶或惰輪！",
    preset: () => {
        const p = createPreset();
        const b: BrickState = { id: uuidv4(), length: 13, brickType: 'beam', x: cx - 150, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b.x + 6*HOLE_SPACING, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        const gA: GearState = { // Target A
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b.x, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET A"
        };

        const gB: GearState = { // Target B
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b.x + 12*HOLE_SPACING, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET B"
        };
        
        p.gears.push(gMotor, gA, gB);
        return p;
    },
    check: (gears: GearState[]) => {
        const left = gears.find(g => g.x < cx);
        const right = gears.find(g => g.x > cx + 100);
        if (left && right && left.rpm !== 0 && right.rpm !== 0) {
            if (left.direction === 1 && right.direction === -1) return [left.id, right.id];
        }
        return [];
    }
};
