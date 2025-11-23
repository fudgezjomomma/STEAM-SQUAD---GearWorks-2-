import { GearState, BrickState, Belt } from '../../types';

export const cx = 500;
export const cy = 350;

export const createPreset = (): { gears: GearState[], bricks: BrickState[], belts: Belt[] } => ({
    gears: [],
    bricks: [],
    belts: []
});