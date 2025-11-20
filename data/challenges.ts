
import { v4 as uuidv4 } from 'uuid';
import { Challenge, GearState, BrickState, Belt, GearType } from '../types';
import { HOLE_SPACING } from '../constants';

// Helper to create standard starting components
const createPreset = (): { gears: GearState[], bricks: BrickState[], belts: Belt[] } => ({
    gears: [],
    bricks: [],
    belts: []
});

const cx = 500;
const cy = 350;

export const CHALLENGES: Challenge[] = [
  // --- TUTORIAL / BASICS ---
  {
    id: 1,
    title: "First Steps",
    titleZh: "第一步",
    description: "Two gears are placed on a beam but aren't connecting. Move the red gear to mesh with the green motor gear.",
    descriptionZh: "兩個齒輪放在橫梁上但沒有連接。移動紅色齒輪使其與綠色馬達齒輪嚙合。",
    preset: () => {
        const p = createPreset();
        // 7L Beam
        const b1: BrickState = { id: uuidv4(), length: 7, brickType: 'beam', x: cx - 100, y: cy, rotation: 0 };
        p.bricks.push(b1);
        
        // Motor Gear (Index 0)
        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        // Target Gear (Far away)
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
    title: "The Gap (Idler)",
    titleZh: "鴻溝 (惰輪)",
    description: "The Motor and the Output gear are too far apart to touch. Add an 'Idler' gear in the middle to bridge the gap.",
    descriptionZh: "馬達和輸出齒輪距離太遠，無法接觸。在中間加入一個「惰輪」來填補鴻溝。",
    preset: () => {
        const p = createPreset();
        // 5L Beam
        const b1: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: cx - 80, y: cy, rotation: 0 };
        p.bricks.push(b1);
        
        // Motor (Index 0) - 16T
        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        // Output (Index 4) - 16T
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + (4 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(g1, g2);
        return p;
    },
    check: (gears: GearState[]) => {
      // Need at least 3 gears moving
      const moving = gears.filter(g => g.rpm !== 0 && !g.isJammed);
      if (moving.length >= 3) return moving.map(g => g.id);
      return [];
    }
  },
  {
    id: 3,
    title: "Torque Lifter",
    titleZh: "扭力舉重機",
    description: "We have a fast motor but a heavy 250Nm load. The motor is stalling! Build a gear reduction (Small Driver -> Large Driven) to increase torque.",
    descriptionZh: "我們有一個高速馬達，但負載高達 250Nm。馬達卡死了！建立一個減速齒輪組（小驅動 -> 大被動）來增加扭力。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 120, y: cy, rotation: 0 };
        p.bricks.push(b1);

        // Weak Motor (High Speed, Low Torque)
        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 2, motorRpm: 120, motorTorque: 60, motorDirection: 1, load: 0, // Only 60Nm torque
            ratio: 1, rpm: 120, torque: 60, direction: 1, speed: 2, isJammed: false, isStalled: false
        };

        // Heavy Load Gear (Currently disconnected or direct connect would fail)
        // Placed far away so user has to build to it
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x + (4 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, 
            load: 250, // 250Nm Load vs 60Nm Motor. Needs 4.16x ratio.
            // 8T -> 40T is 5x. Torque = 60 * 5 = 300Nm. Success.
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
    description: "The gears are on separate islands! Use a Belt to connect the motor system to the target system.",
    descriptionZh: "齒輪在分開的孤島上！使用皮帶連接馬達系統和目標系統。",
    preset: () => {
        const p = createPreset();
        
        // Island 1
        const b1: BrickState = { id: uuidv4(), length: 3, brickType: 'beam', x: cx - 200, y: cy, rotation: 0 };
        p.bricks.push(b1);
        const g1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        p.gears.push(g1);

        // Island 2
        const b2: BrickState = { id: uuidv4(), length: 3, brickType: 'beam', x: cx + 100, y: cy - 100, rotation: 45 };
        p.bricks.push(b2);
        const g2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Large, x: b2.x, y: b2.y, rotation: 0, connectedTo: [],
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
    description: "Two gears are stacked on the same axle (Compound). Connect the motor to the bottom one, and use the top one to drive the final gear.",
    descriptionZh: "兩個齒輪疊在同一個軸上（複合）。將馬達連接到底部齒輪，並使用頂部齒輪驅動最終齒輪。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0 };
        p.bricks.push(b1);

        // Motor
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        // Middle Stack (Axle 2)
        const axle2 = uuidv4();
        // Bottom Gear (Large)
        const gStackBottom: GearState = {
            id: uuidv4(), axleId: axle2, type: GearType.ExtraLarge, x: b1.x + (3*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        // Top Gear (Small)
        const gStackTop: GearState = {
            id: uuidv4(), axleId: axle2, type: GearType.Small, x: b1.x + (3*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        // Final Target
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + (5*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(gMotor, gStackBottom, gStackTop, gTarget);
        return p;
    },
    check: (gears: GearState[]) => {
      const last = gears[gears.length - 1]; // Target is last in preset
      if (last.rpm !== 0 && !last.isJammed) return [last.id];
      return [];
    }
  },
  {
    id: 6,
    title: "Wall Climber",
    titleZh: "攀牆者",
    description: "Build a vertical gear train up the wall to reach the flag (top gear).",
    descriptionZh: "沿著牆壁建立一個垂直齒輪系，以到達旗幟（頂部齒輪）。",
    preset: () => {
        const p = createPreset();
        // Vertical Brick Wall
        const b1: BrickState = { id: uuidv4(), length: 8, brickType: 'brick', x: cx, y: cy + 100, rotation: 270 };
        p.bricks.push(b1);

        // Motor at bottom
        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };
        
        // Target placeholder at top (user needs to reach it)
        const gTarget: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y - (7 * HOLE_SPACING), rotation: 0, connectedTo: [],
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
    description: "The motor turns Clockwise. Make the TWO output gears turn Counter-Clockwise.",
    descriptionZh: "馬達順時針旋轉。讓這兩個輸出齒輪都逆時針旋轉。",
    preset: () => {
         const p = createPreset();
         const b1: BrickState = { id: uuidv4(), length: 9, brickType: 'beam', x: cx - 120, y: cy, rotation: 0 };
         p.bricks.push(b1);

         const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 4*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
         };

         const gOut1: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
         };

         const gOut2: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x + 8*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
         };

         p.gears.push(gMotor, gOut1, gOut2);
         return p;
    },
    check: (gears: GearState[]) => {
        const motor = gears.find(g => g.isMotor);
        if (!motor) return [];
        
        // Find non-motor gears moving in OPPOSITE direction
        const correctDir = gears.filter(g => !g.isMotor && !g.isJammed && g.rpm !== 0 && g.direction !== motor.direction);
        
        if (correctDir.length >= 2) return [motor.id, ...correctDir.map(g => g.id)];
        return [];
    }
  },
  {
    id: 8,
    title: "The Titan (3000Nm)",
    titleZh: "泰坦巨人 (3000Nm)",
    description: "Final Test. The load is massive (3000Nm). The motor is standard (100Nm). You need a 30:1 gear reduction to move it.",
    descriptionZh: "最終測試。負載巨大 (3000Nm)。馬達是標準的 (100Nm)。你需要 30:1 的齒輪減速比才能移動它。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: uuidv4(), length: 15, brickType: 'beam', x: cx - 200, y: cy, rotation: 0 };
        p.bricks.push(b1);

        const gMotor: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        const gLoad: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x + 12*HOLE_SPACING, y: b1.y, rotation: 0, connectedTo: [],
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
  }
];
