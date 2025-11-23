
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, GearType } from '../../types';
import { createPreset, cx, cy } from './utils';

export const Level17: Challenge = {
    id: 17,
    title: "Centrifuge",
    titleZh: "離心機",
    description: "Power 4 gears surrounding the center motor.",
    descriptionZh: "驅動圍繞中心馬達的 4 個齒輪。",
    preset: () => {
        const p = createPreset();
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx, y: cy, rotation: 0, fixed: true }); // Center
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true });
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx + 100, y: cy, rotation: 0, fixed: true });
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx, y: cy - 100, rotation: 90, fixed: true });
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx, y: cy + 100, rotation: 90, fixed: true });
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: cx, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
            colorOverride: '#22c55e' // Green
        };
        p.gears.push(gMotor);
        
        // Add 4 targets
        const positions = [
            {x: cx-100, y: cy, label: 'A'}, 
            {x: cx+100, y: cy, label: 'B'}, 
            {x: cx, y: cy-100, label: 'C'}, 
            {x: cx, y: cy+100, label: 'D'}
        ];
        
        positions.forEach(pos => {
             p.gears.push({
                id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: pos.x, y: pos.y, rotation: 0, connectedTo: [], fixed: true,
                isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
                ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
                colorOverride: '#ef4444', // Red
                customLabel: `TARGET ${pos.label}`
             });
        });

        return p;
    },
    check: (gears: GearState[]) => {
        const spinning = gears.filter(g => !g.isMotor && g.fixed && g.rpm !== 0);
        if (spinning.length >= 4) return spinning.map(g => g.id);
        return [];
    }
};
