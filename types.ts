
export enum GearType {
  Small = 'Small',         // 8T
  Twelve = 'Twelve',       // 12T
  Medium = 'Medium',       // 16T
  MediumLarge = 'MediumLarge', // 20T
  Large = 'Large',         // 24T
  TwentyEight = 'TwentyEight', // 28T
  ThirtySix = 'ThirtySix', // 36T
  ExtraLarge = 'ExtraLarge' // 40T
}

export interface GearDef {
  type: GearType;
  teeth: number;
  radius: number; // Visual radius in pixels
  colors: {
    dark: string;
    light: string;
    steam: string;
  };
}

export interface Belt {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface GearState {
  id: string;
  axleId: string; // Group ID for compound gears. Gears with same axleId rotate together.
  type: GearType;
  x: number;
  y: number;
  rotation: number; // Current rotation in degrees
  
  // connectivity logic
  connectedTo: string[]; // IDs of connected gears
  
  // motor logic
  isMotor: boolean;
  motorSpeed: number; // Legacy relative speed multiplier
  motorRpm: number;   // Target RPM for motor
  motorTorque: number; // Input torque (Nm)
  motorDirection: 1 | -1; // 1 = CW, -1 = CCW
  
  // resistance logic
  load: number; // Load/Resistance applied to this gear (Nm)

  // computed simulation state
  ratio: number; // Speed multiplier relative to the driving motor
  rpm: number;   // Calculated Angular Velocity
  torque: number; // Calculated Torque (Nm)
  direction: 1 | -1; // Current rotation direction
  speed: number; // Actual computed speed (0 if not connected to motor)
  isJammed: boolean; // If the gear is part of a locked loop
  isStalled: boolean; // If torque < load, the gear stalls
}

export interface BrickState {
  id: string;
  length: number; // Number of holes
  brickType: 'beam' | 'brick'; // beam = studless (rounded), brick = studded (rectangular)
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
}

export interface DragItem {
  type: GearType;
  offsetX: number;
  offsetY: number;
}

export interface ChallengePreset {
    gears: GearState[];
    bricks: BrickState[];
    belts: Belt[];
}

export interface Challenge {
  id: number;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  preset?: () => ChallengePreset; // Optional function to generate initial state
  check: (gears: GearState[]) => string[]; 
}
