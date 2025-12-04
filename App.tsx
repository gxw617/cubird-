
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, MoveType, BirdType, GameMove, MoveOutcome, TurnPhase } from './types';
import { initializeGame, applyMove, getFlockableCount } from './services/gameLogic';
import { getAiMove, initGemini } from './services/geminiService';
import { playSound } from './services/audioService';
import { createRoom, joinRoom, subscribeToRoom, updateGameState } from './services/firebase'; 
import { Row } from './components/Row';
import { PlayerArea } from './components/PlayerArea';
import { Collection } from './components/Collection';
import { BirdGuide } from './components/BirdGuide';
import { BIRD_DATA } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedBird, setSelectedBird] = useState<BirdType | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showGuideMobile, setShowGuideMobile] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  
  const [onlineMenuState, setOnlineMenuState] = useState<'NONE' | 'NAMING_HOST' | 'CREATE' | 'NAMING_JOIN' | 'JOIN'>('NONE');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [playerNameInput, setPlayerNameInput] = useState<string>('');
  const [isOnlineGame, setIsOnlineGame] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<number>(0); 
  const [onlineStatus, setOnlineStatus] = useState<string>('');

  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(10);
  const timerRef = useRef<number | null>(null);

  // Restore drawConfirmation modal for optional draw
  const [drawConfirmation, setDrawConfirmation] = useState<{ outcome: MoveOutcome } | null>(null);
  const [flockingBird, setFlockingBird] = useState<BirdType | null>(null);
  const [viewBoardMode, setViewBoardMode] = useState(false);

  useEffect(() => {
    initGemini();
  }, []);

  const sanitizeGameState = useCallback((state: any): GameState => {
      if (!state) return state;
      const asArray = (val: any) => val ? (Array.isArray(val) ? val : Object.values(val)) : [];

      if (state.winner === undefined) state.winner = null;
      state.deck = asArray(state.deck);
      state.discardPile = asArray(state.discardPile);
      state.lastActionLog = asArray(state.lastActionLog);
      
      const denseRows: BirdType[][] = [[], [], [], []];
      if (state.rows) {
          const source = state.rows;
          for(let i=0; i<4; i++) if (source[i]) denseRows[i] = asArray(source[i]);
      }
      state.rows = denseRows;

      const densePlayers: any[] = [];
      const rawPlayers = state.players || [];
      for (let i = 0; i < 2; i++) {
          let p = rawPlayers[i];
          if (!p) p = { id: i, name: i === 0 ? 'Player 1' : 'Player 2', isAi: false, hand: [], collection: {} };
          p.hand = asArray(p.hand);
          if (!p.collection || typeof p.collection !== 'object') p.collection = {};
          densePlayers[i] = p;
      }
      state.players = densePlayers;
      return state as GameState;
  }, []);

  useEffect(() => {
      if (isOnlineGame && roomCode) {
          const unsubscribe = subscribeToRoom(roomCode, (rawState) => {
              const newState = sanitizeGameState(rawState);
              setGameState(newState);
              if (myPlayerId === 0 && newState.players.length > 1 && newState.players[1].name !== "Waiting...") {
                  if (onlineMenuState === 'CREATE') {
                      setOnlineMenuState('NONE'); 
                      playSound('success');
                  }
              }
              if (myPlayerId === 1 && onlineStatus !== "Connected!") {
                  setOnlineStatus("Connected!");
              }
          });
          return () => unsubscribe();
      }
  }, [isOnlineGame, roomCode, myPlayerId, onlineStatus, onlineMenuState, sanitizeGameState]);

  const startGame = (ai: boolean) => {
    playSound('click');
    const players = ai ? ['You', 'Gemini AI'] : ['Player 1', 'Player 2'];
    const newState = initializeGame(players, ai);
    setGameState(newState);
    setSelectedBird(null);
    setDrawConfirmation(null);
    setViewBoardMode(false);
    setOnlineMenuState('NONE'); 
    setIsOnlineGame(false);
    setMyPlayerId(0);
  };

  const startOnlineHost = async () => {
      playSound('click');
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setRoomCode(code);
      setOnlineMenuState('CREATE');
      setOnlineStatus('Creating Room...');

      const hostName = playerNameInput || 'Host';
      const newState = initializeGame([hostName, 'Opponent (Waiting)'], false);
      newState.players[1].name = "Waiting...";
      
      setGameState(newState); 
      
      const success = await createRoom(code, newState);
      if (success) {
          setIsOnlineGame(true);
          setMyPlayerId(0);
          setOnlineStatus('Waiting for opponent...');
      } else {
          setOnlineStatus('Error: Check Internet/Config');
          setGameState(null); 
      }
  };

  const joinOnlineGame = async () => {
      playSound('click');
      if (joinCodeInput.length !== 4) return;
      setOnlineStatus('Joining...');
      
      const result = await joinRoom(joinCodeInput);
      if (result.success && result.gameState) {
          const newState = sanitizeGameState(result.gameState);
          if (newState.players[1]) newState.players[1].name = playerNameInput || "Joiner";
          newState.lastActionLog.push(`${playerNameInput || "Opponent"} joined the game!`);
          await updateGameState(joinCodeInput, newState);
          
          setRoomCode(joinCodeInput);
          setMyPlayerId(1);
          setIsOnlineGame(true);
          setGameState(newState);
          setOnlineMenuState('NONE');
          playSound('success');
      } else {
          setOnlineStatus('Room not found or error.');
          setTimeout(() => setOnlineStatus(''), 2000);
      }
  };

  const handleCreateMenu = () => { playSound('click'); setPlayerNameInput(''); setOnlineMenuState('NAMING_HOST'); };
  const handleJoinMenu = () => { playSound('click'); setPlayerNameInput(''); setOnlineMenuState('NAMING_JOIN'); };

  const quitGame = () => {
    setGameState(null);
    setSelectedBird(null);
    setShowQuitConfirm(false);
    setViewBoardMode(false);
    setIsOnlineGame(false);
    setOnlineMenuState('NONE');
    setRoomCode('');
  };

  const syncMove = (newState: GameState) => {
      setGameState(newState);
      if (isOnlineGame && roomCode) updateGameState(roomCode, newState);
  };

  const handlePass = useCallback(() => {
      if (!gameState) return;
      if (isOnlineGame && gameState.currentPlayerIndex !== myPlayerId) return;
      playSound('click');
      const outcome = applyMove(gameState, { type: MoveType.PASS });
      syncMove(outcome.newState);
      setSelectedBird(null);
  }, [gameState, isOnlineGame, myPlayerId, roomCode]);

  const executeAiTurn = useCallback(async (currentState: GameState) => {
    if (isOnlineGame) return;
    const currentPlayer = currentState.players[currentState.currentPlayerIndex];
    if (!currentPlayer.isAi) return;

    if (currentState.turnPhase === TurnPhase.PLAY) {
        setGameState(prev => prev ? ({ ...prev, isAiThinking: true }) : null);
        const aiMove = await getAiMove(currentState);
        
        setGameState(prev => {
            if (!prev) return null;
            const randomBird = currentPlayer.hand[0]; 
            const moveResult = applyMove(prev, aiMove ? {
                type: aiMove.moveType,
                birdType: aiMove.birdType,
                rowIndex: aiMove.rowIndex,
                side: aiMove.side
            } : {
                type: MoveType.PLAY,
                birdType: randomBird || BirdType.PARROT,
                rowIndex: Math.floor(Math.random() * 4),
                side: 'LEFT'
            });

            if (moveResult.captured.length > 0) {
                playSound('whoosh');
                playSound('capture');
            } else if (moveResult.drawn > 0) {
                // In optional draw phase, AI will decide in next block
                playSound('pop');
            } else {
                playSound('pop');
            }

            return { ...moveResult.newState, isAiThinking: false };
        });
    } else if (currentState.turnPhase === TurnPhase.DRAW_DECISION) {
        // AI Logic: Always Draw
        setTimeout(() => {
            setGameState(prev => {
                if(!prev) return null;
                playSound('draw');
                const outcome = applyMove(prev, { type: MoveType.DRAW_CARDS });
                return outcome.newState;
            });
        }, 1000);
    } else if (currentState.turnPhase === TurnPhase.FLOCK_OR_PASS) {
        setTimeout(() => {
            setGameState(prev => {
                if (!prev) return null;
                const p = prev.players[prev.currentPlayerIndex];
                const flockableCount = getFlockableCount(p);
                if (flockableCount > 0) {
                    const flockable = Object.keys(p.hand.reduce((acc, b) => { acc[b]=(acc[b]||0)+1; return acc; }, {} as Record<string, number>))
                        .find(key => {
                            const type = key as BirdType;
                            return p.hand.filter(b => b === type).length >= BIRD_DATA[type].smallFlock;
                        });
                    const outcome = applyMove(prev, { type: MoveType.FLOCK, birdType: flockable as BirdType });
                    playSound('flap');
                    playSound('success');
                    return outcome.newState;
                } else {
                    const outcome = applyMove(prev, { type: MoveType.PASS });
                    return outcome.newState;
                }
            });
        }, 1500); 
    }
  }, [isOnlineGame]);

  useEffect(() => {
    if (gameState && gameState.status === 'PLAYING') {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.isAi && !gameState.isAiThinking) executeAiTurn(gameState);
    }
  }, [gameState, executeAiTurn]);

  // Determine whose hand to show at the bottom
  // ONLINE: Always my ID
  // LOCAL AI: Player 0 (Human)
  // LOCAL PASS & PLAY: Current Player (Hotseat) - FIXED
  let humanPlayer = null;
  if (gameState) {
      if (isOnlineGame) {
          humanPlayer = gameState.players[myPlayerId];
      } else {
          const current = gameState.players[gameState.currentPlayerIndex];
          if (current.isAi) {
              humanPlayer = gameState.players[0]; // If AI turn, show Human P1
          } else {
              humanPlayer = current; // Human turn (P1 or P2 in Pass&Play), show active player
          }
      }
  }

  const isHumanTurn = gameState 
    ? (isOnlineGame 
        ? gameState.currentPlayerIndex === myPlayerId 
        : (!gameState.players[gameState.currentPlayerIndex].isAi)) 
    : false;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isHumanTurn && gameState?.turnPhase === TurnPhase.FLOCK_OR_PASS && humanPlayer) {
        const flockableCount = getFlockableCount(humanPlayer);
        let duration = 5;
        if (flockableCount === 1) duration = 15;
        if (flockableCount >= 2) duration = 20;

        setCountdown(duration);
        
        timerRef.current = window.setInterval(() => {
            setCountdown(prev => {
                if (prev !== null && prev <= 1) {
                    clearInterval(timerRef.current!);
                    handlePass();
                    return 0;
                }
                return (prev || 0) - 1;
            });
        }, 1000);
    } else {
        setCountdown(null);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState?.turnPhase, isHumanTurn, humanPlayer, handlePass]);

  const handleSelectSide = (rowIndex: number, side: 'LEFT' | 'RIGHT') => {
    if (!gameState || !selectedBird || gameState.turnPhase !== TurnPhase.PLAY) return;
    if (isOnlineGame && gameState.currentPlayerIndex !== myPlayerId) return; 
    
    const move: GameMove = { type: MoveType.PLAY, birdType: selectedBird, rowIndex, side };
    const outcome = applyMove(gameState, move);

    if (outcome.captured.length > 0) {
        playSound('whoosh');
        playSound('capture');
        syncMove(outcome.newState);
        setSelectedBird(null);
    }
    else if (outcome.drawn > 0) {
        // Impossible in current logic as outcome.drawn is 0 for phase change
    } else {
        // No Capture -> Optional Draw phase
        playSound('pop');
        setDrawConfirmation({ outcome });
        // Don't sync yet if we want to show local modal decision, BUT
        // `applyMove` already changed the state to DRAW_DECISION. 
        // We sync the row changes, but the phase will lock UI.
        syncMove(outcome.newState);
        setSelectedBird(null);
    }
  };

  const confirmDraw = () => {
      if (!gameState) return;
      playSound('draw');
      const outcome = applyMove(gameState, { type: MoveType.DRAW_CARDS });
      syncMove(outcome.newState);
      setDrawConfirmation(null);
  };

  const skipDraw = () => {
    if (!gameState) return;
    const outcome = applyMove(gameState, { type: MoveType.SKIP_DRAW });
    syncMove(outcome.newState);
    setDrawConfirmation(null);
  };

  const handleFlock = () => {
    if (!gameState || !selectedBird || gameState.turnPhase !== TurnPhase.FLOCK_OR_PASS) return;
    if (isOnlineGame && gameState.currentPlayerIndex !== myPlayerId) return;

    setFlockingBird(selectedBird);
    playSound('flap'); 
    setTimeout(() => {
        playSound('success');
        const outcome = applyMove(gameState, { type: MoveType.FLOCK, birdType: selectedBird });
        syncMove(outcome.newState);
        setSelectedBird(null);
        setFlockingBird(null);
    }, 600); 
  };

  // Show modal if phase is DRAW_DECISION and it's my turn
  const showDrawModal = isHumanTurn && gameState?.turnPhase === TurnPhase.DRAW_DECISION;

  if (!gameState || onlineMenuState !== 'NONE') {
    // Menu render...
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-4 font-sans text-stone-800">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-stone-600 to-amber-700 mb-2 drop-shadow-sm tracking-tighter">CUBIRDS</h1>
        <p className="text-stone-500 mb-8 md:mb-12 font-medium text-lg md:text-xl">The strategic card game of bird collection.</p>

        {onlineMenuState === 'NONE' && (
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-white ring-1 ring-stone-200 animate-bounce-in flex flex-col gap-3">
                <button onClick={() => startGame(false)} className="w-full bg-stone-600 hover:bg-stone-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md hover:-translate-y-1 flex items-center"><span className="text-2xl w-12 text-center drop-shadow-md">👥</span><span className="flex-1 text-center text-lg">Pass & Play</span></button>
                <button onClick={() => startGame(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md hover:-translate-y-1 flex items-center"><span className="text-2xl w-12 text-center drop-shadow-md">✨</span><span className="flex-1 text-center text-lg">Play vs AI</span></button>
                <button onClick={handleCreateMenu} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md hover:-translate-y-1 flex items-center"><span className="text-xl w-12 text-center drop-shadow-md">🌐</span><span className="flex-1 text-center text-lg">Create Online Room</span></button>
                <button onClick={handleJoinMenu} className="w-full mt-2 text-stone-400 font-bold hover:text-stone-600 hover:underline text-sm">Join Existing Room</button>
            </div>
        )}
        {(onlineMenuState === 'NAMING_HOST') && (
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-white animate-bounce-in text-center">
                 <h2 className="text-2xl font-bold text-stone-800 mb-6">Enter Your Name</h2>
                 <input type="text" value={playerNameInput} onChange={(e) => setPlayerNameInput(e.target.value)} placeholder="Host Name" className="w-full bg-stone-50 text-center text-xl font-bold text-stone-700 p-4 rounded-xl mb-6 outline-none border-2 border-transparent focus:border-amber-400" />
                 <button onClick={() => { if(playerNameInput.trim()) startOnlineHost(); }} disabled={!playerNameInput.trim()} className="w-full bg-stone-800 hover:bg-black disabled:bg-stone-300 text-white font-bold py-4 rounded-2xl mb-3 transition-all">Create Room</button>
                 <button onClick={() => setOnlineMenuState('NONE')} className="w-full py-2 text-stone-400 font-bold hover:text-stone-600">Back</button>
             </div>
        )}
        {(onlineMenuState === 'NAMING_JOIN') && (
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-white animate-bounce-in text-center">
                 <h2 className="text-2xl font-bold text-stone-800 mb-6">Enter Your Name</h2>
                 <input type="text" value={playerNameInput} onChange={(e) => setPlayerNameInput(e.target.value)} placeholder="Your Name" className="w-full bg-stone-50 text-center text-xl font-bold text-stone-700 p-4 rounded-xl mb-6 outline-none border-2 border-transparent focus:border-amber-400" />
                 <button onClick={() => { if(playerNameInput.trim()) setOnlineMenuState('JOIN'); }} disabled={!playerNameInput.trim()} className="w-full bg-stone-800 hover:bg-black disabled:bg-stone-300 text-white font-bold py-4 rounded-2xl mb-3 transition-all">Next</button>
                 <button onClick={() => setOnlineMenuState('NONE')} className="w-full py-2 text-stone-400 font-bold hover:text-stone-600">Back</button>
             </div>
        )}
        {onlineMenuState === 'JOIN' && (
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-white animate-bounce-in text-center">
                 <h2 className="text-2xl font-bold text-stone-800 mb-6">Join Room</h2>
                 <p className="text-stone-500 mb-4 font-bold">Playing as: {playerNameInput}</p>
                 <input type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="4-Digit Code" maxLength={4} inputMode="numeric" className="w-full bg-stone-100 text-center text-3xl font-black text-amber-600 p-4 rounded-xl mb-6 outline-none border-2 border-transparent focus:border-amber-400 transition-all placeholder:text-stone-300" />
                 {onlineStatus && <p className="text-amber-500 text-sm mb-4 font-bold">{onlineStatus}</p>}
                 <button onClick={joinOnlineGame} disabled={joinCodeInput.length !== 4} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-4 rounded-2xl mb-4 transition-all">Join Game</button>
                 <button onClick={() => { setOnlineMenuState('NAMING_JOIN'); setOnlineStatus(''); }} className="w-full py-2 text-stone-400 font-bold hover:text-stone-600">Back</button>
             </div>
        )}
        {onlineMenuState === 'CREATE' && (
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-white animate-bounce-in text-center">
                 <h2 className="text-2xl font-bold text-stone-800 mb-4">Room Created</h2>
                 <div className="bg-stone-100 p-6 rounded-2xl mb-6">
                     <div className="text-sm text-stone-500 mb-2 uppercase tracking-wide">Room Code</div>
                     <div className="text-5xl font-black text-amber-600 tracking-widest">{roomCode}</div>
                 </div>
                 <div className="flex items-center justify-center gap-2 mb-8 text-stone-400 animate-pulse">
                     <span className="w-2 h-2 bg-stone-400 rounded-full"></span><span className="w-2 h-2 bg-stone-400 rounded-full"></span><span className="w-2 h-2 bg-stone-400 rounded-full"></span>
                     <span>Waiting for opponent...</span>
                 </div>
                 <button onClick={() => { setOnlineMenuState('NONE'); setIsOnlineGame(false); setRoomCode(''); setGameState(null); }} className="w-full py-3 text-stone-400 font-bold hover:text-stone-600">Cancel</button>
             </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-[300px] flex flex-col md:flex-row">
      <header className="md:hidden bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 px-4 py-3 flex justify-between items-center border-b border-stone-200">
         <div className="flex items-center gap-3"><button onClick={() => setShowQuitConfirm(true)} className="text-stone-400 hover:text-red-500 font-bold text-sm bg-stone-100 px-3 py-1 rounded-lg">← Exit</button><div className="font-black text-xl text-stone-700 tracking-tighter">CUBIRDS</div></div>
         <button onClick={() => setShowGuideMobile(true)} className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">Rules ℹ️</button>
      </header>
      <main className="flex-1 flex flex-col items-center pt-2 md:pt-8 px-2 overflow-x-hidden w-full relative">
        <div className="hidden md:flex w-full max-w-5xl justify-between items-center mb-6 px-4">
             <div className="flex items-center gap-4"><button onClick={() => setShowQuitConfirm(true)} className="text-stone-400 hover:text-red-500 font-bold px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-red-50 hover:border-red-200 transition-colors">← Quit Game</button><div className="font-black text-3xl text-stone-300 tracking-tighter">CUBIRDS</div></div>
             {isOnlineGame && (<div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-amber-600 font-bold text-sm">Room: {roomCode}</span></div>)}
             {gameState.isAiThinking && (<div className="flex items-center gap-2 text-indigo-500 font-bold animate-pulse bg-indigo-50 px-4 py-2 rounded-full">✨ Gemini is thinking...</div>)}
             
             {/* Deck and Discard Pile */}
             <div className="flex items-center gap-3">
                 <div className="flex flex-col items-center">
                     <div className="w-10 h-14 bg-stone-700 rounded border-2 border-white shadow-md relative flex items-center justify-center animate-slide-in-top">
                         <span className="text-white font-bold text-xs">{gameState.deck.length}</span>
                     </div>
                     <span className="text-[10px] text-stone-400 font-bold mt-1">Deck</span>
                 </div>
                 <div className="flex flex-col items-center">
                     <div className="w-10 h-14 bg-stone-300 rounded border-2 border-stone-400 shadow-inner flex items-center justify-center">
                         <span className="text-stone-500 font-bold text-xs">{gameState.discardPile.length}</span>
                     </div>
                     <span className="text-[10px] text-stone-400 font-bold mt-1">Discard</span>
                 </div>
             </div>
        </div>
        <Collection players={gameState.players} currentPlayerId={gameState.currentPlayerIndex} />
        {!showDrawModal && (<div className="w-full max-w-4xl text-center mb-1 md:mb-4 h-6 md:h-8 flex items-center justify-center"><span className="inline-block bg-white border border-stone-200 text-stone-500 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium shadow-sm transition-opacity duration-300 truncate max-w-[90%]">{gameState.lastActionLog[gameState.lastActionLog.length - 1]}</span></div>)}
        <div className="space-y-1 md:space-y-3 w-full max-w-4xl pb-10">
            {gameState.rows.map((row, idx) => (
                <Row key={idx} index={idx} birds={row} onSelectSide={handleSelectSide} isCurrentPlayerTurn={isHumanTurn && gameState.turnPhase === TurnPhase.PLAY} selectedBird={selectedBird} pendingMove={null} />
            ))}
        </div>
      </main>

      {showDrawModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm px-4">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-stone-100 w-full max-w-sm animate-bounce-in transform">
                <h3 className="text-center text-xl font-black text-stone-800 mb-2 uppercase tracking-tight">No Capture!</h3>
                <div className="bg-orange-50 rounded-xl p-4 mb-6 text-center"><div className="flex flex-col items-center gap-2"><span className="text-3xl font-black text-orange-400">Draw 2 Cards?</span><p className="text-xs text-stone-400 mt-2">If you skip and hand is empty, round ends.</p></div></div>
                <div className="flex gap-3"><button onClick={skipDraw} className="flex-1 py-3 rounded-xl font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors">Skip</button><button onClick={confirmDraw} className="flex-1 py-3 rounded-xl font-black bg-orange-400 text-white hover:bg-orange-500 shadow-lg hover:translate-y-[-2px] transition-all">DRAW</button></div>
            </div>
         </div>
      )}

      {showQuitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs text-center"><h3 className="font-bold text-lg mb-2">Quit Game?</h3><div className="flex gap-2"><button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold">Cancel</button><button onClick={quitGame} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold">Quit</button></div></div>
        </div>
      )}

      <aside className="hidden md:block w-72 p-6 sticky top-0 h-screen overflow-y-auto border-l border-stone-200 bg-white/50 backdrop-blur-sm"><BirdGuide /></aside>
      {showGuideMobile && (<div className="fixed inset-0 z-[70] bg-black/50 flex justify-end"><div className="w-4/5 h-full bg-white shadow-2xl animate-slide-in-right"><BirdGuide className="h-full rounded-none border-none" onClose={() => setShowGuideMobile(false)} /></div></div>)}

      {gameState.winner !== null && !viewBoardMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-900/80 backdrop-blur-md">
            <div className="bg-white p-10 rounded-3xl shadow-2xl text-center animate-bounce-in max-w-sm mx-4 border-4 border-white">
                <div className="text-7xl mb-6 filter drop-shadow-md">🏆</div>
                <h2 className="text-4xl font-black text-stone-800 mb-2">{gameState.players[gameState.winner] ? gameState.players[gameState.winner].name : 'Winner'} Wins!</h2>
                <div className="flex flex-col gap-3 mt-6"><button onClick={() => setViewBoardMode(true)} className="w-full bg-stone-100 text-stone-600 px-8 py-4 rounded-xl font-bold shadow-sm hover:bg-stone-200 transition-all">View Board</button><button onClick={() => setGameState(null)} className="w-full bg-stone-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-stone-900 transition-all hover:scale-105">Back to Menu</button></div>
            </div>
        </div>
      )}
      
      {viewBoardMode && (<div className="fixed top-4 right-4 z-[90]"><button onClick={() => setViewBoardMode(false)} className="bg-stone-800 text-white px-6 py-3 rounded-full font-bold shadow-xl animate-bounce">Back to Results 🏆</button></div>)}

      {humanPlayer && (
        <div className="transition-all duration-300">
            <PlayerArea 
                player={humanPlayer} 
                isCurrentTurn={isHumanTurn} 
                phase={gameState.turnPhase} 
                selectedBird={selectedBird} 
                onSelectBird={(b) => { if (isHumanTurn) { playSound('click'); setSelectedBird(b); } }} 
                onFlock={handleFlock} 
                onPass={handlePass} 
                isHidden={false} 
                countdown={countdown} 
                flockingBirdType={flockingBird} 
            />
        </div>
      )}
    </div>
  );
};

export default App;
