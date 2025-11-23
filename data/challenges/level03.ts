
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level03: Challenge = {
    id: 3,
    title: "Torque Lifter",
    titleZh: "扭力舉重機",
    description: "Load: 250Nm. Add a Small Gear (8T) and set it as a MOTOR to generate enough torque.",
    descriptionZh: "負載：250Nm。加入一個小齒輪 (8T) 並將其設為馬達，以產生足夠的扭力。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 120, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);

        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x + (4 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, 
            load: 250, 
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };

        p.gears.push(g2);
        return p;
    },
    check: (gears: GearState[]) => {
      const loadGear = gears.find(g => g.load >= 250);
      if (loadGear && !loadGear.isStalled && loadGear.rpm !== 0) {
          return [loadGear.id];
      }
      return [];
    }
};
