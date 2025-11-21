
import { GEAR_DEFS } from '../constants';
import { GearState, GearType, Belt } from '../types';

/**
 * Generates an SVG path for a gear with Technic-style details
 */
export const generateGearPath = (teeth: number, radius: number): string => {
  const cx = 0;
  const cy = 0;
  
  // Gear parameters
  const addendum = 4; 
  const dedendum = 3;
  const outerRadius = radius + addendum; 
  const innerRadius = radius - dedendum; 
  
  let path = "";
  
  // --- 1. Gear Teeth (Outer Profile) ---
  const numTeeth = teeth;
  const angleStep = (Math.PI * 2) / numTeeth;
  
  // Tooth profile calculations
  const toothBaseHalfAngle = (angleStep * 0.55) / 2;
  const toothTipHalfAngle = (angleStep * 0.30) / 2;

  for (let i = 0; i < numTeeth; i++) {
    const centerAngle = i * angleStep;
    
    // 4 points per tooth
    const a1 = centerAngle - toothBaseHalfAngle; 
    const a2 = centerAngle - toothTipHalfAngle; 
    const a3 = centerAngle + toothTipHalfAngle; 
    const a4 = centerAngle + toothBaseHalfAngle; 
    
    const p1x = cx + innerRadius * Math.cos(a1);
    const p1y = cy + innerRadius * Math.sin(a1);
    const p2x = cx + outerRadius * Math.cos(a2);
    const p2y = cy + outerRadius * Math.sin(a2);
    const p3x = cx + outerRadius * Math.cos(a3);
    const p3y = cy + outerRadius * Math.sin(a3);
    const p4x = cx + innerRadius * Math.cos(a4);
    const p4y = cy + innerRadius * Math.sin(a4);
    
    if (i === 0) {
      path += `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y}`;
    } else {
      path += ` L ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y}`;
    }
  }
  path += " Z"; 

  // --- 2. Axle Hole (Cross Shape) ---
  const armWidth = 2; 
  const armLength = 6;
  path += ` M ${-armWidth} ${-armLength} L ${armWidth} ${-armLength} L ${armWidth} ${-armWidth} L ${armLength} ${-armWidth}`;
  path += ` L ${armLength} ${armWidth} L ${armWidth} ${armWidth} L ${armWidth} ${armLength} L ${-armWidth} ${armLength}`;
  path += ` L ${-armWidth} ${armWidth} L ${-armLength} ${armWidth} L ${-armLength} ${-armWidth} L ${-armWidth} ${-armWidth} Z`;

  // --- 3. Decorative / Weight-Saving Holes ---
  if (teeth >= 40) {
      const holeCount = 8;
      const holeDist = radius * 0.6;
      const holeRad = radius * 0.14;
      for(let k=0; k<holeCount; k++) {
          const ang = (k * Math.PI * 2) / holeCount;
          const hx = Math.cos(ang) * holeDist;
          const hy = Math.sin(ang) * holeDist;
          path += ` M ${hx + holeRad} ${hy}`;
          path += ` A ${holeRad} ${holeRad} 0 1 0 ${hx - holeRad} ${hy}`;
          path += ` A ${holeRad} ${holeRad} 0 1 0 ${hx + holeRad} ${hy} Z`;
      }
  } else if (teeth >= 24) {
      const holeCount = 4;
      const holeDist = radius * 0.55;
      const holeRad = radius * 0.18;
      for(let k=0; k<holeCount; k++) {
          const ang = (k * Math.PI * 2) / holeCount;
          const hx = Math.cos(ang) * holeDist;
          const hy = Math.sin(ang) * holeDist;
          path += ` M ${hx + holeRad} ${hy}`;
          path += ` A ${holeRad} ${holeRad} 0 1 0 ${hx - holeRad} ${hy}`;
          path += ` A ${holeRad} ${holeRad} 0 1 0 ${hx + holeRad} ${hy} Z`;
      }
  } else if (teeth >= 16) {
      const holeCount = 4;
      const holeDist = radius * 0.5;
      const holeRad = radius * 0.12;
      for(let k=0; k<holeCount; k++) {
          const ang = (k * Math.PI * 2) / holeCount + (Math.PI/4); 
          const hx = Math.cos(ang) * holeDist;
          const hy = Math.sin(ang) * holeDist;
          path += ` M ${hx + holeRad} ${hy}`;
          path += ` A ${holeRad} ${holeRad} 0 1 0 ${hx - holeRad} ${hy}`;
          path += ` A ${holeRad} ${holeRad} 0 1 0 ${hx + holeRad} ${hy} Z`;
      }
  }

  return path;
};

/**
 * Generates Trapezoidal path for Side-View Bevel Gear
 */
export const generateBevelSideProfile = (radius: number): string => {
    // Dimensions
    const bottomWidth = radius * 2;
    const topWidth = radius * 1.5;
    const height = 20; // Thickness

    const x1 = -bottomWidth / 2;
    const x2 = bottomWidth / 2;
    const x3 = topWidth / 2;
    const x4 = -topWidth / 2;

    const yBottom = height / 2;
    const yTop = -height / 2;

    // Trapezoid
    return `M ${x1} ${yBottom} L ${x2} ${yBottom} L ${x3} ${yTop} L ${x4} ${yTop} Z`;
};

