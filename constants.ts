import { BirdConfig, BirdType } from './types';

// Updated palette: Soft, earthy, distinct but not neon.
// Added imgUrl using Twemoji SVGs for cross-browser consistency.
export const BIRD_DATA: Record<BirdType, BirdConfig> = {
  [BirdType.PARROT]: { 
      id: BirdType.PARROT, 
      name: 'Parrot', 
      total: 13, smallFlock: 4, bigFlock: 6, 
      color: 'bg-emerald-500', 
      emoji: '🦜',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f99c.svg' 
  },
  [BirdType.OWL]: { 
      id: BirdType.OWL, 
      name: 'Owl', 
      total: 10, smallFlock: 3, bigFlock: 4, 
      color: 'bg-indigo-400', 
      emoji: '🦉',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f989.svg'
  },
  [BirdType.FLAMINGO]: { 
      id: BirdType.FLAMINGO, 
      name: 'Flamingo', 
      total: 7, smallFlock: 2, bigFlock: 3, 
      color: 'bg-rose-400', 
      emoji: '🦩',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f9a9.svg'
  },
  [BirdType.TOUCAN]: { 
      id: BirdType.TOUCAN, 
      name: 'Toucan', 
      total: 10, smallFlock: 3, bigFlock: 4, 
      color: 'bg-orange-400', 
      emoji: '🦤',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f9a4.svg' // Using Dodo as Toucan style
  },
  [BirdType.DUCK]: { 
      id: BirdType.DUCK, 
      name: 'Duck', 
      total: 13, smallFlock: 4, bigFlock: 6, 
      color: 'bg-amber-300', 
      emoji: '🦆',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f986.svg'
  },
  [BirdType.MAGPIE]: { 
      id: BirdType.MAGPIE, 
      name: 'Magpie', 
      total: 17, smallFlock: 6, bigFlock: 9, 
      color: 'bg-stone-500', 
      emoji: '🐧',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f427.svg' // Using Penguin as Magpie style
  },
  [BirdType.REED_WARBLER]: { 
      id: BirdType.REED_WARBLER, 
      name: 'Reed Warbler', 
      total: 20, smallFlock: 6, bigFlock: 9, 
      color: 'bg-sky-500', 
      emoji: '🐦',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f426.svg' 
  },
  [BirdType.ROBIN]: { 
      id: BirdType.ROBIN, 
      name: 'Robin', 
      total: 20, smallFlock: 6, bigFlock: 9, 
      color: 'bg-amber-700', 
      emoji: '🦅',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f985.svg' // Using Eagle for Brown/Amber bird
  },
};

export const INITIAL_HAND_SIZE = 8;
export const ROW_COUNT = 4;
export const INITIAL_ROW_CARDS = 3;