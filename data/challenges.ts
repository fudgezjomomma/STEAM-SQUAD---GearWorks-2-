

import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, Belt, GearType } from '../types';
import { HOLE_SPACING } from '../constants';

const createPreset = (): { gears: GearState[], bricks: BrickState[], belts: Belt[] } => ({
    gears: [],
    bricks: [],
    belts: []
});

const cx = 500;
const cy = 350;

export const CHALLENGES: Challenge[] = [
  {
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
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + (6 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
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
  },
  {
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
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + (4 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(g1, g2);
        return p;
    },
    check: (gears: GearState[]) => {
      const moving = gears.filter(g => g.rpm !== 0 && !g.isJammed);
      if (moving.length >= 3) return moving.map(g => g.id);
      return [];
    }
  },
  {
    id: 3,
    title: "Torque Lifter",
    titleZh: "扭力舉重機",
    description: "Load: 250Nm. Motor: 60Nm. Build a gear reduction (Small -> Large) to increase torque.",
    descriptionZh: "負載：250Nm。馬達：60Nm。建立一個減速齒輪組（小->大）來增加扭力。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 120, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);

        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 2, motorRpm: 120, motorTorque: 60, motorDirection: 1, load: 0, 
            ratio: 1, rpm: 120, torque: 60, direction: 1, speed: 2, isJammed: false, isStalled: false
        };

        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x + (4 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, 
            load: 250, 
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(g1, g2);
        return p;
    },
    check: (gears: GearState[]) => {
      const loadGear = gears.find(g => g.load >= 250);
      if (loadGear && !loadGear.isStalled && loadGear.rpm !== 0) {
          return [loadGear.id];
      }
      return [];
    }
  },
  {
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
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        p.gears.push(g1);

        const b2: BrickState = { id: uuidv4(), length: 3, brickType: 'beam', x: cx + 100, y: cy - 100, rotation: 45, fixed: true };
        p.bricks.push(b2);
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: b2.x, y: b2.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        p.gears.push(g2);

        return p;
    },
    check: (gears: GearState[]) => {
        const target = gears.find(g => !g.isMotor && g.rpm !== 0);
        if (target) return [target.id];
        return [];
    }
  },
  {
    id: 5,
    title: "Compound Basics",
    titleZh: "複合齒輪基礎",
    description: "Use the stacked gears to drive the final gear.",
    descriptionZh: "使用堆疊齒輪驅動最終齒輪。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        const axle2 = uuidv4();
        const gStackBottom: GearState = {
            id: uuidv4(), axleId: axle2, type: GearType.ExtraLarge, x: b1.x + (3*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        const gStackTop: GearState = {
            id: uuidv4(), axleId: axle2, type: GearType.Small, x: b1.x + (3*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + (5*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(gMotor, gStackBottom, gStackTop, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
      const last = gears[gears.length - 1]; 
      if (last.rpm !== 0 && !last.isJammed) return [last.id];
      return [];
    }
  },
  {
    id: 6,
    title: "Wall Climber",
    titleZh: "攀牆者",
    description: "Build a vertical gear train up the wall to reach the top gear.",
    descriptionZh: "沿著牆壁建立一個垂直齒輪系，以到達頂部齒輪。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 8, brickType: 'brick', x: cx, y: cy + 100, rotation: 270, fixed: true };
        p.bricks.push(b1);

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y - (7 * HOLE_SPACING), rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
         const topGear = gears.reduce((highest, current) => current.y < highest.y ? current : highest, gears[0]);
         if (topGear && topGear.rpm !== 0 && !topGear.isMotor && topGear.y < (cy - 100)) {
             return [topGear.id];
         }
         return [];
    }
  },
  {
    id: 7,
    title: "Cross Output",
    titleZh: "交叉輸出",
    description: "Make the TWO output gears turn Counter-Clockwise (Opposite to motor).",
    descriptionZh: "讓這兩個輸出齒輪都逆時針旋轉（與馬達相反）。",
    preset: () => {
         const p = createPreset();
         const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 120, y: cy, rotation: 0, fixed: true };
         p.bricks.push(b1);

         const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 4*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
         };

         const gOut1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
         };

         const gOut2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 8*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
         };

         p.gears.push(gMotor, gOut1, gOut2);
         return p;
    },
    check: (gears: GearState[]) => {
        const motor = gears.find(g => g.isMotor);
        if (!motor) return [];
        const correctDir = gears.filter(g => !g.isMotor && !g.isJammed && g.rpm !== 0 && g.direction !== motor.direction);
        if (correctDir.length >= 2) return [motor.id, ...correctDir.map(g => g.id)];
        return [];
    }
  },
  {
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
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gLoad: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x + 12*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 3000,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(gMotor, gLoad);
        return p;
    },
    check: (gears: GearState[]) => {
      const successfulLoad = gears.find(g => !g.isMotor && g.load >= 3000 && !g.isStalled && g.rpm !== 0);
      if (successfulLoad) return [successfulLoad.id];
      return [];
    }
  },
  {
    id: 9,
    title: "Speed Racer",
    titleZh: "極速賽車",
    description: "The motor is slow (60 RPM). Make the target gear spin faster than 200 RPM.",
    descriptionZh: "馬達很慢 (60 RPM)。讓目標齒輪轉速超過 200 RPM。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 500, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 500, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x + 5*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const fastGear = gears.find(g => !g.isMotor && Math.abs(g.rpm) > 200 && !g.isJammed);
        if (fastGear) return [fastGear.id];
        return [];
    }
  },
  {
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
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 9*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.fixed && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
  },
  {
    id: 11,
    title: "Sky Hook",
    titleZh: "天空鉤",
    description: "The motor is on the ground. The target is high in the sky. Use a belt to reach it.",
    descriptionZh: "馬達在地面上。目標在天空中。使用皮帶到達它。",
    preset: () => {
        const p = createPreset();
        const bBase: BrickState = { id: uuidv4(), length: 5, brickType: 'brick', x: cx - 50, y: cy + 150, rotation: 0, fixed: true };
        const bTop: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx - 50, y: cy - 150, rotation: 0, fixed: true };
        p.bricks.push(bBase, bTop);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: bBase.x + 2*HOLE_SPACING, y: bBase.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: bTop.x + 2*HOLE_SPACING, y: bTop.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.fixed && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
  },
  {
    id: 12,
    title: "Heavy Haul",
    titleZh: "重型運輸",
    description: "Load: 500Nm. Distance: Far. Use a Belt AND Gear Reduction.",
    descriptionZh: "負載：500Nm。距離：遠。使用皮帶和齒輪減速。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx - 200, y: cy, rotation: 0, fixed: true };
        const b2: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx + 150, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b1, b2);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x + HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 100, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 100, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b2.x + 3*HOLE_SPACING, y: b2.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 100, motorTorque: 100, motorDirection: 1, 
            load: 500,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.load >= 500 && !g.isStalled && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
  },
  {
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
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gA: GearState = { // Target A
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b.x, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        const gB: GearState = { // Target B
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b.x + 12*HOLE_SPACING, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
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
  },
  {
    id: 14,
    title: "The Cage",
    titleZh: "籠子",
    description: "The motor is trapped inside a box. Get power to the outside target.",
    descriptionZh: "馬達被困在盒子裡。將動力傳輸到外面的目標。",
    preset: () => {
        const p = createPreset();
        // Box with obstacles
        p.bricks.push({ id: uuidv4(), length: 7, brickType: 'brick', x: cx - 100, y: cy - 60, rotation: 0, fixed: true, isObstacle: true });
        p.bricks.push({ id: uuidv4(), length: 7, brickType: 'brick', x: cx - 100, y: cy + 60, rotation: 0, fixed: true, isObstacle: true });
        p.bricks.push({ id: uuidv4(), length: 5, brickType: 'brick', x: cx - 120, y: cy, rotation: 90, fixed: true, isObstacle: true });
        p.bricks.push({ id: uuidv4(), length: 5, brickType: 'brick', x: cx + 120, y: cy, rotation: 90, fixed: true, isObstacle: true });
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: cx, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: cx + 200, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.fixed && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
  },
  {
    id: 15,
    title: "Exact Ratio",
    titleZh: "精確比率",
    description: "Motor is 60 RPM. Target must be exactly 30 RPM (2:1 Ratio).",
    descriptionZh: "馬達為 60 RPM。目標必須精確為 30 RPM (2:1 比率)。",
    preset: () => {
        const p = createPreset();
        const b: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0, fixed: true };
        p.bricks.push(b);
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b.x, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b.x + 4*HOLE_SPACING, y: b.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.fixed && Math.abs(g.rpm) === 30);
        if (t) return [t.id];
        return [];
    }
  },
  {
    id: 16,
    title: "Island Hopping",
    titleZh: "跳島戰術",
    description: "Connect the gears across 3 separate islands.",
    descriptionZh: "連接 3 個獨立島嶼上的齒輪。",
    preset: () => {
        const p = createPreset();
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx - 200, y: cy, rotation: 0, fixed: true });
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx, y: cy - 100, rotation: 0, fixed: true });
        p.bricks.push({ id: uuidv4(), length: 3, brickType: 'beam', x: cx + 200, y: cy, rotation: 0, fixed: true });
        
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: cx - 200, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: cx + 200, y: cy, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.fixed && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
  },
  {
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
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        p.gears.push(gMotor);
        
        // Add 4 targets
        [
            {x: cx-100, y: cy}, {x: cx+100, y: cy}, {x: cx, y: cy-100}, {x: cx, y: cy+100}
        ].forEach(pos => {
             p.gears.push({
                id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: pos.x, y: pos.y, rotation: 0, connectedTo: [], fixed: true,
                isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
                ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
             });
        });

        return p;
    },
    check: (gears: GearState[]) => {
        const spinning = gears.filter(g => !g.isMotor && g.fixed && g.rpm !== 0);
        if (spinning.length >= 4) return spinning.map(g => g.id);
        return [];
    }
  },
  {
    id: 18,
    title: "Grand Finale",
    titleZh: "大結局",
    description: "Load: 2000Nm. Distance: Far. Obstacles: Yes. Good Luck.",
    descriptionZh: "負載：2000Nm。距離：遠。障礙物：有。祝你好運。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 7, brickType: 'brick', x: cx - 200, y: cy, rotation: 0, fixed: true };
        const b2: BrickState = { id: uuidv4(), length: 7, brickType: 'brick', x: cx + 200, y: cy - 150, rotation: 0, fixed: true };
        p.bricks.push(b1, b2);
        
        // Obstacle Wall
        p.bricks.push({ id: uuidv4(), length: 9, brickType: 'brick', x: cx, y: cy, rotation: 90, fixed: true, isObstacle: true });

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b2.x, y: b2.y, rotation: 0, connectedTo: [], fixed: true,
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, 
            load: 2000,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gMotor, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
        const t = gears.find(g => !g.isMotor && g.load >= 2000 && !g.isStalled && g.rpm !== 0);
        if (t) return [t.id];
        return [];
    }
  }
];