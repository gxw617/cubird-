
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
        p.hand = []; 
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

  // Init rows: STRICT RULE - 3 distinct species per row
  for (let i = 0; i < ROW_COUNT; i++) {
      const currentRow: BirdType[] = [];
      while (currentRow.length < INITIAL_ROW_CARDS) {
          const card = drawCard(initialState);
          if (!card) break; 

          if (currentRow.includes(card)) {
              initialState.discardPile.push(card);
          } else {
              currentRow.push(card);
          }
      }
      rows[i] = currentRow;
  }

  const players: Player[] = playerNames.map((name, index) => ({
    id: index,
    name: name || `Player ${index + 1}`,
    isAi: aiEnabled && index === 1,
    hand: [],
    collection: {}
  }));
  
  initialState.players = players;
  dealHands(initialState);

  // Initial Collection
  initialState.players.forEach(p => {
      const startBird = drawCard(initialState);
      if (startBird) {
          p.collection[startBird] = 1;
      }
  });

  return initialState;
};

// Official Rule: End of turn refill.
const ensureRowValidity = (row: BirdType[], state: GameState) => {
    let safety = 0;
    while (safety < 20) { 
        const uniqueSpecies = new Set(row);
        if (uniqueSpecies.size >= 2) break; 
        
        const card = drawCard(state);
        if (!card) break; 
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

export const getFlockableCount = (player: Player): number => {
    if (!player || !player.hand) return 0;
    const counts: Record<string, number> = {};
    player.hand.forEach(b => counts[b] = (counts[b] || 0) + 1);
    
    let options = 0;
    Object.entries(counts).forEach(([key, count]) => {
        const type = key as BirdType;
        if (BIRD_DATA[type] && count >= BIRD_DATA[type].smallFlock) options++;
    });
    return options;
};

// Handle end of round (when a player empties hand)
const handleRoundEnd = (state: GameState, finisherIndex: number) => {
    state.lastActionLog.push(`🔄 Round Over! ${state.players[finisherIndex].name} emptied hand.`);
    
    // Discard all hands
    state.players.forEach((p) => {
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

  if (!player) return outcome;

  // --- DRAW CARDS (Optional Action) ---
  if (move.type === MoveType.DRAW_CARDS) {
      if (newState.turnPhase !== TurnPhase.DRAW_DECISION) return outcome;
      
      let drawnCount = 0;
      const c1 = drawCard(newState);
      if(c1) { player.hand.push(c1); drawnCount++; }
      const c2 = drawCard(newState);
      if(c2) { player.hand.push(c2); drawnCount++; }
      player.hand.sort();

      outcome.drawn = drawnCount;
      outcome.message = `${player.name} chose to draw ${drawnCount} cards.`;
      
      // Drawing ends the "play" part, move to Flock/Pass
      newState.turnPhase = TurnPhase.FLOCK_OR_PASS;
      newState.lastActionLog.push(outcome.message);
      outcome.isValid = true;
      return outcome;
  }

  // --- SKIP DRAW (Optional Action) ---
  if (move.type === MoveType.SKIP_DRAW) {
      if (newState.turnPhase !== TurnPhase.DRAW_DECISION) return outcome;
      
      outcome.message = `${player.name} skipped drawing.`;
      
      // Rule: If you skip draw AND your hand is empty, Round Ends immediately.
      // And the triggerer ends their turn (passed to next in handleRoundEnd)
      if (player.hand.length === 0) {
          handleRoundEnd(newState, player.id);
      } else {
          newState.turnPhase = TurnPhase.FLOCK_OR_PASS;
          newState.lastActionLog.push(outcome.message);
      }
      outcome.isValid = true;
      return outcome;
  }

  // --- PASS ---
  if (move.type === MoveType.PASS) {
      if (newState.turnPhase !== TurnPhase.FLOCK_OR_PASS) return outcome;
      
      // Standard check if hand became empty after flocking (should be caught in flock, but safe here)
      if (player.hand.length === 0) {
          handleRoundEnd(newState, player.id);
      } else {
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

    // After flocking, if hand is empty -> Round Ends
    if (player.hand.length === 0) {
         handleRoundEnd(newState, player.id);
    } else {
        // Otherwise, turn ends immediately (Max 1 flock per turn)
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
        newState.turnPhase = TurnPhase.PLAY;
        newState.lastActionLog.push(`${player.name} ended turn.`);
    }
    return outcome;
  } 
  
  // --- PLAY ---
  if (move.type === MoveType.PLAY) {
    if (newState.turnPhase !== TurnPhase.PLAY) return outcome;
    if (move.rowIndex === undefined || move.side === undefined || !move.birdType) return outcome;

    const cardsToPlay = player.hand.filter(b => b === move.birdType);
    if (cardsToPlay.length === 0) return outcome;

    // 1. Remove from hand
    player.hand = player.hand.filter(b => b !== move.birdType);
    
    // 2. Add to Row
    const row = newState.rows[move.rowIndex];
    if (move.side === 'LEFT') {
      row.unshift(...cardsToPlay);
    } else {
      row.push(...cardsToPlay);
    }

    // 3. CAPTURE LOGIC
    let captured: BirdType[] = [];
    
    if (move.side === 'LEFT') {
      const searchStartIndex = cardsToPlay.length;
      const matchIndex = row.slice(searchStartIndex).findIndex(b => b === move.birdType);
      
      if (matchIndex !== -1) {
          const absoluteMatchIndex = searchStartIndex + matchIndex;
          const deleteCount = absoluteMatchIndex - searchStartIndex;
          if (deleteCount > 0) {
              captured = row.splice(searchStartIndex, deleteCount);
          }
      }
    } else {
      const originalLen = row.length - cardsToPlay.length;
      let matchIndex = -1;
      for (let i = originalLen - 1; i >= 0; i--) {
          if (row[i] === move.birdType) {
              matchIndex = i;
              break;
          }
      }
      if (matchIndex !== -1) {
          const startIndex = matchIndex + 1;
          const deleteCount = originalLen - startIndex;
          if (deleteCount > 0) {
              captured = row.splice(startIndex, deleteCount);
          }
      }
    }

    if (captured.length > 0) {
      player.hand.push(...captured);
      player.hand.sort();
      outcome.captured = captured;
      outcome.message = `${player.name} played ${move.birdType}, captured ${captured.length}.`;
      
      // Capture successful -> Go to Flock/Pass
      newState.turnPhase = TurnPhase.FLOCK_OR_PASS;
    } else {
      // NO CAPTURE -> DRAW DECISION (Optional Draw)
      outcome.message = `${player.name} played ${move.birdType}, no capture.`;
      newState.turnPhase = TurnPhase.DRAW_DECISION;
    }

    // Refill row
    ensureRowValidity(row, newState);

    newState.lastActionLog.push(outcome.message);
    outcome.isValid = true;
    return outcome;
  }

  return outcome;
};
