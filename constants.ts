
import { GearType, GearDef } from './types';

// Scaling factor: 2.5 pixels per tooth roughly gives good screen sizes
export const MODULE_SCALE = 2.5; 

// Based on 8T (20px radius) + 8T (20px radius) = 40px center-to-center distance.
// This becomes our standard "Stud" unit.
export const HOLE_SPACING = 40; 
export const BRICK_WIDTH = 34; // Slightly narrower than spacing for visual gap
export const BRICK_CORNER_RADIUS = 17;

// Technic Sizes
export const BEAM_SIZES = [3, 5, 7, 9, 11, 13, 15]; // Odd numbers (Studless)
export const BRICK_SIZES = [2, 4, 6, 8, 10, 12, 16]; // Even numbers (Studded)

// Theme Palettes
export const GEAR_DEFS: Record<GearType, GearDef> = {
  [GearType.Small]: {
    type: GearType.Small,
    teeth: 8,
    radius: 8 * MODULE_SCALE, 
    colors: {
        dark: '#94A3B8',  // Slate-400
        light: '#EF4444', // Red-500
        steam: '#fecc00'  // Brand Yellow
    }
  },
  [GearType.Twelve]: {
    type: GearType.Twelve,
    teeth: 12,
    radius: 12 * MODULE_SCALE,
    colors: {
        dark: '#67E8F9',  // Cyan-300
        light: '#F97316', // Orange-500
        steam: '#F4F4F5'  // Zinc-100
    }
  },
  [GearType.Medium]: {
    type: GearType.Medium,
    teeth: 16,
    radius: 16 * MODULE_SCALE,
    colors: {
        dark: '#2DD4BF',  // Teal-400
        light: '#84CC16', // Lime-500
        steam: '#E4E4E7'  // Zinc-200
    }
  },
  [GearType.MediumLarge]: {
    type: GearType.MediumLarge,
    teeth: 20,
    radius: 20 * MODULE_SCALE,
    colors: {
        dark: '#22D3EE',  // Cyan-400
        light: '#10B981', // Emerald-500
        steam: '#D4D4D8'  // Zinc-300
    }
  },
  [GearType.Large]: {
    type: GearType.Large,
    teeth: 24,
    radius: 24 * MODULE_SCALE,
    colors: {
        dark: '#38BDF8',  // Sky-400
        light: '#06B6D4', // Cyan-500
        steam: '#A1A1AA'  // Zinc-400
    }
  },
  [GearType.TwentyEight]: {
    type: GearType.TwentyEight,
    teeth: 28,
    radius: 28 * MODULE_SCALE,
    colors: {
        dark: '#60A5FA',  // Blue-400
        light: '#3B82F6', // Blue-500
        steam: '#71717A'  // Zinc-500
    }
  },
  [GearType.ThirtySix]: {
    type: GearType.ThirtySix,
    teeth: 36,
    radius: 36 * MODULE_SCALE,
    colors: {
        dark: '#818CF8',  // Indigo-400
        light: '#8B5CF6', // Violet-500
        steam: '#52525B'  // Zinc-600
    }
  },
  [GearType.ExtraLarge]: {
    type: GearType.ExtraLarge,
    teeth: 40,
    radius: 40 * MODULE_SCALE,
    colors: {
        dark: '#A78BFA',  // Violet-400
        light: '#D946EF', // Fuchsia-500
        steam: '#fecc00'  // Brand Yellow (Bookend with small gear)
    }
  }
};

export const SNAP_THRESHOLD = 20; // pixels
export const BASE_SPEED_MULTIPLIER = 0.5; // Base rotation speed deg/frame