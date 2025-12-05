import React from 'react';
import { BirdType } from '../types';
import { BIRD_DATA } from '../constants';

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
  
  const getPalette = (bgClass: string) => {
    switch (bgClass) {
      case 'bg-stone-500': return { base: 'bg-[#A8A29E]', border: 'border-[#78716C]', text: 'text-[#292524]' }; // Sparrow (Grey/Brown)
      case 'bg-indigo-600': return { base: 'bg-[#4F46E5]', border: 'border-[#312E81]', text: 'text-[#1E1B4B]' }; // Swallow (Dark Blue)
      case 'bg-pink-400': return { base: 'bg-[#F472B6]', border: 'border-[#DB2777]', text: 'text-[#831843]' }; // Tit-warbler (Pink)
      case 'bg-orange-500': return { base: 'bg-[#F97316]', border: 'border-[#C2410C]', text: 'text-[#7C2D12]' }; // Mandarin Duck (Orange)
      case 'bg-amber-300': return { base: 'bg-[#FCD34D]', border: 'border-[#F59E0B]', text: 'text-[#78350F]' }; // Hoopoe (Yellow)
      case 'bg-cyan-500': return { base: 'bg-[#06B6D4]', border: 'border-[#0891B2]', text: 'text-[#164E63]' }; // Kingfisher (Cyan)
      case 'bg-emerald-600': return { base: 'bg-[#059669]', border: 'border-[#047857]', text: 'text-[#022C22]' }; // Peacock (Green)
      case 'bg-rose-500': return { base: 'bg-[#F43F5E]', border: 'border-[#E11D48]', text: 'text-[#881337]' }; // Crane (Red/White)
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
    ? 'w-[3.5rem] h-[3.5rem] rounded-xl border-2' 
    : 'w-[5.5rem] h-[8rem] md:w-28 md:h-40 rounded-2xl border-[3px]';

  const baseClasses = `
    relative flex flex-col items-center flex-shrink-0
    transition-all duration-300 select-none overflow-hidden
    ${isFaceDown ? 'bg-stone-300 border-stone-400' : `${palette.border} ${stateClasses}`} 
    ${cursorClass} ${dragClass} ${cardSizeClasses} ${animClass} ${flyClass}
  `;

  if (isStackPlaceholder) return <div className={`${baseClasses} shadow-sm opacity-90 ${isFaceDown ? 'bg-stone-300' : ''}`} />;

  if (mini && bird) {
    return (
      <div className={`${baseClasses} ${selectedClasses} justify-center`} onClick={onClick}>
        <img 
            src={bird.imgUrl} 
            alt={bird.name}
            className="w-8 h-8 md:w-10 md:h-10 object-contain filter drop-shadow-[0_2px_0_rgba(0,0,0,0.15)] select-none pointer-events-none transform transition-transform hover:scale-110"
        />
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
        {!isGhost && !isFlying && bird && (
            <div className={`absolute top-2 right-2 md:right-3 text-[10px] md:text-[13px] font-black tracking-tighter ${palette.text} leading-none select-none opacity-80`}>
                {bird.smallFlock}/{bird.bigFlock}
            </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center w-full pt-1 pb-4">
          <img 
            src={bird.imgUrl} 
            alt={bird.name}
            className="w-12 h-12 md:w-20 md:h-20 object-contain filter drop-shadow-[0_4px_1px_rgba(0,0,0,0.3)] transform group-hover:scale-110 group-active:scale-95 transition-transform duration-300 select-none pointer-events-none"
          />
          {isDimmed && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/40 backdrop-blur-[1px]">
                  <div className="text-stone-800 font-black -rotate-12 text-[10px] border-2 border-stone-800 rounded bg-white px-2 py-1 shadow-md whitespace-nowrap">TAKEN</div>
              </div>
          )}
        </div>
        {!isGhost && !isFlying && bird && (
            <div className={`absolute bottom-2 w-full text-center text-[9px] md:text-[10px] font-black uppercase tracking-widest ${palette.text} opacity-90 select-none flex flex-col leading-tight`}>
                <span>{bird.cnName}</span>
                <span className="text-[7px] md:text-[8px] opacity-75">{bird.name}</span>
            </div>
        )}
      </div>
    </div>
  );
};