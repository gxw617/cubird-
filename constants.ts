import { BirdConfig, BirdType } from './types';

export const BIRD_DATA: Record<BirdType, BirdConfig> = {
  [BirdType.PARROT]: { id: BirdType.PARROT, name: 'Parrot', total: 13, smallFlock: 4, bigFlock: 6, color: 'bg-green-500', emoji: '🦜' },
  [BirdType.OWL]: { id: BirdType.OWL, name: 'Owl', total: 10, smallFlock: 3, bigFlock: 4, color: 'bg-indigo-600', emoji: '🦉' },
  [BirdType.FLAMINGO]: { id: BirdType.FLAMINGO, name: 'Flamingo', total: 7, smallFlock: 2, bigFlock: 3, color: 'bg-pink-500', emoji: '🦩' },
  [BirdType.TOUCAN]: { id: BirdType.TOUCAN, name: 'Toucan', total: 10, smallFlock: 3, bigFlock: 4, color: 'bg-orange-500', emoji: '🦤' }, // Dodo used as Toucan proxy or similar
  [BirdType.DUCK]: { id: BirdType.DUCK, name: 'Duck', total: 13, smallFlock: 4, bigFlock: 6, color: 'bg-yellow-400', emoji: '🦆' },
  [BirdType.MAGPIE]: { id: BirdType.MAGPIE, name: 'Magpie', total: 17, smallFlock: 6, bigFlock: 9, color: 'bg-slate-700', emoji: '🐧' }, // Penguin/Magpie
  [BirdType.REED_WARBLER]: { id: BirdType.REED_WARBLER, name: 'Reed Warbler', total: 20, smallFlock: 6, bigFlock: 9, color: 'bg-blue-500', emoji: '🐦' },
  [BirdType.ROBIN]: { id: BirdType.ROBIN, name: 'Robin', total: 20, smallFlock: 6, bigFlock: 9, color: 'bg-red-500', emoji: '🐦‍🔥' },
};

export const INITIAL_HAND_SIZE = 8;
export const ROW_COUNT = 4;
export const INITIAL_ROW_CARDS = 3;