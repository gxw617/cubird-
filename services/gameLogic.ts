import { BIRD_DATA, INITIAL_HAND_SIZE, INITIAL_ROW_CARDS, ROW_COUNT } from '../constants';
import { BirdType, GameState, Player, MoveType, GameMove, MoveOutcome, TurnPhase } from '../types';

// Helper to shuffle array
export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Create a new deck
const createDeck = (): BirdType[] => {
  let deck: BirdType[] = [];
  Object.values(BIRD_DATA).forEach((bird) => {
    for (let i = 0; i < bird.total; i++) {
      deck.push(bird.id);
    }
  });
  return shuffle(deck);
};

// Helper to draw a card, reshuffling discard if needed
const drawCard = (state: GameState): BirdType | undefined => {
    if (state.deck.length === 0) {
        if (state.discardPile.length > 0) {
            state.deck = shuffle([...state.discardPile]);
            state.discardPile = [];
            state.lastActionLog.push("⚠️ Deck reshuffled.");
        } else {
            return undefined; // Truly empty
        }
    }
    return state.deck.pop();
};

const dealHands = (state: GameState) => {
    state.players.forEach(p => {
        p.hand = []; // Clear existing (should be cleared by discard logic if round end)
        for(let k=0; k<INITIAL_HAND_SIZE; k++) {
            const card = drawCard(state);
            if(card) p.hand.push(card);
        }
        p.hand.sort();
    });
};

export const initializeGame = (playerNames: string[], aiEnabled: boolean): GameState => {
  const deck = createDeck();
  const rows: BirdType[][] = Array.from({ length: ROW_COUNT }, () => []);
  
  const initialState: GameState = {
    players: [],
    currentPlayerIndex: 0,
    rows,
    deck,
    discardPile: [],
    winner: null,
    status: 'PLAYING',
    turnPhase: TurnPhase.PLAY,
    lastActionLog: ['Game started! Round 1.'],
    isAiThinking: false,
  };

  // Init rows ensuring validity
  for (let i = 0; i < ROW_COUNT; i++) {
      for (let j = 0; j < INITIAL_ROW_CARDS; j++) {
        const card = drawCard(initialState);
        if(card) rows[i].push(card);
      }
      // Ensure row has at least 2 distinct species at start
      ensureRowValidity(rows[i], initialState);
  }

  const players: Player[] = playerNames.map((name, index) => ({
    id: index,
    name,
    isAi: aiEnabled && index === 1,
    hand: [],
    collection: {}
  }));
  
  initialState.players = players;
  dealHands(initialState);

  // Official Rules: Give each player 1 random bird in their collection to start
  initialState.players.forEach(p => {
      const startBird = drawCard(initialState);
      if (startBird) {
          p.collection[startBird] = 1;
      }
  });

  return initialState;
};

// Official Rule: A row must have at least 2 distinct species.
// If not, add cards until it does.
const ensureRowValidity = (row: BirdType[], state: GameState) => {
    let safety = 0;
    while (safety < 20) { // Safety break
        const uniqueSpecies = new Set(row);
        if (uniqueSpecies.size >= 2) break; // Valid
        
        const card = drawCard(state);
        if (!card) break; // Deck/Discard empty
        row.push(card);
        safety++;
    }
};

export const checkWinCondition = (player: Player): boolean => {
  const speciesCount = Object.keys(player.collection).length;
  if (speciesCount >= 7) return true;

  let speciesWithThreeOrMore = 0;
  Object.values(player.collection).forEach(count => {
    if ((count || 0) >= 3) speciesWithThreeOrMore++;
  });

  return speciesWithThreeOrMore >= 2;
};

// Handle end of round (when a player empties hand)
const handleRoundEnd = (state: GameState, finisherIndex: number) => {
    state.lastActionLog.push(`🔄 Round Over! ${state.players[finisherIndex].name} emptied their hand.`);
    
    // All other players discard their hands
    state.players.forEach((p, idx) => {
        if (p.hand.length > 0) {
            state.discardPile.push(...p.hand);
            p.hand = [];
        }
    });

    // Deal new hands
    dealHands(state);

    // The player to the LEFT of the finisher starts the new round.
    state.currentPlayerIndex = (finisherIndex + 1) % state.players.length;
    state.turnPhase = TurnPhase.PLAY;
};

