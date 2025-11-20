import { Challenge, GearState } from '../types';

export const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: "Speed Up (2x)",
    titleZh: "加速 (2倍)",
    description: "Make a gear spin exactly twice as fast as the Motor gear.",
    descriptionZh: "讓一個齒輪的轉速剛好是馬達齒輪的兩倍。",
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];
      
      const targets = gears.filter(g => 
        !g.isMotor && 
        !g.isJammed && 
        Math.abs(g.ratio) === 2.0
      );
      
      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
  },
  {
    id: 2,
    title: "Direction Reversal",
    titleZh: "反向旋轉",
    description: "Make the final gear spin in the opposite direction of the Motor.",
    descriptionZh: "讓最後一個齒輪與馬達反方向旋轉。",
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];

      const targets = gears.filter(g => 
        !g.isMotor && 
        !g.isJammed && 
        g.speed !== 0 &&
        g.direction !== motor.direction
      );

      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
  },
  {
    id: 3,
    title: "The Long Chain",
    titleZh: "長鏈傳動",
    description: "Build a chain with at least 3 direction changes (4 connected gears).",
    descriptionZh: "建立一個至少有3次方向改變的齒輪鏈（4個相連齒輪）。",
    check: (gears: GearState[]) => {
      const moving = gears.filter(g => g.speed !== 0 && !g.isJammed);
      if (moving.length >= 4) return moving.map(g => g.id);
      return [];
    }
  },
  {
    id: 4,
    title: "Gearing Down (0.5x)",
    titleZh: "減速 (0.5倍)",
    description: "Make a gear spin at half (0.5x) the speed of the Motor.",
    descriptionZh: "讓一個齒輪的轉速是馬達的一半 (0.5倍)。",
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];
      
      const targets = gears.filter(g => 
        !g.isMotor && 
        !g.isJammed && 
        Math.abs(g.ratio) === 0.5
      );
      
      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
  },
  {
    id: 5,
    title: "Same Direction",
    titleZh: "同向旋轉",
    description: "Make an output gear spin the SAME direction as the Motor (requires an idler).",
    descriptionZh: "讓輸出齒輪與馬達同方向旋轉（需要惰輪）。",
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];

      const targets = gears.filter(g => 
        !g.isMotor && 
        !g.isJammed && 
        g.speed !== 0 &&
        g.direction === motor.direction
      );

      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
  },
  {
    id: 6,
    title: "Exact Ratio (2.5x)",
    titleZh: "精確比例 (2.5倍)",
    description: "Create a gear ratio of exactly 2.5x. (Hint: 40T driving 16T).",
    descriptionZh: "創造剛好 2.5倍 的齒輪比。（提示：40齒 驅動 16齒）。",
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];
      
      const targets = gears.filter(g => 
        !g.isMotor && 
        !g.isJammed && 
        Math.abs(g.ratio) === 2.5
      );
      
      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
  },
  {
    id: 7,
    title: "High Speed (>4x)",
    titleZh: "高速旋轉 (>4倍)",
    description: "Make a gear spin more than 4 times faster than the motor.",
    descriptionZh: "讓一個齒輪的轉速比馬達快 4 倍以上。",
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];
      
      const targets = gears.filter(g => 
        !g.isMotor && 
        !g.isJammed && 
        Math.abs(g.ratio) > 4
      );
      
      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
  },
  {
    id: 8,
    title: "The Crawler (<0.3x)",
    titleZh: "龜速爬行 (<0.3倍)",
    description: "Make a gear spin very slowly (less than 0.3x motor speed).",
    descriptionZh: "讓一個齒輪轉得非常慢（低於馬達速度的 0.3倍）。",
    check: (gears: GearState[]) => {
      const motor = gears.find(g => g.isMotor);
      if (!motor) return [];
      
      const targets = gears.filter(g => 
        !g.isMotor && 
        !g.isJammed && 
        Math.abs(g.speed) > 0 && 
        Math.abs(g.ratio) < 0.3
      );
      
      if (targets.length > 0) return [motor.id, ...targets.map(t => t.id)];
      return [];
    }
  },
  {
    id: 9,
    title: "The Jam",
    titleZh: "卡死測試",
    description: "Create a mechanical jam (locked loop) where gears cannot move.",
    descriptionZh: "製造機械卡死（鎖死的迴圈），讓齒輪無法移動。",
    check: (gears: GearState[]) => {
      const jammed = gears.filter(g => g.isJammed);
      if (jammed.length > 0) return jammed.map(g => g.id);
      return [];
    }
  },
  {
    id: 10,
    title: "Split Outputs",
    titleZh: "分流輸出",
    description: "Have one gear spinning faster (>1x) and one slower (<1x) at the same time.",
    descriptionZh: "讓一個齒輪轉得較快 (>1倍)，同時另一個轉得較慢 (<1倍)。",
    check: (gears: GearState[]) => {
       const fast = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio) > 1);
       const slow = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.speed) > 0 && Math.abs(g.ratio) < 1);
       
       if (fast.length > 0 && slow.length > 0) {
         return [...fast.map(g => g.id), ...slow.map(g => g.id)];
       }
       return [];
    }
  },
  // --- NEW COMPOUND & ADVANCED MISSIONS ---
  {
    id: 11,
    title: "Compound Basics",
    titleZh: "複合齒輪基礎",
    description: "Create a Compound Axle by stacking two gears on top of each other.",
    descriptionZh: "透過將兩個齒輪疊在同一個軸上來建立複合軸。",
    check: (gears: GearState[]) => {
      // Look for an axle with more than 1 gear
      const axleCounts = new Map<string, number>();
      gears.forEach(g => {
        axleCounts.set(g.axleId, (axleCounts.get(g.axleId) || 0) + 1);
      });
      
      for (const [axleId, count] of axleCounts.entries()) {
        if (count >= 2) {
           const axleGears = gears.filter(g => g.axleId === axleId);
           // Ensure it's active
           if (axleGears[0].rpm !== 0) return axleGears.map(g => g.id);
        }
      }
      return [];
    }
  },
  {
    id: 12,
    title: "Turbo Boost (25x)",
    titleZh: "渦輪加速 (25倍)",
    description: "Achieve a massive 25x speed increase using compound gears (Hint: Two 5x stages).",
    descriptionZh: "使用複合齒輪達成 25倍 的巨大增速。（提示：兩個 5倍 階段）。",
    check: (gears: GearState[]) => {
      const targets = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio - 25) < 0.1);
      if (targets.length > 0) return targets.map(t => t.id);
      return [];
    }
  },
  {
    id: 13,
    title: "Super Slow (0.04x)",
    titleZh: "超級慢動作 (0.04倍)",
    description: "Reduce speed to 0.04x (1/25th) of the motor speed.",
    descriptionZh: "將速度降低到馬達速度的 0.04倍 (1/25)。",
    check: (gears: GearState[]) => {
      const targets = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio - 0.04) < 0.001);
      if (targets.length > 0) return targets.map(t => t.id);
      return [];
    }
  },
  {
    id: 14,
    title: "Precision: 10x",
    titleZh: "精確度：10倍",
    description: "Build a gear train with an exact ratio of 10x (Hint: Combine a 5x and a 2x stage).",
    descriptionZh: "建立一個剛好 10倍 的齒輪系。（提示：結合一個 5倍 和一個 2倍 的階段）。",
    check: (gears: GearState[]) => {
      const targets = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio - 10.0) < 0.1);
      if (targets.length > 0) return targets.map(t => t.id);
      return [];
    }
  },
  {
    id: 15,
    title: "Warp Speed (>16x)",
    titleZh: "曲速引擎 (>16倍)",
    description: "Spin a gear faster than 16x the motor speed.",
    descriptionZh: "讓齒輪轉速比馬達快 16 倍以上。",
    check: (gears: GearState[]) => {
      const targets = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio) > 16);
      if (targets.length > 0) return targets.map(t => t.id);
      return [];
    }
  },
  {
    id: 16,
    title: "Glacial Pace (<0.02x)",
    titleZh: "冰河移動 (<0.02倍)",
    description: "Spin a gear slower than 0.02x the motor speed.",
    descriptionZh: "讓齒輪轉速低於馬達速度的 0.02 倍。",
    check: (gears: GearState[]) => {
      const targets = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio) < 0.02 && Math.abs(g.ratio) > 0);
      if (targets.length > 0) return targets.map(t => t.id);
      return [];
    }
  },
  {
    id: 17,
    title: "Triple Compound",
    titleZh: "三重複合",
    description: "Chain 3 separate compound axles together in a row.",
    descriptionZh: "將 3 個獨立的複合軸串連在一起。",
    check: (gears: GearState[]) => {
       // Check for 3 moving compound axles
       const compoundAxles = new Set<string>();
       const axleCounts = new Map<string, number>();
       gears.forEach(g => axleCounts.set(g.axleId, (axleCounts.get(g.axleId) || 0) + 1));
       
       gears.forEach(g => {
          if (!g.isJammed && g.rpm !== 0 && (axleCounts.get(g.axleId) || 0) >= 2) {
            compoundAxles.add(g.axleId);
          }
       });
       
       if (compoundAxles.size >= 3) {
         return gears.filter(g => compoundAxles.has(g.axleId)).map(g => g.id);
       }
       return [];
    }
  },
  {
    id: 18,
    title: "Split Personality",
    titleZh: "雙重性格",
    description: "Have one output spinning >4x and another spinning <0.25x at the same time.",
    descriptionZh: "同時擁有一個轉速 >4倍 的輸出和一個轉速 <0.25倍 的輸出。",
    check: (gears: GearState[]) => {
       const fast = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio) > 4);
       const slow = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio) < 0.25 && g.rpm !== 0);
       
       if (fast.length > 0 && slow.length > 0) {
         return [...fast.map(g => g.id), ...slow.map(g => g.id)];
       }
       return [];
    }
  },
  {
    id: 19,
    title: "Odd Ratio (3.75x)",
    titleZh: "特殊比例 (3.75倍)",
    description: "Achieve a ratio of exactly 3.75x (Hint: 2.5 * 1.5).",
    descriptionZh: "達成剛好 3.75倍 的比例。（提示：2.5 * 1.5）。",
    check: (gears: GearState[]) => {
      const targets = gears.filter(g => !g.isMotor && !g.isJammed && Math.abs(g.ratio - 3.75) < 0.01);
      if (targets.length > 0) return targets.map(t => t.id);
      return [];
    }
  },
  {
    id: 20,
    title: "The Grandmaster",
    titleZh: "齒輪大師",
    description: "Build a massive machine with at least 15 moving gears.",
    descriptionZh: "建造一個至少有 15 個移動齒輪的巨大機器。",
    check: (gears: GearState[]) => {
      const moving = gears.filter(g => g.rpm !== 0 && !g.isJammed);
      if (moving.length >= 15) return moving.map(g => g.id);
      return [];
    }
  },
  // --- NEW TORQUE & LOAD CHALLENGES ---
  {
    id: 21,
    title: "Leverage (250Nm)",
    titleZh: "槓桿原理 (250Nm)",
    description: "Set a gear's Load to 250Nm and make sure it keeps spinning (not stalled).",
    descriptionZh: "將齒輪的負載(Load)設為 250Nm，並確保它繼續旋轉（不卡死）。",
    check: (gears: GearState[]) => {
      // Check for a gear that has high load, is moving, and not stalled
      const successfulLoad = gears.find(g => !g.isMotor && g.load >= 250 && !g.isStalled && g.rpm !== 0);
      if (successfulLoad) return [successfulLoad.id];
      return [];
    }
  },
  {
    id: 22,
    title: "Industrial Lift (1000Nm)",
    titleZh: "工業升降機 (1000Nm)",
    description: "Lift a heavy load! Set a gear's Load to 1000Nm and keep it spinning. (Requires ~10x torque).",
    descriptionZh: "舉起重物！將齒輪負載設為 1000Nm 並保持旋轉。（需要約 10倍 扭力）。",
    check: (gears: GearState[]) => {
      const successfulLoad = gears.find(g => !g.isMotor && g.load >= 1000 && !g.isStalled && g.rpm !== 0);
      if (successfulLoad) return [successfulLoad.id];
      return [];
    }
  },
  {
    id: 23,
    title: "The Sweet Spot",
    titleZh: "最佳平衡",
    description: "Move a 400Nm Load, but keep the speed above 0.15x (Don't make it too slow!).",
    descriptionZh: "移動 400Nm 的負載，但保持速度在 0.15倍 以上（不要太慢！）。",
    check: (gears: GearState[]) => {
      const target = gears.find(g => 
        !g.isMotor && 
        g.load >= 400 && 
        !g.isStalled && 
        g.rpm !== 0 && 
        Math.abs(g.ratio) >= 0.15
      );
      if (target) return [target.id];
      return [];
    }
  },
  {
    id: 24,
    title: "Compound Strength",
    titleZh: "複合力量",
    description: "Use compound gears to move a massive 1500Nm Load.",
    descriptionZh: "使用複合齒輪來移動 1500Nm 的巨大負載。",
    check: (gears: GearState[]) => {
      const successfulLoad = gears.find(g => !g.isMotor && g.load >= 1500 && !g.isStalled && g.rpm !== 0);
      if (successfulLoad) return [successfulLoad.id];
      return [];
    }
  },
  {
    id: 25,
    title: "The Titan (3000Nm)",
    titleZh: "泰坦巨人 (3000Nm)",
    description: "The ultimate test. Move a 3000Nm Load without stalling the motor.",
    descriptionZh: "終極測試。移動 3000Nm 的負載而不讓馬達卡死。",
    check: (gears: GearState[]) => {
      const successfulLoad = gears.find(g => !g.isMotor && g.load >= 3000 && !g.isStalled && g.rpm !== 0);
      if (successfulLoad) return [successfulLoad.id];
      return [];
    }
  }
];
