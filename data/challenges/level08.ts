
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level08: Challenge = {
    id: 8,
    title: "The Titan (3000Nm)",
    titleZh: "泰坦巨人",
    description: "Load: 3000Nm. Motor: 100Nm. You need a 30:1 gear reduction.",
    descriptionZh: "負載：3000Nm。馬達：100Nm。你需要 30:1 的齒輪減速比。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 15, brickType: 'beam', x: cx - 200, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e', // Green
            layer: 3 // Start at Layer 3 to allow cascading compound gears (L3->L2->L1)
        };

        const gLoad: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x + 14*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 3000,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };

        p.gears.push(gMotor, gLoad);
        return p;
    },
    check: (gears: GearState[]) => {
      const successfulLoad = gears.find(g => !g.isMotor && g.load >= 3000 && !g.isStalled && g.rpm !== 0);
      if (successfulLoad) return [successfulLoad.id];
      return [];
    }
};
