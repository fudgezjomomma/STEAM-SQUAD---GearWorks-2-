
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { createPreset, cx, cy } from './utils';

export const Level04: Challenge = {
    id: 4,
    title: "Pulley Power",
    titleZh: "滑輪動力",
    description: "Use a Belt to connect the motor system to the target system.",
    descriptionZh: "使用皮帶連接馬達系統和目標系統。",
    preset: () => {
        const p = createPreset();
        
        const b1: BrickState = { id: uuidv4(), length: 3, brickType: 'beam', x: cx - 200, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);
        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };
        p.gears.push(g1);

        const b2: BrickState = { id: uuidv4(), length: 3, brickType: 'beam', x: cx + 100, y: cy - 100, rotation: 45, fixed: true };
        p.bricks.push(b2);
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: b2.x, y: b2.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        p.gears.push(g2);

        return p;
    },
    check: (gears: GearState[]) => {
        const target = gears.find(g => !g.isMotor && g.rpm !== 0);
        if (target) return [target.id];
        return [];
    }
};
