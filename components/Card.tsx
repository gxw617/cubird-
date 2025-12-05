import React from 'react';
import { BirdType } from '../types';
import { BIRD_DATA, BIRD_SPRITE_URL } from '../constants';

interface CardProps {
  type: BirdType;
  onClick?: () => void;
  selected?: boolean;
  mini?: boolean;
  stacked?: boolean; 
  isGhost?: boolean; 
  isDimmed?: boolean; 
  isStackPlaceholder?: boolean;
  isFaceDown?: boolean; 
  isFlying?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export const Card: React.FC<CardProps> = ({ 
  type, onClick, selected, mini, stacked, isGhost, isDimmed, 
  isStackPlaceholder, isFaceDown, isFlying, onDragStart 
}) => {
  const bird = BIRD_DATA[type];

  if (!bird && !isFaceDown) {
      return <div className="w-[3.5rem] h-[5rem] bg-stone-200 rounded border-2 border-stone-300 flex items-center justify-center text-stone-400 font-bold select-none">?</div>;
  }
  
  // Palette is still used for border/shadow colors to match the card theme
  const getPalette = (bgClass: string) => {
    switch (bgClass) {
      case 'bg-stone-300': return { base: 'bg-[#D6D3D1]', border: 'border-[#A8A29E]', text: 'text-[#292524]' };
      case 'bg-blue-300': return { base: 'bg-[#93C5FD]', border: 'border-[#60A5FA]', text: 'text-[#1E3A8A]' };
      case 'bg-purple-300': return { base: 'bg-[#D8B4FE]', border: 'border-[#C084FC]', text: 'text-[#581C87]' };
      case 'bg-emerald-300': return { base: 'bg-[#6EE7B7]', border: 'border-[#34D399]', text: 'text-[#064E3B]' };
      case 'bg-amber-200': return { base: 'bg-[#FDE68A]', border: 'border-[#FCD34D]', text: 'text-[#78350F]' };
      case 'bg-cyan-300': return { base: 'bg-[#67E8F9]', border: 'border-[#22D3EE]', text: 'text-[#164E63]' };
      case 'bg-orange-200': return { base: 'bg-[#FED7AA]', border: 'border-[#FDBA74]', text: 'text-[#7C2D12]' };
      case 'bg-slate-300': return { base: 'bg-[#CBD5E1]', border: 'border-[#94A3B8]', text: 'text-[#0F172A]' };
      default: return { base: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' };
    }
  };

  const palette = bird ? getPalette(bird.color) : { base: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' };

  const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';
  const dragClass = onDragStart && !isFaceDown ? 'cursor-grab active:cursor-grabbing' : '';
  const animClass = !mini && !isGhost && !isStackPlaceholder && !isFlying ? 'animate-[bounceIn_0.4s_ease-out]' : '';
  const flyClass = isFlying ? 'animate-fly-up z-[100] pointer-events-none' : '';
  
  const stateClasses = isGhost 
    ? 'opacity-50 border-dashed bg-white' 
    : isDimmed 
        ? 'opacity-40 grayscale contrast-125' 
        : `opacity-100 shadow-[0_2px_0px_rgba(0,0,0,0.05)] ${palette.base}`; 

  const selectedClasses = selected 
    ? 'ring-[4px] ring-offset-2 ring-stone-800 -translate-y-6 z-20 shadow-xl' 
    : !isGhost && !isDimmed && !isStackPlaceholder && onClick && !isFaceDown && !isFlying ? 'hover:-translate-y-2 hover:shadow-md' : '';

  const stackClasses = stacked ? '-ml-16 hover:ml-2 hover:z-50 transition-all' : '';

  const cardSizeClasses = mini 
    ? 'w-[3.5rem] h-[5rem] rounded-md border-[1px]' // Mini uses same aspect ratio now
    : 'w-[5.5rem] h-[8rem] md:w-28 md:h-40 rounded-xl border-[1px]'; // Thinner border for full image cards

  const baseClasses = `
    relative flex flex-col items-center flex-shrink-0
    transition-all duration-300 select-none overflow-hidden
    ${isFaceDown ? 'bg-stone-300 border-stone-400' : `${palette.border} ${stateClasses}`} 
    ${cursorClass} ${dragClass} ${cardSizeClasses} ${animClass} ${flyClass}
  `;

  // Render content logic
  const renderCardFace = () => {
      // Use Sprite if available
      if (bird && bird.spritePos) {
          return (
              <div 
                className="w-full h-full bg-no-repeat bg-cover"
                style={{
                    backgroundImage: `url(${BIRD_SPRITE_URL})`,
                    backgroundPosition: bird.spritePos,
                    backgroundSize: '200% 400%' // 2 cols, 4 rows
                }}
              >
                  {/* Overlay for Dimmed state (Taken cards) */}
                  {isDimmed && (
                      <div className="w-full h-full bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-stone-800 font-black -rotate-12 text-[10px] border-2 border-stone-800 rounded bg-white px-2 py-1 shadow-md whitespace-nowrap">TAKEN</span>
                      </div>
                  )}
              </div>
          );
      }
      
      // Fallback (should not happen if sprite is setup)
      return (
          <>
            <div className="absolute top-2 right-2 text-xs font-bold">{bird.smallFlock}/{bird.bigFlock}</div>
            <div className="flex-1 flex items-center justify-center text-4xl">{bird.emoji}</div>
            <div className="absolute bottom-2 text-xs font-bold">{bird.name}</div>
          </>
      );
  };

  if (isStackPlaceholder) return <div className={`${baseClasses} shadow-sm opacity-90 ${isFaceDown ? 'bg-stone-300' : ''}`} />;

  if (mini && bird) {
    return (
      <div className={`${baseClasses} ${selectedClasses} justify-center`} onClick={onClick}>
         {/* Mini cards just show the full card scaled down */}
         {renderCardFace()}
      </div>
    );
  }

  if (isFaceDown) {
      return (
        <div className={`flex flex-col items-center group ${stackClasses}`}>
            <div className={baseClasses}>
                <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-500 via-stone-400 to-stone-500 bg-[length:10px_10px]"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30 select-none">🐦</div>
            </div>
        </div>
      );
  }

  return (
    <div className={`flex flex-col items-center group ${stackClasses} ${selectedClasses}`}>
      <div draggable={!!onDragStart} onDragStart={onDragStart} className={baseClasses} onClick={onClick}>
        {renderCardFace()}
      </div>
    </div>
  );
};