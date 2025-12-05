import { BirdConfig, BirdType } from './types';

// PLEASE ENSURE YOUR IMAGE IS SAVED AS 'birds.jpg' IN THE PUBLIC FOLDER
export const BIRD_SPRITE_URL = '/birds.jpg';

// The image is a 2-column x 4-row grid.
// We use background-size: 200% 400%
// Positions: x% y%
// Col 1: 0%, Col 2: 100%
// Row 1: 0%, Row 2: 33.333%, Row 3: 66.666%, Row 4: 100%

export const BIRD_DATA: Record<BirdType, BirdConfig> = {
  [BirdType.SPARROW]: { 
      id: BirdType.SPARROW, 
      name: 'Sparrow', cnName: '麻雀',
      total: 20, smallFlock: 6, bigFlock: 9, 
      color: 'bg-stone-300', // Beige
      emoji: '🐦', imgUrl: '', 
      spritePos: '0% 0%' // Row 1 Col 1
  },
  [BirdType.SWALLOW]: { 
      id: BirdType.SWALLOW, 
      name: 'Swallow', cnName: '家燕',
      total: 20, smallFlock: 6, bigFlock: 9, 
      color: 'bg-blue-300', // Blue
      emoji: '🦅', imgUrl: '', 
      spritePos: '100% 0%' // Row 1 Col 2
  },
  [BirdType.TIT_WARBLER]: { 
      id: BirdType.TIT_WARBLER, 
      name: 'Tit-warbler', cnName: '花彩雀莺',
      total: 17, smallFlock: 5, bigFlock: 7, 
      color: 'bg-purple-300', // Purple
      emoji: '🦜', imgUrl: '', 
      spritePos: '0% 33.333%' // Row 2 Col 1
  },
  [BirdType.MANDARIN_DUCK]: { 
      id: BirdType.MANDARIN_DUCK, 
      name: 'Mandarin Duck', cnName: '鸳鸯',
      total: 13, smallFlock: 4, bigFlock: 6, 
      color: 'bg-emerald-300', // Green
      emoji: '🦆', imgUrl: '', 
      spritePos: '100% 33.333%' // Row 2 Col 2
  },
  [BirdType.HOOPOE]: { 
      id: BirdType.HOOPOE, 
      name: 'Hoopoe', cnName: '戴胜',
      total: 13, smallFlock: 4, bigFlock: 6, 
      color: 'bg-amber-200', // Yellow/Orange
      emoji: '🦉', imgUrl: '', 
      spritePos: '0% 66.666%' // Row 3 Col 1
  },
  [BirdType.KINGFISHER]: { 
      id: BirdType.KINGFISHER, 
      name: 'Kingfisher', cnName: '翠鸟',
      total: 10, smallFlock: 3, bigFlock: 5, 
      color: 'bg-cyan-300', // Blue/Cyan
      emoji: '🐧', imgUrl: '', 
      spritePos: '100% 66.666%' // Row 3 Col 2
  },
  [BirdType.PEACOCK]: { 
      id: BirdType.PEACOCK, 
      name: 'Peacock', cnName: '孔雀',
      total: 10, smallFlock: 3, bigFlock: 5, 
      color: 'bg-orange-200', // Orange
      emoji: '🦚', imgUrl: '', 
      spritePos: '0% 100%' // Row 4 Col 1
  },
  [BirdType.RED_CROWNED_CRANE]: { 
      id: BirdType.RED_CROWNED_CRANE, 
      name: 'Red-crowned Crane', cnName: '丹顶鹤',
      total: 7, smallFlock: 2, bigFlock: 3, 
      color: 'bg-slate-300', // Grey
      emoji: '🦩', imgUrl: '', 
      spritePos: '100% 100%' // Row 4 Col 2
  },
};

export const INITIAL_HAND_SIZE = 8;
export const ROW_COUNT = 4;
export const INITIAL_ROW_CARDS = 3;