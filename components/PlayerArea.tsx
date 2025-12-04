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
  isHidden?: boolean; 
  countdown?: number | null;
  flockingBirdType?: BirdType | null; 
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({ 
    player, isCurrentTurn, phase, selectedBird, onSelectBird, onFlock, onPass, isHidden, countdown, flockingBirdType
}) => {
  const groupedHand = useMemo(() => {
    const groups: Partial<Record<BirdType, number>> = {};
    player.hand.forEach(b => { groups[b] = (groups[b] || 0) + 1; });
    return groups;
  }, [player.hand]);

  const flockOptions = useMemo(() => {
    let options = 0;
    Object.keys(groupedHand).forEach((key) => {
        const type = key as BirdType;
        if (groupedHand[type]! >= BIRD_DATA[type].smallFlock) options++;
    });
    return options;
  }, [groupedHand]);

  const hasAnyFlockable = flockOptions > 0;
  const canCurrentSelectionFlock = useMemo(() => {
    if (!selectedBird) return false;
    return groupedHand[selectedBird]! >= BIRD_DATA[selectedBird].smallFlock;
  }, [selectedBird, groupedHand]);

  const isPlayPhase = phase === TurnPhase.PLAY;
  const isFlockPhase = phase === TurnPhase.FLOCK_OR_PASS;
  const isDrawDecision = phase === TurnPhase.DRAW_DECISION;

  return (
    <div className={`
        fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 
        ${isCurrentTurn ? 'bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]' : 'bg-stone-100/90'}
        border-t border-stone-200 pb-2 md:pb-4
    `}>
      <div className="max-w-7xl mx-auto px-2 md:px-4 flex flex-col md:flex-row items-center md:items-end justify-between gap-2 md:gap-4">
        
        <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full md:w-auto md:min-w-[120px] pt-2 md:pt-0 px-2 md:px-0">
          <h3 className={`font-bold text-sm md:text-lg transition-colors ${isCurrentTurn ? 'text-emerald-600' : 'text-stone-400'}`}>
            {isCurrentTurn 
                ? (isDrawDecision ? "Draw Cards?" : isPlayPhase ? "Play a Card" : "Flock or Pass") 
                : "Opponent's Turn"}
          </h3>
          {!isHidden && <div className="text-[10px] md:text-xs text-stone-400 font-medium">{player.hand.length} cards</div>}
        </div>

        {/* Hand - Allow Scrolling ALWAYS, added padding-top to fix badge clipping */}
        <div className={`flex-1 w-full overflow-x-auto scrollbar-thin flex justify-start pt-6 pb-2 px-4 ${!isCurrentTurn ? 'opacity-80' : ''}`}>
            <div className="flex items-end min-w-min mx-auto md:pb-2">
            {isHidden ? (
                 player.hand.map((_, i) => (
                    <div key={i} className="-ml-8 md:-ml-10 first:ml-0 scale-75 md:scale-100 origin-bottom"><Card type={BirdType.PARROT} isFaceDown mini /></div>
                 ))
            ) : (
                Object.keys(groupedHand).sort().map((key) => {
                    const type = key as BirdType;
                    const count = groupedHand[type] || 0;
                    const isSelected = selectedBird === type;
                    const isFlocking = flockingBirdType === type;
                    const canThisBirdFlock = count >= BIRD_DATA[type].smallFlock;
                    const stackDepth = Math.min(count - 1, 2); 
                    const isDisabled = !isCurrentTurn || isDrawDecision; // Disable selection during Draw Decision

                    return (
                        <div key={type} className={`
                            relative group mx-2 md:mx-4 transition-all flex-shrink-0 
                            ${isFlocking ? 'z-[100]' : ''} 
                            ${!isDisabled && !isFlocking ? 'hover:-translate-y-2 hover:z-[90]' : ''}
                            ${isDisabled ? 'cursor-default' : 'cursor-pointer'}
                            scale-90 md:scale-100 origin-bottom
                        `}>
                            {stackDepth >= 1 && <div className={`absolute top-0 left-0 w-full h-full transform -rotate-6 -translate-x-1.5 translate-y-1 z-0 ${isFlocking ? 'animate-fly-up delay-75' : ''}`}><Card type={type} isStackPlaceholder /></div>}
                            {stackDepth >= 2 && <div className={`absolute top-0 left-0 w-full h-full transform -rotate-3 -translate-x-0.5 translate-y-0.5 z-10 ${isFlocking ? 'animate-fly-up delay-100' : ''}`}><Card type={type} isStackPlaceholder /></div>}
                            {!isFlocking && (
                                <div className={`absolute -top-4 -right-2 md:-top-4 md:-right-3 text-[10px] md:text-xs font-black w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center z-[50] border-[2px] md:border-[3px] shadow-sm transition-colors ${isSelected ? 'bg-yellow-400 text-yellow-900 border-white' : 'bg-stone-800 text-white border-white'}`}>{count}</div>
                            )}
                            {isFlockPhase && canThisBirdFlock && !isSelected && !isDisabled && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-ping z-[60]"></div>}
                            <div className={`relative z-30 ${isDisabled ? 'pointer-events-none grayscale-[0.3]' : ''}`}>
                                <Card 
                                    type={type} selected={isSelected} isDimmed={!isDisabled && isFlockPhase && isSelected && !canCurrentSelectionFlock} isFlying={isFlocking}
                                    onClick={() => !isDisabled && onSelectBird(isSelected ? null : type)}
                                    onDragStart={(e) => { if (!isDisabled && isPlayPhase) onSelectBird(type); else e.preventDefault(); }}
                                />
                            </div>
                        </div>
                    );
                })
            )}
            </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto md:min-w-[160px] pb-2 md:pb-4 px-4 md:px-0">
             {isCurrentTurn && isFlockPhase ? (
                 <div className="flex flex-row md:flex-col gap-2 w-full">
                     <button onClick={onFlock} disabled={!canCurrentSelectionFlock || isHidden} className={`flex-1 md:w-full px-4 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center text-xs md:text-sm ${canCurrentSelectionFlock && !isHidden ? 'bg-stone-800 text-white hover:bg-black active:scale-95 shadow-md' : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'} ${hasAnyFlockable && !canCurrentSelectionFlock && !isHidden ? 'animate-heartbeat ring-2 ring-emerald-400 ring-offset-2' : ''}`}>
                        {canCurrentSelectionFlock ? `FLOCK (+${groupedHand[selectedBird!]! >= BIRD_DATA[selectedBird!].bigFlock ? 2 : 1})` : hasAnyFlockable ? "Select Set" : "No Flocks"}
                     </button>
                     <div className="flex-1 md:w-full flex items-center gap-2">
                         <button onClick={onPass} disabled={isHidden} className="flex-1 px-4 py-2 rounded-xl font-bold border-2 border-stone-300 text-stone-500 hover:bg-stone-100 active:scale-95 transition-all disabled:opacity-50 text-xs md:text-sm">Pass</button>
                         {countdown !== null && countdown !== undefined && <div className={`hidden md:flex w-8 h-full items-center justify-center font-bold text-sm animate-pulse ${countdown < 5 ? 'text-red-500' : 'text-orange-500'}`}>{countdown}s</div>}
                     </div>
                 </div>
             ) : (
                 <div className={`w-full px-6 py-3 md:py-4 rounded-xl border-2 border-dashed text-center font-bold text-xs md:text-sm ${isCurrentTurn ? 'border-stone-300 text-stone-400 bg-stone-50' : 'border-stone-200 text-stone-300'}`}>
                    {isCurrentTurn ? (isDrawDecision ? 'Decide...' : selectedBird ? 'Click Row or Drag' : 'Select Card') : 'Wait...'}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};