/**
 * Generates an SVG path for a belt connecting two gears (external tangents)
 */
export const generateBeltPath = (
  x1: number, y1: number, r1: number, 
  x2: number, y2: number, r2: number
): string => {
  // Add padding to radius for visual belt thickness
  const R1 = r1; 
  const R2 = r2;

  const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // If circles overlap heavily, belt might look weird, but we try
  if (dist <= Math.abs(R1 - R2)) {
    return "";
  }

  // Calculate tangent offsets
  // cos(alpha) = (R1 - R2) / dist
  let arg = (R1 - R2) / dist;
  // clamp arg
  if (arg > 1) arg = 1;
  if (arg < -1) arg = -1;
  
  const alpha = Math.acos(arg);

  // Tangent points on Circle 1
  // Swapped signs to ensure Clockwise traversal for correct wrapping
  const t1_start = angle - alpha;
  const t1_end = angle + alpha;

  // Tangent points on Circle 2
  const t2_start = angle - alpha;
  const t2_end = angle + alpha;

  // Coordinates
  const p1_a_x = x1 + R1 * Math.cos(t1_start);
  const p1_a_y = y1 + R1 * Math.sin(t1_start);
  const p1_b_x = x1 + R1 * Math.cos(t1_end);
  const p1_b_y = y1 + R1 * Math.sin(t1_end);

  const p2_a_x = x2 + R2 * Math.cos(t2_start);
  const p2_a_y = y2 + R2 * Math.sin(t2_start);
  const p2_b_x = x2 + R2 * Math.cos(t2_end);
  const p2_b_y = y2 + R2 * Math.sin(t2_end);

  // Path: 
  // Start at P1_A -> Line to P2_A -> Arc around C2 to P2_B -> Line to P1_B -> Arc around C1 to P1_A
  
  return `
    M ${p1_a_x} ${p1_a_y}
    L ${p2_a_x} ${p2_a_y}
    A ${R2} ${R2} 0 1 1 ${p2_b_x} ${p2_b_y}
    L ${p1_b_x} ${p1_b_y}
    A ${R1} ${R1} 0 1 1 ${p1_a_x} ${p1_a_y}
    Z
  `;
};


export const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Simulation Engine: Propagates Speed, RPM, and Torque across gears AND BELTS.
 * Detects Jams and Stalls.
 */
export const propagatePhysics = (gears: GearState[], belts: Belt[] = []): GearState[] => {
  // 1. Reset Simulation State
  const newGears = gears.map(g => ({
    ...g,
    speed: 0,
    rpm: 0,
    torque: 0,
    direction: 1 as 1 | -1,
    isJammed: false,
    isStalled: false,
    ratio: 0
  }));

  const gearMap = new Map<string, GearState>();
  newGears.forEach(g => gearMap.set(g.id, g));

  // Group gears by Axle
  const axleMap = new Map<string, GearState[]>();
  newGears.forEach(g => {
    if (!axleMap.has(g.axleId)) {
      axleMap.set(g.axleId, []);
    }
    axleMap.get(g.axleId)!.push(g);
  });

  // 2. Identify Motor Axles
  const queue: { axleId: string, sourceSpeed: number, sourceRpm: number, sourceTorque: number, sourceDir: 1 | -1, sourceRatio: number }[] = [];
  const visitedAxles = new Set<string>();
  
  const motorConnectedAxles = new Map<string, Set<string>>(); 

  axleMap.forEach((axleGears, axleId) => {
    const motor = axleGears.find(g => g.isMotor);
    if (motor) {
      const startTorque = motor.motorTorque || 100;
      axleGears.forEach(g => {
        g.speed = motor.motorSpeed;
        g.rpm = motor.motorRpm;
        g.torque = startTorque;
        g.direction = motor.motorDirection;
        g.ratio = 1;
      });
      visitedAxles.add(axleId);
      
      const connectedSet = new Set<string>();
      connectedSet.add(axleId);
      motorConnectedAxles.set(axleId, connectedSet);

      queue.push({ 
        axleId: axleId, 
        sourceSpeed: motor.motorSpeed, 
        sourceRpm: motor.motorRpm,
        sourceTorque: startTorque,
        sourceDir: motor.motorDirection,
        sourceRatio: 1 
      });
    }
  });

  // 3. BFS Propagation (Axle to Axle)
  let head = 0;
  while(head < queue.length) {
    const { axleId, sourceSpeed, sourceRpm, sourceTorque, sourceDir, sourceRatio } = queue[head++];
    
    const currentAxleGears = axleMap.get(axleId);
    if (!currentAxleGears) continue;

    // If jammed, skip
    if (currentAxleGears.some(g => g.isJammed)) continue;

    // Find outgoing connections (Meshes AND Belts)
    for (const currentGear of currentAxleGears) {
      
      // A. Gear Meshes (Reverse Direction)
      for (const neighborId of currentGear.connectedTo) {
        const neighbor = gearMap.get(neighborId);
        if (!neighbor) continue;
        
        const neighborAxleId = neighbor.axleId;
        if (neighborAxleId === axleId) continue;

        processConnection(
          axleId, neighborAxleId, currentGear, neighbor, 
          sourceSpeed, sourceRpm, sourceTorque, sourceDir, sourceRatio,
          true, // isMesh (Reverses)
          axleMap, visitedAxles, queue, motorConnectedAxles
        );
      }

      // B. Belt Connections (Same Direction)
      const gearBelts = belts.filter(b => b.sourceId === currentGear.id || b.targetId === currentGear.id);
      for (const belt of gearBelts) {
          const neighborId = belt.sourceId === currentGear.id ? belt.targetId : belt.sourceId;
          const neighbor = gearMap.get(neighborId);
          if (!neighbor) continue;

          const neighborAxleId = neighbor.axleId;
          if (neighborAxleId === axleId) continue;

          processConnection(
            axleId, neighborAxleId, currentGear, neighbor,
            sourceSpeed, sourceRpm, sourceTorque, sourceDir, sourceRatio,
            false, // isMesh = false (SAME Direction for belts)
            axleMap, visitedAxles, queue, motorConnectedAxles
          );
      }
    }
  }

  // 4. Check for Stalls
  motorConnectedAxles.forEach((connectedAxleIds) => {
      let trainStalled = false;
      connectedAxleIds.forEach(axleId => {
          const axleGears = axleMap.get(axleId)!;
          axleGears.forEach(g => {
             if (g.rpm !== 0 && g.load > g.torque) {
                 trainStalled = true;
             }
          });
      });

      if (trainStalled) {
          connectedAxleIds.forEach(axleId => {
              const axleGears = axleMap.get(axleId)!;
              axleGears.forEach(g => {
                  g.isStalled = true;
                  g.rpm = 0; 
                  g.speed = 0;
              });
          });
      }
  });

  return newGears;
};

