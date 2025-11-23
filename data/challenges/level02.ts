
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level02: Challenge = {
    id: 2,
    title: "The Gap",
    titleZh: "鴻溝",
    description: "Add an 'Idler' gear in the middle to bridge the gap.",
    descriptionZh: "在中間加入一個「惰輪」來填補鴻溝。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx - 80, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);
        
        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };
        
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + (4 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        p.gears.push(g1, g2);
        return p;
    },
    check: (gears: GearState[]) => {
      const moving = gears.filter(g => g.rpm !== 0 && !g.isJammed);
      if (moving.length >= 3) return moving.map(g => g.id);
      return [];
    }
};
