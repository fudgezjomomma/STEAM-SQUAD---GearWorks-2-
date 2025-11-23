
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { HOLE_SPACING } from '../../constants';
import { createPreset, cx, cy } from './utils';

export const Level06: Challenge = {
    id: 6,
    title: "Wall Climber",
    titleZh: "攀牆者",
    description: "Build a vertical gear train up the wall to reach the top gear.",
    descriptionZh: "沿著牆壁建立一個垂直齒輪系，以到達頂部齒輪。",
    preset: () => {
        const p = createPreset();
        // 16 Studs long, rotated 270 (Vertical Up).
        const b1: BrickState = { id: uuidv4(), length: 16, brickType: 'brick', x: cx, y: cy + 250, rotation: 270, fixed: true };
        p.bricks.push(b1);

        // Motor at Bottom (Hole 0) - 40T Green
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };
        
        // Target at Top (Hole 15) - 8T Red
        // 15 * 40 = 600px distance along the beam
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y - (15 * HOLE_SPACING), rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            colorOverride: '#ef4444', // Red
            customLabel: "TARGET"
        };

        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
         const target = gears.find(g => 
             !g.isMotor && 
             g.fixed && 
             g.rpm !== 0 && 
             g.type === GearType.Small &&
             g.y < cy 
         );
         if (target) {
             return [target.id];
         }
         return [];
    }
};