function processConnection(
    sourceAxleId: string, targetAxleId: string,
    sourceGear: GearState, targetGear: GearState,
    sourceSpeed: number, sourceRpm: number, sourceTorque: number, sourceDir: 1|-1, sourceRatio: number,
    isMesh: boolean,
    axleMap: Map<string, GearState[]>,
    visitedAxles: Set<string>,
    queue: any[],
    motorConnectedAxles: Map<string, Set<string>>
) {
    // Map motor groups
    motorConnectedAxles.forEach((set) => {
        if (set.has(sourceAxleId)) set.add(targetAxleId);
    });

    const defSource = GEAR_DEFS[sourceGear.type];
    const defTarget = GEAR_DEFS[targetGear.type];
    
    // Fix: Axles have 0 teeth, avoid div/0. Axles/Bevels transfer 1:1 if coupled this way
    const teethIn = defSource.teeth || 1;
    const teethOut = defTarget.teeth || 1;
    
    let speedRatio = teethIn / teethOut;
    let torqueRatio = teethOut / teethIn;
    
    // If connecting via Axle (Driveshaft coupling), enforce 1:1 ratio
    if (defSource.isAxle || defTarget.isAxle) {
        speedRatio = 1;
        torqueRatio = 1;
    }

    const targetSpeed = sourceSpeed * speedRatio;
    const targetRpm = sourceRpm * speedRatio;
    const targetTorque = sourceTorque * torqueRatio;
    // MESH reverses direction (-1), BELT maintains direction (1)
    const targetDir = (sourceDir * (isMesh ? -1 : 1)) as 1 | -1; 
    const targetRatio = sourceRatio * speedRatio;

    if (visitedAxles.has(targetAxleId)) {
        // Check for JAM
        const targetAxleGears = axleMap.get(targetAxleId)!;
        const refGear = targetAxleGears[0];
        
        if (Math.abs(refGear.rpm - targetRpm) > 0.1 || refGear.direction !== targetDir) {
            const sourceGears = axleMap.get(sourceAxleId)!;
            sourceGears.forEach(g => { g.isJammed = true; g.speed = 0; g.rpm = 0; });
            targetAxleGears.forEach(g => { g.isJammed = true; g.speed = 0; g.rpm = 0; });
        }
    } else {
        // Propagate
        const targetAxleGears = axleMap.get(targetAxleId)!;
        targetAxleGears.forEach(g => {
            g.speed = targetSpeed;
            g.rpm = targetRpm;
            g.torque = targetTorque;
            g.direction = targetDir;
            g.ratio = targetRatio;
        });
        
        visitedAxles.add(targetAxleId);
        queue.push({ 
            axleId: targetAxleId, 
            sourceSpeed: targetSpeed, 
            sourceRpm: targetRpm, 
            sourceTorque: targetTorque,
            sourceDir: targetDir,
            sourceRatio: targetRatio
        });
    }
}
