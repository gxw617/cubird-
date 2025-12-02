
import React, { useMemo } from 'react';
import { Player, BirdType, TurnPhase } from '../types';
import { Card } from './Card';
import { BIRD_DATA } from '../constants';

interface PlayerAreaProps {
  player: Player;
  isCurrentTurn: boolean;
  phase: TurnPhase;
  selectedBird: BirdType | null;
  onSelectBird: (bird: BirdType | null) => void;
  onFlock: () => void;
  onPass: () => void;
  isHidden?: boolean; // New prop to hide cards (for AI/Opponent)
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({ 
    player, 
    isCurrentTurn, 
    phase, 
    selectedBird, 
    onSelectBird, 
    onFlock, 
    onPass,
    isHidden
}) => {
  
  // Group hand by bird type
  const groupedHand = useMemo(() => {
    const groups: Partial<Record<BirdType, number>> = {};
    player.hand.forEach(b => {
      groups[b] = (groups[b] || 0) + 1;
    });
    return groups;
  }, [player.hand]);

  // Determine if selected bird can be flocked
  const canFlock = useMemo(() => {
    if (!selectedBird) return false;
    const count = groupedHand[selectedBird] || 0;
    const config = BIRD_DATA[selectedBird];
    return count >= config.smallFlock;
  }, [selectedBird, groupedHand]);

  const isPlayPhase = phase === TurnPhase.PLAY;
  const isFlockPhase = phase === TurnPhase.FLOCK_OR_PASS;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ${isCurrentTurn ? 'bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-stone-200 pb-2' : 'bg-stone-200/90 pb-2 translate-y-2'}`}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
        
        {/* Info */}
        <div className="flex flex-col items-center md:items-start min-w-[120px] mb-2 md:mb-4 pt-4 md:pt-0">
          <h3 className={`font-bold text-lg transition-colors ${isCurrentTurn ? 'text-emerald-600' : 'text-stone-400'}`}>
            {isCurrentTurn ? (isPlayPhase ? "Play a Card" : "Flock or Pass") : `${player.name}'s Turn`}
          </h3>
          <div className="text-xs text-stone-400 font-medium">
             {player.hand.length} cards in hand
          </div>
        </div>

        {/* Hand */}
        <div className="flex-1 w-full overflow-x-auto scrollbar-hide flex justify-center pb-2 pt-6">
            <div className="flex items-end pl-20 md:pl-0 pr-20 md:pr-0">
            {Object.keys(groupedHand).sort().map((key) => {
                const type = key as BirdType;
                const count = groupedHand[type] || 0;
                const isSelected = selectedBird === type;
                
                // Determine visual stack depth (max 2 extra layers for clean UI)
                const stackDepth = Math.min(count - 1, 2); 
                
                return (
                    <div key={type} className={`relative group mx-3 transition-transform ${isCurrentTurn && !isHidden ? 'hover:-translate-y-2' : ''}`}>
                        
                        {/* Visual Stack Layers (Underlays) */}
                        {stackDepth >= 1 && (
                            <div className="absolute top-0 left-0 w-full h-full transform -rotate-6 -translate-x-3 translate-y-1 z-0">
                                <Card type={type} isStackPlaceholder isFaceDown={isHidden} />
                            </div>
                        )}
                        {stackDepth >= 2 && (
                            <div className="absolute top-0 left-0 w-full h-full transform -rotate-3 -translate-x-1.5 translate-y-0.5 z-10">
                                <Card type={type} isStackPlaceholder isFaceDown={isHidden} />
                            </div>
                        )}

                        {/* Quantity Badge (Floating over stack) */}
                        <div className={`
                            absolute -top-4 -right-3 
                            text-xs font-black w-7 h-7 
                            rounded-full flex items-center justify-center 
                            z-30 border-[3px] shadow-sm transition-colors 
                            ${isSelected ? 'bg-yellow-400 text-yellow-900 border-white' : 'bg-stone-800 text-white border-white'}
                        `}>
                            {count}
                        </div>

                        {/* Main Interactive Card */}
                        <div className="relative z-20">
                            <Card 
                                type={type} 
                                selected={isSelected} 
                                isFaceDown={isHidden}
                                isDimmed={!isHidden && isCurrentTurn && isFlockPhase && !canFlock && isSelected}
                                onClick={() => {
                                    if (isCurrentTurn && !isHidden) {
                                        onSelectBird(isSelected ? null : type);
                                    }
                                }}
                                onDragStart={(e) => {
                                    if (isCurrentTurn && isPlayPhase && !isHidden) {
                                        onSelectBird(type);
                                    } else {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                    </div>
                );
            })}
            </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 min-w-[160px] pb-4 md:pb-4">
             
             {isFlockPhase ? (
                 <div className="flex flex-col gap-2 w-full">
                     <button 
                        onClick={onFlock}
                        disabled={!canFlock || isHidden}
                        className={`
                            w-full px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center
                            ${canFlock && !isHidden
                                ? 'bg-stone-800 text-white hover:bg-black active:scale-95 shadow-md' 
                                : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'}
                        `}
                     >
                        FLOCK {canFlock && selectedBird ? `(+${groupedHand[selectedBird]! >= BIRD_DATA[selectedBird].bigFlock ? 2 : 1})` : ''}
                     </button>
                     <button 
                        onClick={onPass}
                        disabled={isHidden}
                        className="w-full px-6 py-2 rounded-xl font-bold border-2 border-stone-300 text-stone-500 hover:bg-stone-100 active:scale-95 transition-all disabled:opacity-50"
                     >
                        End Turn
                     </button>
                 </div>
             ) : (
                 <div className="w-full px-6 py-4 rounded-xl border-2 border-dashed border-stone-300 text-stone-400 text-center font-bold text-sm bg-stone-50">
                    {isHidden ? 'Opponent Playing...' : selectedBird ? 'Click Row or Drag →' : 'Select Card'}
                 </div>
             )}
             
             <div className="text-[10px] text-stone-400 text-center font-medium">
                {isPlayPhase ? 'Phase 1: Play Cards' : 'Phase 2: Flock (Optional)'}
             </div>
        </div>
      </div>
    </div>
  );
};
