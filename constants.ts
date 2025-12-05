import { BirdConfig, BirdType } from './types';

// Updated palette to match the new 8 bird species.
// Twemoji URLs selected to best represent the species visually.
export const BIRD_DATA: Record<BirdType, BirdConfig> = {
  [BirdType.SPARROW]: { 
      id: BirdType.SPARROW, 
      name: 'Sparrow',
      cnName: '麻雀',
      total: 20, smallFlock: 6, bigFlock: 9, 
      color: 'bg-stone-500', // Brown/Greyish
      emoji: '🐦',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f426.svg' 
  },
  [BirdType.SWALLOW]: { 
      id: BirdType.SWALLOW, 
      name: 'Swallow', 
      cnName: '家燕',
      total: 20, smallFlock: 6, bigFlock: 9, 
      color: 'bg-indigo-600', // Dark Blue/Black
      emoji: '🦅', // Using generic bird/eagle for silhouette feel
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f985.svg'
  },
  [BirdType.TIT_WARBLER]: { 
      id: BirdType.TIT_WARBLER, 
      name: 'Tit-warbler', 
      cnName: '花彩雀莺',
      total: 17, smallFlock: 5, bigFlock: 7, 
      color: 'bg-pink-400', // Colorful/Pinkish
      emoji: '🦜',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f99c.svg'
  },
  [BirdType.MANDARIN_DUCK]: { 
      id: BirdType.MANDARIN_DUCK, 
      name: 'Mandarin Duck', 
      cnName: '鸳鸯',
      total: 13, smallFlock: 4, bigFlock: 6, 
      color: 'bg-orange-500', // Distinct Orange/Multi
      emoji: '🦆',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f986.svg'
  },
  [BirdType.HOOPOE]: { 
      id: BirdType.HOOPOE, 
      name: 'Hoopoe', 
      cnName: '戴胜',
      total: 13, smallFlock: 4, bigFlock: 6, 
      color: 'bg-amber-300', // Yellow/Striped
      emoji: '🦉', // Using Owl as distinct shape placeholder
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f989.svg'
  },
  [BirdType.KINGFISHER]: { 
      id: BirdType.KINGFISHER, 
      name: 'Kingfisher', 
      cnName: '翠鸟',
      total: 10, smallFlock: 3, bigFlock: 5, 
      color: 'bg-cyan-500', // Bright Blue/Turquoise
      emoji: '🐧', // Using Penguin for blue prominence or generic
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f427.svg'
  },
  [BirdType.PEACOCK]: { 
      id: BirdType.PEACOCK, 
      name: 'Peacock', 
      cnName: '孔雀',
      total: 10, smallFlock: 3, bigFlock: 5, 
      color: 'bg-emerald-600', // Green/Blue
      emoji: '🦚',
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f99a.svg'
  },
  [BirdType.RED_CROWNED_CRANE]: { 
      id: BirdType.RED_CROWNED_CRANE, 
      name: 'Red-crowned Crane', 
      cnName: '丹顶鹤',
      total: 7, smallFlock: 2, bigFlock: 3, 
      color: 'bg-rose-500', // Red Accent/White body usually but need contrast
      emoji: '🦩', // Flamingo is closest shape
      imgUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f9a9.svg' 
  },
};

export const INITIAL_HAND_SIZE = 8;
export const ROW_COUNT = 4;
export const INITIAL_ROW_CARDS = 3;