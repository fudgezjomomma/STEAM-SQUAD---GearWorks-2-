
import { Lesson, GearState, BrickState, Belt, GearType } from '../types';
import { HOLE_SPACING } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const createPreset = (): { gears: GearState[], bricks: BrickState[], belts: Belt[] } => ({
    gears: [],
    bricks: [],
    belts: []
});

const cx = 500;
const cy = 350;

export const LESSONS: Lesson[] = [
  {
    id: 'l1',
    title: "Mechanics 101: Ratios",
    titleZh: "機械基礎 101: 齒輪比",
    description: "Learn about Driver gears, Driven gears, and how size affects speed.",
    descriptionZh: "學習主動齒輪、被動齒輪以及尺寸如何影響速度。",
    preset: () => {
        const p = createPreset();
        // Beam
        const b1: BrickState = { id: 'l1-beam', length: 9, brickType: 'beam', x: cx - 100, y: cy, rotation: 0 };
        p.bricks.push(b1);

        // Driver (Small - 8T)
        const gDriver: GearState = {
            id: 'l1-driver', axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        // Driven (ExtraLarge - 40T)
        // 8T (20px) + 40T (100px) = 120px distance = 3 * 40px (HOLE_SPACING)
        const gDriven: GearState = {
            id: 'l1-driven', axleId: uuidv4(), type: GearType.ExtraLarge, x: b1.x + (3 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gDriver, gDriven);
        return p;
    },
    steps: [
        {
            title: "Welcome to Class!",
            titleZh: "歡迎上課！",
            description: "In this lesson, we will explore the relationship between gear size and speed.",
            descriptionZh: "在本課程中，我們將探討齒輪尺寸與速度之間的關係。",
            position: 'center'
        },
        {
            targetId: 'l1-driver',
            title: "The Driver Gear",
            titleZh: "主動齒輪 (Driver)",
            description: "This red gear is attached to the motor. We call it the **Driver**. It provides the power to the system.",
            descriptionZh: "這個紅色齒輪連接到馬達。我們稱之為 **主動齒輪**。它為系統提供動力。",
            position: 'top'
        },
        {
            targetId: 'l1-driven',
            title: "The Driven Gear",
            titleZh: "被動齒輪 (Driven)",
            description: "This large gear is moved by the driver. We call it the **Driven** gear.",
            descriptionZh: "這個大齒輪由主動齒輪帶動。我們稱之為 **被動齒輪**。",
            position: 'top'
        },
        {
            targetId: 'l1-driven',
            title: "Gear Reduction",
            titleZh: "減速比",
            description: "Notice how slow the big gear spins? Because it has **5x more teeth** (40T) than the small gear (8T), it spins **5x slower**. This is a 5:1 Gear Reduction.",
            descriptionZh: "注意到大齒輪轉得有多慢嗎？因為它的 **齒數是小齒輪的 5 倍** (40T vs 8T)，所以它的轉速慢了 5 倍。這就是 5:1 的減速比。",
            position: 'bottom'
        }
    ]
  },
  {
    id: 'l2',
    title: "Mechanics 102: Idlers",
    titleZh: "機械基礎 102: 惰輪",
    description: "What happens when you put a gear in the middle? Does it change the speed?",
    descriptionZh: "如果在中間放一個齒輪會發生什麼事？它會改變速度嗎？",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: 'l2-beam', length: 9, brickType: 'beam', x: cx - 120, y: cy, rotation: 0 };
        p.bricks.push(b1);

        // Driver (Large 24T)
        const gDriver: GearState = {
            id: 'l2-driver', axleId: uuidv4(), type: GearType.Large, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        // Idler (Small 8T)
        // 24T (60px) + 8T (20px) = 80px = 2 holes
        const gIdler: GearState = {
            id: 'l2-idler', axleId: uuidv4(), type: GearType.Small, x: b1.x + (2 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        // Driven (Large 24T)
        // 8T (20px) + 24T (60px) = 80px = 2 more holes (Total 4)
        const gDriven: GearState = {
            id: 'l2-driven', axleId: uuidv4(), type: GearType.Large, x: b1.x + (4 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gDriver, gIdler, gDriven);
        return p;
    },
    steps: [
        {
            targetId: 'l2-idler',
            title: "The Idler Gear",
            titleZh: "惰輪 (Idler)",
            description: "The small gear in the middle is called an **Idler**. It connects two gears that are far apart.",
            descriptionZh: "中間的小齒輪稱為 **惰輪**。它連接了兩個分開較遠的齒輪。",
            position: 'top'
        },
        {
            targetId: 'l2-driven',
            title: "Same Speed",
            titleZh: "速度不變",
            description: "Look at the Output gear on the right. It spins at the **same speed** as the Driver on the left. The Idler's size DOES NOT affect the final ratio!",
            descriptionZh: "看看右邊的輸出齒輪。它的轉速與左邊的主動齒輪 **相同**。惰輪的大小 **不會** 影響最終的齒輪比！",
            position: 'bottom'
        },
        {
            title: "Same Direction",
            titleZh: "方向相同",
            description: "Normally, two connected gears spin in opposite directions. But with an Idler in the middle, the first and last gear spin in the **SAME** direction.",
            descriptionZh: "通常，兩個相連的齒輪旋轉方向相反。但在中間加入惰輪後，第一個和最後一個齒輪會以 **相同** 的方向旋轉。",
            position: 'center'
        }
    ]
  },
  {
    id: 'l3',
    title: "Mechanics 103: Torque",
    titleZh: "機械基礎 103: 扭力",
    description: "Speed vs Power. Why do we use gears to lift heavy things?",
    descriptionZh: "速度與力量。為什麼我們使用齒輪來舉起重物？",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: 'l3-beam', length: 7, brickType: 'beam', x: cx - 100, y: cy, rotation: 0 };
        p.bricks.push(b1);

        // Driver (Small 8T)
        const gDriver: GearState = {
            id: 'l3-driver', axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 2, motorRpm: 120, motorTorque: 50, motorDirection: 1, load: 0,
            ratio: 1, rpm: 120, torque: 50, direction: 1, speed: 2, isJammed: false, isStalled: false
        };

        // Driven (Large 24T)
        // 8T (20px) + 24T (60px) = 80px = 2 holes
        const gDriven: GearState = {
            id: 'l3-driven', axleId: uuidv4(), type: GearType.Large, x: b1.x + (2 * HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, 
            load: 120, // High load
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        
        p.gears.push(gDriver, gDriven);
        return p;
    },
    steps: [
        {
            targetId: 'l3-driver',
            title: "Fast but Weak",
            titleZh: "快但無力",
            description: "Our motor is spinning fast (120 RPM), but it only has 50Nm of torque. It's like a small fan motor.",
            descriptionZh: "我們的馬達轉得很快 (120 RPM)，但只有 50Nm 的扭力。就像一個小風扇馬達。",
            position: 'top'
        },
        {
            targetId: 'l3-driven',
            title: "Slow but Strong",
            titleZh: "慢但強壯",
            description: "We connected it to a gear 3x larger. This reduces speed by 3x, but **Multiplies Torque by 3x**! We now have 150Nm of power here, enough to lift the heavy load.",
            descriptionZh: "我們將它連接到一個 3 倍大的齒輪。這使速度降低了 3 倍，但 **將扭力放大了 3 倍**！現在我們這裡有 150Nm 的力量，足以舉起重負載。",
            position: 'bottom'
        },
        {
            title: "The Trade-off",
            titleZh: "權衡",
            description: "You can't have both. To get more Torque (Strength), you must sacrifice RPM (Speed).",
            descriptionZh: "魚與熊掌不可兼得。要獲得更大的扭力（力量），你必須犧牲 RPM（速度）。",
            position: 'center'
        }
    ]
  },
  {
    id: 'l4',
    title: "Mechanics 104: Compound Gears",
    titleZh: "機械基礎 104: 複合齒輪",
    description: "How to multiply your power exponentially using stacked gears.",
    descriptionZh: "如何使用堆疊齒輪指數級地增加你的力量。",
    preset: () => {
        const p = createPreset();
        const b1: BrickState = { id: 'l4-beam', length: 11, brickType: 'beam', x: cx - 150, y: cy, rotation: 0 };
        p.bricks.push(b1);

        // Stage 1: Motor (Small 8T)
        const gMotor: GearState = {
            id: 'l4-motor', axleId: uuidv4(), type: GearType.Small, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 4, motorRpm: 240, motorTorque: 50, motorDirection: 1, load: 0,
            ratio: 1, rpm: 240, torque: 50, direction: 1, speed: 4, isJammed: false, isStalled: false
        };

        // Stage 2: Compound (Large 24T Input + Small 8T Output)
        // Distance 8+24 = 2 holes (80px)
        const axle2 = uuidv4();
        const gStage2In: GearState = {
            id: 'l4-s2-in', axleId: axle2, type: GearType.Large, x: b1.x + (2*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        const gStage2Out: GearState = {
            id: 'l4-s2-out', axleId: axle2, type: GearType.Small, x: b1.x + (2*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        // Stage 3: Final Output (Large 24T)
        // Distance 8+24 = 2 holes (80px) from stage 2
        const gFinal: GearState = {
            id: 'l4-final', axleId: uuidv4(), type: GearType.Large, x: b1.x + (4*HOLE_SPACING), y: b1.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(gMotor, gStage2In, gStage2Out, gFinal);
        return p;
    },
    steps: [
        {
            title: "Compound Gearing",
            titleZh: "複合齒輪",
            description: "Sometimes you need a huge gear ratio (like 9:1 or 27:1) but don't have room for giant gears. We use **Compound Gears**.",
            descriptionZh: "有時你需要巨大的齒輪比（如 9:1 或 27:1），但沒有空間容納巨大的齒輪。這時我們使用 **複合齒輪**。",
            position: 'center'
        },
        {
            targetId: 'l4-s2-out', // Target the stacked group
            title: "The Stack",
            titleZh: "堆疊",
            description: "Here, a Large gear and a Small gear share the same axle. They spin at the same speed.",
            descriptionZh: "在這裡，一個大齒輪和一個小齒輪共用同一個軸。它們以相同的速度旋轉。",
            position: 'top'
        },
        {
            targetId: 'l4-final',
            title: "Multiplication",
            titleZh: "乘法效應",
            description: "Stage 1 reduces speed by 3x. Stage 2 reduces it by another 3x. Total reduction is 3 × 3 = **9x**! The torque is multiplied by 9.",
            descriptionZh: "第一階段將速度降低了 3 倍。第二階段又降低了 3 倍。總減速比是 3 × 3 = **9倍**！扭力也放大了 9 倍。",
            position: 'bottom'
        }
    ]
  },
  {
    id: 'l5',
    title: "Mechanics 105: Belts",
    titleZh: "機械基礎 105: 皮帶",
    description: "Transfer power over long distances without gear teeth.",
    descriptionZh: "在沒有齒輪齒的情況下長距離傳輸動力。",
    preset: () => {
        const p = createPreset();
        
        // Left Island
        const b1: BrickState = { id: 'l5-b1', length: 3, brickType: 'beam', x: cx - 150, y: cy, rotation: 0 };
        p.bricks.push(b1);
        const gMotor: GearState = {
            id: 'l5-motor', axleId: uuidv4(), type: GearType.Large, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
            isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false
        };

        // Right Island
        const b2: BrickState = { id: 'l5-b2', length: 3, brickType: 'beam', x: cx + 150, y: cy, rotation: 0 };
        p.bricks.push(b2);
        const gTarget: GearState = {
            id: 'l5-target', axleId: uuidv4(), type: GearType.Large, x: b2.x, y: b2.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        p.gears.push(gMotor, gTarget);
        p.belts.push({ id: uuidv4(), sourceId: gMotor.id, targetId: gTarget.id });

        return p;
    },
    steps: [
        {
            title: "Belt Drives",
            titleZh: "皮帶驅動",
            description: "Belts allow you to connect gears that are far apart, or on different structures.",
            descriptionZh: "皮帶允許你連接相距很遠或位於不同結構上的齒輪。",
            position: 'center'
        },
        {
            targetId: 'l5-target',
            title: "Same Direction",
            titleZh: "方向相同",
            description: "Unlike meshed gears which reverse direction, a belt drive turns the output gear in the **SAME** direction as the input.",
            descriptionZh: "與反轉方向的嚙合齒輪不同，皮帶驅動使輸出齒輪與輸入齒輪以 **相同** 的方向旋轉。",
            position: 'bottom'
        },
        {
            title: "Slip Protection",
            titleZh: "打滑保護",
            description: "In real life, if the load is too high, a belt might slip instead of breaking the motor. It's a safety feature!",
            descriptionZh: "在現實生活中，如果負載過高，皮帶可能會打滑而不是損壞馬達。這是一個安全功能！",
            position: 'center'
        }
    ]
  }
];
