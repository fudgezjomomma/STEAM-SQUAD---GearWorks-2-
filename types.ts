
export enum GearType {
  Small = 'Small',         // 8T
  Twelve = 'Twelve',       // 12T
  Bevel12 = 'Bevel12',     // 12T Bevel
  Medium = 'Medium',       // 16T
  MediumLarge = 'MediumLarge', // 20T
  Bevel20 = 'Bevel20',     // 20T Bevel
  Large = 'Large',         // 24T
  TwentyEight = 'TwentyEight', // 28T
  ThirtySix = 'ThirtySix', // 36T
  ExtraLarge = 'ExtraLarge', // 40T
  Axle = 'Axle'            // Drive Shaft
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
  isBevel?: boolean; // Helper flag
  isAxle?: boolean; // Helper flag
}

export interface Belt {
  id: string;
  sourceId: string;
  targetId: string;
}

// flat: Standard 2D gear
// bevel_up: Bevel gear located ABOVE a flat gear (Visual: Horizontal, wide side down)
// bevel_right: Bevel gear located RIGHT of a flat gear (Visual: Vertical, wide side left)
// bevel_down: Bevel gear located BELOW a flat gear (Visual: Horizontal, wide side up)
// bevel_left: Bevel gear located LEFT of a flat gear (Visual: Vertical, wide side right)
export type GearOrientation = 'flat' | 'bevel_up' | 'bevel_right' | 'bevel_down' | 'bevel_left';

export interface GearState {
  id: string;
  axleId: string; // Group ID for compound gears. Gears with same axleId rotate together.
  type: GearType;
  length?: number; // For Axles only (in hole units)
  x: number;
  y: number;
  rotation: number; // Current rotation (Z-axis for Gears; Orientation for Axles)
  step?: number;    // Animation phase (0-360) for Axles (Visual spin)
  fixed?: boolean; // Cannot be moved or deleted
  
  // Bevel Logic
  orientation?: GearOrientation; // Default is flat

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
  fixed?: boolean; // Cannot be moved or deleted
  isObstacle?: boolean; // Cannot be mounted on or passed through
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

export interface LessonStep {
  targetId?: string; // DOM ID to highlight.
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface Lesson {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  preset: () => ChallengePreset;
  steps: LessonStep[];
}
