
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level05: Challenge = {
    id: 5,
    title: "Compound Basics",
    titleZh: "複合齒輪基礎",
    description: "Stack the loose gears on the beam to bridge the gap between the Motor (Green) and Target (Red).",
    descriptionZh: "將鬆散的齒輪堆疊在橫梁上，以連接馬達（綠色）和目標（紅色）之間的間隙。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: b1.x + (4*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };
        
        // Loose gears for the user to assemble
        const gLoose1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: cx, y: cy + 100, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        const gLoose2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: cx + 60, y: cy + 100, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(gMotor, gTarget, gLoose1, gLoose2);
        return p;
    },
    check: (gears: GearState[]) => {
      const target = gears.find(g => !g.isMotor && g.fixed && g.rpm !== 0);
      if (target) return [target.id];
      return [];
    }
};
