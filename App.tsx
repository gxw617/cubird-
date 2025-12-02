import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, MoveType, BirdType, GameMove, MoveOutcome, TurnPhase } from './types';
import { initializeGame, applyMove } from './services/gameLogic';
import { getAiMove, initGemini } from './services/geminiService';
import { playSound } from './services/audioService';
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
  
  // Auto-pass timer state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(10);
  const timerRef = useRef<number | null>(null);

  const [drawConfirmation, setDrawConfirmation] = useState<{ outcome: MoveOutcome } | null>(null);
  
  // Animation State
  const [flockingBird, setFlockingBird] = useState<BirdType | null>(null);

  // "View Board" mode after game over
  const [viewBoardMode, setViewBoardMode] = useState(false);

  useEffect(() => {
    initGemini();
  }, []);

  const startGame = (ai: boolean) => {
    playSound('click');
    const players = ai ? ['You', 'Gemini AI'] : ['Player 1', 'Player 2'];
    setGameState(initializeGame(players, ai));
    setSelectedBird(null);
    setDrawConfirmation(null);
    setViewBoardMode(false);
  };

  const quitGame = () => {
    setGameState(null);
    setSelectedBird(null);
    setDrawConfirmation(null);
    setShowQuitConfirm(false);
    setViewBoardMode(false);
  };

  const handlePass = useCallback(() => {
      if (!gameState) return;
      playSound('click');
      const outcome = applyMove(gameState, { type: MoveType.PASS });
      setGameState(outcome.newState);
      setSelectedBird(null);
  }, [gameState]);

  // AI Logic
  const executeAiTurn = useCallback(async (currentState: GameState) => {
    const currentPlayer = currentState.players[currentState.currentPlayerIndex];
    if (!currentPlayer.isAi) return;

    if (currentState.turnPhase === TurnPhase.PLAY) {
        setGameState(prev => prev ? ({ ...prev, isAiThinking: true }) : null);
        const aiMove = await getAiMove(currentState);
        
        setGameState(prev => {
            if (!prev) return null;
            let moveResult: MoveOutcome;
            
            if (aiMove) {
                moveResult = applyMove(prev, {
                    type: aiMove.moveType,
                    birdType: aiMove.birdType,
                    rowIndex: aiMove.rowIndex,
                    side: aiMove.side
                });
            } else {
                 const randomBird = currentPlayer.hand[0]; 
                 moveResult = applyMove(prev, {
                    type: MoveType.PLAY,
                    birdType: randomBird || BirdType.PARROT,
                    rowIndex: Math.floor(Math.random() * 4),
                    side: 'LEFT'
                });
            }

            if (moveResult.captured.length > 0) playSound('capture');
            else if (moveResult.drawn > 0) playSound('draw');
            else playSound('pop');

            return { ...moveResult.newState, isAiThinking: false };
        });
    } else if (currentState.turnPhase === TurnPhase.FLOCK_OR_PASS) {
        setTimeout(() => {
            setGameState(prev => {
                if (!prev) return null;
                const p = prev.players[prev.currentPlayerIndex];
                
                const handCounts = p.hand.reduce((acc, b) => { acc[b]=(acc[b]||0)+1; return acc; }, {} as Record<string, number>);
                const flockable = Object.keys(handCounts).find(key => {
                    const type = key as BirdType;
                    return handCounts[key]! >= BIRD_DATA[type].smallFlock;
                });

                if (flockable) {
                    const outcome = applyMove(prev, { type: MoveType.FLOCK, birdType: flockable as BirdType });
                    playSound('success');
                    return outcome.newState;
                } else {
                    const outcome = applyMove(prev, { type: MoveType.PASS });
                    return outcome.newState;
                }
            });
        }, 1500); 
    }
  }, []);

  useEffect(() => {
    if (gameState && gameState.status === 'PLAYING') {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.isAi && !gameState.isAiThinking) {
        executeAiTurn(gameState);
      }
    }
  }, [gameState, executeAiTurn]);

  const currentPlayer = gameState ? gameState.players[gameState.currentPlayerIndex] : null;
  // Determine if it is the HUMAN's turn
  const isHumanTurn = gameState ? (!currentPlayer?.isAi && !gameState.isAiThinking) : false;
  
  // Find the Human Player object (assuming ID 0 is human in AI mode, or current player in local)
  const humanPlayer = gameState?.players.find(p => !p.isAi) || gameState?.players[0];


  // Auto-Pass Timer Effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (isHumanTurn && gameState?.turnPhase === TurnPhase.FLOCK_OR_PASS) {
        setCountdown(timerDuration);
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

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.turnPhase, isHumanTurn, handlePass, timerDuration]);


  const handleSelectSide = (rowIndex: number, side: 'LEFT' | 'RIGHT') => {
    if (!gameState || !selectedBird || gameState.turnPhase !== TurnPhase.PLAY) return;
    
    const move: GameMove = { type: MoveType.PLAY, birdType: selectedBird, rowIndex, side };
    const outcome = applyMove(gameState, move);

    if (outcome.captured.length > 0) {
        playSound('capture');
        setGameState(outcome.newState);
        setSelectedBird(null);
    } else if (outcome.drawn > 0) {
        playSound('pop');
        setDrawConfirmation({ outcome });
    } else {
        // Round Ended immediately (0 drawn)
        // Hand emptied -> Deal New Hand -> Shift Player -> Turn Phase Reset
        // We do NOT need to ask for draw 2.
        setGameState(outcome.newState);
        setSelectedBird(null);
    }
  };

  const confirmDraw = () => {
      if (!drawConfirmation) return;
      playSound('draw');
      setGameState(drawConfirmation.outcome.newState);
      setDrawConfirmation(null);
      setSelectedBird(null);
  };

  const skipDraw = () => {
    if (!drawConfirmation) return;
    const modifiedState = JSON.parse(JSON.stringify(drawConfirmation.outcome.newState)) as GameState;
    const player = modifiedState.players[modifiedState.currentPlayerIndex];
    
    if (drawConfirmation.outcome.drawn === 2) {
        player.hand.pop();
        player.hand.pop();
        modifiedState.lastActionLog.push("...skipped drawing.");
    }
    setGameState(modifiedState);
    setDrawConfirmation(null);
    setSelectedBird(null);
  };

  const handleFlock = () => {
    if (!gameState || !selectedBird || gameState.turnPhase !== TurnPhase.FLOCK_OR_PASS) return;
    
    // Trigger Animation
    setFlockingBird(selectedBird);
    playSound('success');

    // Delay actual state update to allow animation to play
    setTimeout(() => {
        const outcome = applyMove(gameState, { type: MoveType.FLOCK, birdType: selectedBird });
        setGameState(outcome.newState);
        setSelectedBird(null);
        setFlockingBird(null);
    }, 600); // 600ms matches animation
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-4 font-sans text-stone-800">
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-indigo-600 mb-2 drop-shadow-sm tracking-tighter">
          CUBIRDS
        </h1>
        <p className="text-stone-500 mb-12 font-medium text-xl">The strategic card game of bird collection.</p>

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-white ring-1 ring-stone-200">
           <button 
             onClick={() => startGame(false)}
             className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-5 rounded-2xl mb-4 transition-all shadow-md hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
           >
             <span className="text-2xl">👥</span> Pass & Play
           </button>
           <button 
             onClick={() => startGame(true)}
             className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-md hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
           >
             <span className="text-2xl">✨</span> Play vs AI
           </button>
        </div>
        
        <button onClick={() => setShowRules(true)} className="mt-8 text-stone-400 font-bold hover:text-stone-600 hover:underline">
            How to Play?
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-[340px] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 px-4 py-3 flex justify-between items-center border-b border-stone-200">
         <div className="flex items-center gap-3">
             <button onClick={() => setShowQuitConfirm(true)} className="text-stone-400 hover:text-red-500 font-bold text-sm bg-stone-100 px-3 py-1 rounded-lg">← Exit</button>
             <div className="font-black text-xl text-stone-700 tracking-tighter">CUBIRDS</div>
         </div>
         <button onClick={() => setShowGuideMobile(true)} className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">Rules ℹ️</button>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center pt-4 md:pt-8 px-2 overflow-x-hidden w-full relative">
        <div className="hidden md:flex w-full max-w-5xl justify-between items-center mb-6 px-4">
             <div className="flex items-center gap-4">
                 <button onClick={() => setShowQuitConfirm(true)} className="text-stone-400 hover:text-red-500 font-bold px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-red-50 hover:border-red-200 transition-colors">← Quit Game</button>
                 <div className="font-black text-3xl text-stone-300 tracking-tighter">CUBIRDS</div>
             </div>
             {gameState.isAiThinking && (
                <div className="flex items-center gap-2 text-indigo-500 font-bold animate-pulse bg-indigo-50 px-4 py-2 rounded-full">✨ Gemini is thinking...</div>
             )}
             <div className="text-sm font-medium text-stone-400 bg-white px-3 py-1 rounded-full border border-stone-200 shadow-sm">
                Deck: {gameState.deck.length} | Round: {Math.ceil(gameState.lastActionLog.filter(l => l.includes('Round')).length)}
             </div>
        </div>

        <Collection players={gameState.players} currentPlayerId={gameState.currentPlayerIndex} />

        {!drawConfirmation && (
            <div className="w-full max-w-4xl text-center mb-4 h-8 flex items-center justify-center">
               <span className="inline-block bg-white border border-stone-200 text-stone-500 px-4 py-1.5 rounded-full text-xs font-medium shadow-sm transition-opacity duration-300">
                    {gameState.lastActionLog[gameState.lastActionLog.length - 1]}
               </span>
            </div>
        )}

        <div className="space-y-3 w-full max-w-4xl pb-10">
            {gameState.rows.map((row, idx) => (
                <Row 
                    key={idx} 
                    index={idx} 
                    birds={row} 
                    onSelectSide={handleSelectSide}
                    isCurrentPlayerTurn={isHumanTurn && gameState.turnPhase === TurnPhase.PLAY}
                    selectedBird={selectedBird}
                    pendingMove={null}
                />
            ))}
        </div>
      </main>

      {/* Draw 2 Modal */}
      {drawConfirmation && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm px-4">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-stone-100 w-full max-w-sm animate-bounce-in transform">
                <h3 className="text-center text-xl font-black text-stone-800 mb-2 uppercase tracking-tight">No Capture!</h3>
                <div className="bg-orange-50 rounded-xl p-4 mb-6 text-center">
                   <div className="flex flex-col items-center gap-2">
                       <span className="text-3xl font-black text-orange-400">Draw 2 Cards</span>
                       <p className="text-xs text-stone-400 mt-2">Or skip if you don't want them.</p>
                   </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={skipDraw} className="flex-1 py-3 rounded-xl font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors">Skip</button>
                    <button onClick={confirmDraw} className="flex-1 py-3 rounded-xl font-black bg-orange-400 text-white hover:bg-orange-500 shadow-lg hover:translate-y-[-2px] transition-all">CONFIRM</button>
                </div>
            </div>
         </div>
      )}

      {/* Quit Modal */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs text-center">
                <h3 className="font-bold text-lg mb-2">Quit Game?</h3>
                <div className="flex gap-2">
                    <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold">Cancel</button>
                    <button onClick={quitGame} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold">Quit</button>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar Guide */}
      <aside className="hidden md:block w-72 p-6 sticky top-0 h-screen overflow-y-auto border-l border-stone-200 bg-white/50 backdrop-blur-sm">
        <BirdGuide />
      </aside>

      {/* Mobile Guide */}
      {showGuideMobile && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex justify-end">
            <div className="w-4/5 h-full bg-white shadow-2xl animate-slide-in-right">
                <BirdGuide className="h-full rounded-none border-none" onClose={() => setShowGuideMobile(false)} />
            </div>
        </div>
      )}

      {/* Game Over */}
      {gameState.winner !== null && !viewBoardMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-900/80 backdrop-blur-md">
            <div className="bg-white p-10 rounded-3xl shadow-2xl text-center animate-bounce-in max-w-sm mx-4 border-4 border-white">
                <div className="text-7xl mb-6 filter drop-shadow-md">🏆</div>
                <h2 className="text-4xl font-black text-stone-800 mb-2">{gameState.players[gameState.winner].name} Wins!</h2>
                <div className="flex flex-col gap-3 mt-6">
                    <button onClick={() => setViewBoardMode(true)} className="w-full bg-stone-100 text-stone-600 px-8 py-4 rounded-xl font-bold shadow-sm hover:bg-stone-200 transition-all">
                        View Board
                    </button>
                    <button onClick={() => setGameState(null)} className="w-full bg-stone-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-stone-900 transition-all hover:scale-105">
                        Back to Menu
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* View Board Mode Overlay Button */}
      {viewBoardMode && (
          <div className="fixed top-4 right-4 z-[90]">
              <button 
                onClick={() => setViewBoardMode(false)}
                className="bg-stone-800 text-white px-6 py-3 rounded-full font-bold shadow-xl animate-bounce"
              >
                  Back to Results 🏆
              </button>
          </div>
      )}

      {/* Player Area - Always show Human (or P1) at bottom, but disabled if not turn */}
      {humanPlayer && (
        <div className={drawConfirmation ? 'pointer-events-none opacity-40 blur-[2px] transition-all duration-300' : 'transition-all duration-300'}>
            <PlayerArea 
                player={humanPlayer} 
                isCurrentTurn={isHumanTurn}
                phase={gameState.turnPhase}
                selectedBird={selectedBird}
                onSelectBird={(b) => { 
                    if (isHumanTurn) { playSound('click'); setSelectedBird(b); }
                }}
                onFlock={handleFlock}
                onPass={handlePass}
                isHidden={false} // Always visible to self
                countdown={countdown}
                onTimerSet={setTimerDuration}
                flockingBirdType={flockingBird}
            />
        </div>
      )}
    </div>
  );
};

export default App;