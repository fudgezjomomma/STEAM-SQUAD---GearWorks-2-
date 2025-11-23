
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level10: Challenge = {
    id: 10,
    title: "The Obstacle",
    titleZh: "障礙物",
    description: "A wall blocks the path! Use idler gears to go around it.",
    descriptionZh: "一堵牆擋住了去路！使用惰輪繞過它。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 13, brickType: 'beam', x: cx - 200, y: cy + 80, rotation: 0, fixed: true };
        p.bricks.push(b1);
        
        const wall: BrickState = { id: uuidv4(), length: 6, brickType: 'brick', x: cx - 40, y: cy, rotation: 90, fixed: true, isObstacle: true };
        p.bricks.push(wall);

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 9*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
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
