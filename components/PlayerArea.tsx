
import React, { useMemo, useEffect } from 'react';
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
  isHidden?: boolean; 
  onTimerSet?: (duration: number) => void; // New prop to bubble up timer duration
  countdown?: number | null;
  flockingBirdType?: BirdType | null; // For animation
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({ 
    player, 
    isCurrentTurn, 
    phase, 
    selectedBird, 
    onSelectBird, 
    onFlock, 
    onPass,
    isHidden,
    onTimerSet,
    countdown,
    flockingBirdType
}) => {
  
  // Group hand by bird type
  const groupedHand = useMemo(() => {
    const groups: Partial<Record<BirdType, number>> = {};
    player.hand.forEach(b => {
      groups[b] = (groups[b] || 0) + 1;
    });
    return groups;
  }, [player.hand]);

  // Check how many flocks are available total
  const flockOptions = useMemo(() => {
    let options = 0;
    Object.keys(groupedHand).forEach((key) => {
        const type = key as BirdType;
        const count = groupedHand[type] || 0;
        if (count >= BIRD_DATA[type].smallFlock) {
            options++;
        }
    });
    return options;
  }, [groupedHand]);

  // Is there AT LEAST one flockable bird in hand?
  const hasAnyFlockable = flockOptions > 0;

  // Can the CURRENTLY selected bird be flocked?
  const canCurrentSelectionFlock = useMemo(() => {
    if (!selectedBird) return false;
    const count = groupedHand[selectedBird] || 0;
    const config = BIRD_DATA[selectedBird];
    return count >= config.smallFlock;
  }, [selectedBird, groupedHand]);

  // Determine timer duration
  useEffect(() => {
    if (isCurrentTurn && phase === TurnPhase.FLOCK_OR_PASS && onTimerSet) {
        if (flockOptions === 0) onTimerSet(5);
        else if (flockOptions === 1) onTimerSet(15);
        else onTimerSet(20);
    }
  }, [isCurrentTurn, phase, flockOptions, onTimerSet]);

  const isPlayPhase = phase === TurnPhase.PLAY;
  const isFlockPhase = phase === TurnPhase.FLOCK_OR_PASS;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ${isCurrentTurn ? 'bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-stone-200 pb-2' : 'bg-stone-100/90 pb-2 border-t border-stone-200'}`}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
        
        {/* Info */}
        <div className="flex flex-col items-center md:items-start min-w-[120px] mb-2 md:mb-4 pt-4 md:pt-0">
          <h3 className={`font-bold text-lg transition-colors ${isCurrentTurn ? 'text-emerald-600' : 'text-stone-400'}`}>
            {isCurrentTurn ? (isPlayPhase ? "Play a Card" : "Flock or Pass") : "Opponent's Turn"}
          </h3>
          {!isHidden && (
              <div className="text-xs text-stone-400 font-medium">
                 {player.hand.length} cards in hand
              </div>
          )}
        </div>

        {/* Hand - Horizontal Scroll Enabled */}
        <div className="flex-1 w-full overflow-x-auto scrollbar-thin flex justify-start pb-4 pt-6 px-4">
            {/* Added mx-auto here to center content if it fits, but justify-start on parent prevents left clipping if it overflows */}
            <div className="flex items-end min-w-min mx-auto">
            {isHidden ? (
                // Hidden Hand (Opponent)
                 player.hand.map((_, i) => (
                    <div key={i} className="-ml-8 first:ml-0">
                         <Card type={BirdType.PARROT} isFaceDown mini /> 
                    </div>
                 ))
            ) : (
                // Visible Hand (Human)
                Object.keys(groupedHand).sort().map((key) => {
                    const type = key as BirdType;
                    const count = groupedHand[type] || 0;
                    const isSelected = selectedBird === type;
                    const isFlocking = flockingBirdType === type;
                    const canThisBirdFlock = count >= BIRD_DATA[type].smallFlock;
                    
                    const stackDepth = Math.min(count - 1, 2); 
                    
                    // If disabling interaction (e.g. not my turn)
                    const isDisabled = !isCurrentTurn;

                    return (
                        <div key={type} className={`
                            relative group mx-3 md:mx-6 transition-all flex-shrink-0 
                            ${isFlocking ? 'z-[100]' : ''} 
                            ${!isDisabled && !isFlocking ? 'hover:-translate-y-2 hover:z-[90]' : ''}
                            ${isDisabled ? 'opacity-80 grayscale-[0.3]' : ''}
                        `}>
                            
                            {/* Visual Stack Layers */}
                            {stackDepth >= 1 && (
                                <div className={`absolute top-0 left-0 w-full h-full transform -rotate-6 -translate-x-1.5 translate-y-1 z-0 ${isFlocking ? 'animate-fly-up delay-75' : ''}`}>
                                    <Card type={type} isStackPlaceholder />
                                </div>
                            )}
                            {stackDepth >= 2 && (
                                <div className={`absolute top-0 left-0 w-full h-full transform -rotate-3 -translate-x-0.5 translate-y-0.5 z-10 ${isFlocking ? 'animate-fly-up delay-100' : ''}`}>
                                    <Card type={type} isStackPlaceholder />
                                </div>
                            )}

                            {/* Quantity Badge */}
                            {!isFlocking && (
                                <div className={`
                                    absolute -top-4 -right-3 
                                    text-xs font-black w-7 h-7 
                                    rounded-full flex items-center justify-center 
                                    z-[50] border-[3px] shadow-sm transition-colors 
                                    ${isSelected ? 'bg-yellow-400 text-yellow-900 border-white' : 'bg-stone-800 text-white border-white'}
                                `}>
                                    {count}
                                </div>
                            )}
                            
                            {/* Flock Indicator Dot */}
                            {isFlockPhase && canThisBirdFlock && !isSelected && !isDisabled && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-ping z-[60]"></div>
                            )}

                            {/* Main Card */}
                            <div className="relative z-30">
                                <Card 
                                    type={type} 
                                    selected={isSelected} 
                                    isDimmed={!isDisabled && isFlockPhase && isSelected && !canCurrentSelectionFlock}
                                    isFlying={isFlocking}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            onSelectBird(isSelected ? null : type);
                                        }
                                    }}
                                    onDragStart={(e) => {
                                        if (!isDisabled && isPlayPhase) {
                                            onSelectBird(type);
                                        } else {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    );
                })
            )}
            </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 min-w-[160px] pb-4 md:pb-4">
             
             {isCurrentTurn && isFlockPhase ? (
                 <div className="flex flex-col gap-2 w-full">
                     <button 
                        onClick={onFlock}
                        // Enabled if we have a valid selection OR if we want to show the button as "hint" (though clicking needs logic)
                        disabled={!canCurrentSelectionFlock || isHidden}
                        className={`
                            w-full px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center relative overflow-hidden
                            ${canCurrentSelectionFlock && !isHidden
                                ? 'bg-stone-800 text-white hover:bg-black active:scale-95 shadow-md' 
                                : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'}
                            ${hasAnyFlockable && !canCurrentSelectionFlock && !isHidden ? 'animate-heartbeat ring-2 ring-emerald-400 ring-offset-2' : ''}
                        `}
                     >
                        {/* Dynamic Label */}
                        {canCurrentSelectionFlock 
                            ? `FLOCK (+${groupedHand[selectedBird!]! >= BIRD_DATA[selectedBird!].bigFlock ? 2 : 1})`
                            : hasAnyFlockable ? "Select a Set!" : "No Flocks"}
                     </button>
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={onPass}
                            disabled={isHidden}
                            className="flex-1 px-4 py-2 rounded-xl font-bold border-2 border-stone-300 text-stone-500 hover:bg-stone-100 active:scale-95 transition-all disabled:opacity-50"
                         >
                            End Turn
                         </button>
                         {countdown !== null && countdown !== undefined && (
                             <div className={`w-8 h-full flex items-center justify-center font-bold text-sm animate-pulse ${countdown < 5 ? 'text-red-500' : 'text-orange-500'}`}>
                                 {countdown}s
                             </div>
                         )}
                     </div>
                 </div>
             ) : (
                 <div className={`w-full px-6 py-4 rounded-xl border-2 border-dashed text-center font-bold text-sm ${isCurrentTurn ? 'border-stone-300 text-stone-400 bg-stone-50' : 'border-stone-200 text-stone-300'}`}>
                    {isCurrentTurn 
                        ? (selectedBird ? 'Click Row or Drag →' : 'Select Card') 
                        : 'Wait for turn...'}
                 </div>
             )}
             
             <div className="text-[10px] text-stone-400 text-center font-medium">
                {isCurrentTurn ? (isPlayPhase ? 'Phase 1: Play Cards' : 'Phase 2: Flock (Optional)') : 'Opponent Thinking'}
             </div>
        </div>
      </div>
    </div>
  );
};
