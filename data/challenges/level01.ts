
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level01: Challenge = {
    id: 1,
    title: "First Steps",
    titleZh: "第一步",
    description: "Move the red gear to mesh with the green motor gear.",
    descriptionZh: "移動紅色齒輪使其與綠色馬達齒輪嚙合。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 7, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);
        
        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };
        
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + (6 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        p.gears.push(g1, g2);
        return p;
    },
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];
      const targets = gears.filter(g => !g.isMotor && g.rpm !== 0);
      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
};