// Core move logic
export const applyMove = (state: GameState, move: GameMove): MoveOutcome => {
  const newState = JSON.parse(JSON.stringify(state)) as GameState; // Deep copy
  const player = newState.players[newState.currentPlayerIndex];
  
  const outcome: MoveOutcome = {
      newState,
      message: '',
      captured: [],
      drawn: 0,
      flockedAmount: 0,
      isValid: false
  };

  // --- SAFETY CHECK ---
  // If player data is missing (e.g. sync issue), abort to prevent crash
  if (!player) {
      console.warn("applyMove called but current player is missing");
      return outcome;
  }

  // --- PASS TURN ---
  if (move.type === MoveType.PASS) {
      if (newState.turnPhase !== TurnPhase.FLOCK_OR_PASS) return outcome;

      // Check for round end via empty hand
      if (player.hand.length === 0) {
          handleRoundEnd(newState, player.id);
      } else {
          // Normal turn pass
          newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
          newState.turnPhase = TurnPhase.PLAY;
          newState.lastActionLog.push(`${player.name} ended turn.`);
      }
      
      outcome.isValid = true;
      return outcome;
  }

  // --- FLOCK ---
  if (move.type === MoveType.FLOCK) {
    if (newState.turnPhase !== TurnPhase.FLOCK_OR_PASS) return outcome;
    if (!move.birdType) return outcome;
    
    const handCount = player.hand.filter(b => b === move.birdType).length;
    const config = BIRD_DATA[move.birdType];
    
    let bankAmount = 0;
    if (handCount >= config.bigFlock) bankAmount = 2;
    else if (handCount >= config.smallFlock) bankAmount = 1;
    else return outcome; 

    player.hand = player.hand.filter(b => b !== move.birdType);
    player.collection[move.birdType] = (player.collection[move.birdType] || 0) + bankAmount;
    
    const discardCount = handCount - bankAmount;
    for(let i=0; i<discardCount; i++) newState.discardPile.push(move.birdType);

    outcome.flockedAmount = bankAmount;
    outcome.message = `${player.name} flocked ${move.birdType}s (Banked ${bankAmount}).`;
    outcome.isValid = true;
    
    newState.lastActionLog.push(outcome.message);
    
    if (checkWinCondition(player)) {
      newState.winner = player.id;
      newState.status = 'GAME_OVER';
      newState.lastActionLog.push(`${player.name} WINS!`);
      return outcome;
    }

    if (player.hand.length === 0) {
         handleRoundEnd(newState, player.id);
    }

    return outcome;
  } 
  
  // --- PLAY ---
  if (move.type === MoveType.PLAY) {
    if (newState.turnPhase !== TurnPhase.PLAY) return outcome;
    if (move.rowIndex === undefined || move.side === undefined || !move.birdType) return outcome;

    // 1. Place birds
    const cardsToPlay = player.hand.filter(b => b === move.birdType);
    if (cardsToPlay.length === 0) return outcome;

    player.hand = player.hand.filter(b => b !== move.birdType);
    
    const row = newState.rows[move.rowIndex];
    if (move.side === 'LEFT') {
      row.unshift(...cardsToPlay);
    } else {
      row.push(...cardsToPlay);
    }

    // 2. Resolve Capture
    let captured: BirdType[] = [];
    const containsPlayedType = (birds: BirdType[]) => birds.some(b => b === move.birdType);

    if (move.side === 'LEFT') {
      const startSearchIdx = cardsToPlay.length;
      const firstMatchIndex = row.slice(startSearchIdx).findIndex(b => b === move.birdType);
      
      if (firstMatchIndex !== -1) {
        const absoluteMatchIndex = startSearchIdx + firstMatchIndex;
        const potentialVictims = row.slice(startSearchIdx, absoluteMatchIndex);
        if (potentialVictims.length > 0 && !containsPlayedType(potentialVictims)) {
            captured = row.splice(startSearchIdx, absoluteMatchIndex - startSearchIdx);
        }
      }
    } else {
      const originalRowLength = row.length - cardsToPlay.length;
      let lastMatchIndex = -1;
      for (let i = originalRowLength - 1; i >= 0; i--) {
        if (row[i] === move.birdType) {
          lastMatchIndex = i;
          break;
        }
      }
      if (lastMatchIndex !== -1) {
          const potentialVictims = row.slice(lastMatchIndex + 1, originalRowLength);
          if (potentialVictims.length > 0 && !containsPlayedType(potentialVictims)) {
             captured = row.splice(lastMatchIndex + 1, originalRowLength - (lastMatchIndex + 1));
          }
      }
    }

    if (captured.length > 0) {
      player.hand.push(...captured);
      player.hand.sort();
      outcome.captured = captured;
      outcome.message = `${player.name} played ${move.birdType}, captured ${captured.length}.`;
    } else {
      // 3. No Capture
      // IMPORTANT: Check if hand is empty. If so, Round Ends Immediately. NO DRAW.
      if (player.hand.length === 0) {
          handleRoundEnd(newState, player.id);
          outcome.message = `${player.name} played last card! Round Over.`;
          outcome.drawn = 0;
      } else {
          // Normal Draw 2
          let drawnCount = 0;
          const c1 = drawCard(newState);
          if(c1) { player.hand.push(c1); drawnCount++; }
          const c2 = drawCard(newState);
          if(c2) { player.hand.push(c2); drawnCount++; }

          player.hand.sort();
          outcome.drawn = drawnCount;
          outcome.message = `${player.name} played ${move.birdType}, no capture. Drew ${drawnCount}.`;
      }
    }

    // 4. Refill Row
    ensureRowValidity(row, newState);

    newState.turnPhase = TurnPhase.FLOCK_OR_PASS;
    newState.lastActionLog.push(outcome.message);
    
    // Check Round End again just in case (though covered above)
    // If captured cards but still empty? (Impossible, capture adds cards)
    if (player.hand.length === 0 && outcome.drawn > 0) {
         // Edge case: Drew 2 cards but somehow hand is empty? Not possible in logic.
         // Standard check
         handleRoundEnd(newState, player.id);
    }
    
    outcome.isValid = true;
    return outcome;
  }

  return outcome;
};