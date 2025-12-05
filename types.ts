export enum BirdType {
  SPARROW = 'Sparrow',
  SWALLOW = 'Swallow',
  TIT_WARBLER = 'Tit-warbler',
  MANDARIN_DUCK = 'Mandarin Duck',
  HOOPOE = 'Hoopoe',
  KINGFISHER = 'Kingfisher',
  PEACOCK = 'Peacock',
  RED_CROWNED_CRANE = 'Red-crowned Crane'
}

export interface BirdConfig {
  id: BirdType;
  name: string; // English name
  cnName: string; // Chinese name
  total: number;
  smallFlock: number;
  bigFlock: number;
  color: string;
  emoji: string;
  imgUrl: string;
}

export interface Player {
  id: number;
  name: string;
  isAi: boolean;
  hand: BirdType[];
  collection: { [key in BirdType]?: number }; // Banked birds
}

export enum TurnPhase {
  PLAY = 'PLAY',         // Must play cards
  FLOCK_OR_PASS = 'FLOCK_OR_PASS' // Can flock or pass turn
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  rows: BirdType[][]; // 4 rows
  deck: BirdType[];
  discardPile: BirdType[];
  winner: number | null;
  status: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  turnPhase: TurnPhase;
  lastActionLog: string[];
  isAiThinking: boolean;
}

export enum MoveType {
  PLAY = 'PLAY',
  FLOCK = 'FLOCK',
  PASS = 'PASS'
}

export interface GameMove {
  type: MoveType;
  birdType?: BirdType; // For playing or flocking
  rowIndex?: number; // 0-3
  side?: 'LEFT' | 'RIGHT';
}

export interface MoveOutcome {
    newState: GameState;
    message: string;
    captured: BirdType[];
    drawn: number;
    flockedAmount: number;
    isValid: boolean;
}