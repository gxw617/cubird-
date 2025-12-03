
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
  isFlying?: boolean; // New prop for flock animation
  onDragStart?: (e: React.DragEvent) => void;
}

export const Card: React.FC<CardProps> = ({ 
  type, 
  onClick, 
  selected, 
  mini, 
  stacked, 
  isGhost, 
  isDimmed, 
  isStackPlaceholder,
  isFaceDown,
  isFlying,
  onDragStart 
}) => {
  const bird = BIRD_DATA[type];

  // --- SAFETY CHECK ---
  // If bird data is missing (invalid type or sync issue), return a placeholder to prevent crash
  if (!bird && !isFaceDown) {
      return (
        <div className="w-14 h-20 bg-stone-200 rounded border-2 border-stone-300 flex items-center justify-center text-stone-400 font-bold select-none">
            ?
        </div>
      );
  }
  
  // Consistent Palette Logic mapped to constants
  const getPalette = (bgClass: string) => {
    switch (bgClass) {
      // Parrot (Emerald)
      case 'bg-emerald-500': return { base: 'bg-[#6EE7B7]', border: 'border-[#10B981]', text: 'text-[#064E3B]' };
      // Owl (Indigo)
      case 'bg-indigo-400': return { base: 'bg-[#A5B4FC]', border: 'border-[#6366F1]', text: 'text-[#312E81]' };
      // Flamingo (Rose)
      case 'bg-rose-400': return { base: 'bg-[#FDA4AF]', border: 'border-[#F43F5E]', text: 'text-[#881337]' };
      // Toucan (Orange)
      case 'bg-orange-400': return { base: 'bg-[#FDBA74]', border: 'border-[#F97316]', text: 'text-[#7C2D12]' };
      // Duck (Amber/Yellow)
      case 'bg-amber-300': return { base: 'bg-[#FCD34D]', border: 'border-[#F59E0B]', text: 'text-[#78350F]' };
      // Magpie (Stone)
      case 'bg-stone-500': return { base: 'bg-[#D6D3D1]', border: 'border-[#78716C]', text: 'text-[#292524]' };
      // Reed Warbler (Sky)
      case 'bg-sky-500': return { base: 'bg-[#7DD3FC]', border: 'border-[#0EA5E9]', text: 'text-[#0C4A6E]' };
      // Robin (Deep Amber/Brown)
      case 'bg-amber-700': return { base: 'bg-[#D4A373]', border: 'border-[#B45309]', text: 'text-[#451A03]' };
      
      default: return { base: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' };
    }
  };

  const palette = bird ? getPalette(bird.color) : { base: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' };

  // Interaction classes
  const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';
  const dragClass = onDragStart && !isFaceDown ? 'cursor-grab active:cursor-grabbing' : '';
  
  // Animations
  const animClass = !mini && !isGhost && !isStackPlaceholder && !isFlying ? 'animate-[bounceIn_0.4s_ease-out]' : '';
  const flyClass = isFlying ? 'animate-fly-up z-[100] pointer-events-none' : '';
  
  // State styles
  const stateClasses = isGhost 
    ? 'opacity-50 border-dashed bg-white' 
    : isDimmed 
        ? 'opacity-40 grayscale contrast-125' 
        : `opacity-100 shadow-[0_2px_0px_rgba(0,0,0,0.05)] ${palette.base}`; 

  // Selection visual logic
  const selectedClasses = selected 
    ? 'ring-[4px] ring-offset-2 ring-stone-800 -translate-y-6 z-20 shadow-xl' 
    : !isGhost && !isDimmed && !isStackPlaceholder && onClick && !isFaceDown && !isFlying ? 'hover:-translate-y-2 hover:shadow-md' : '';

  const stackClasses = stacked ? '-ml-16 hover:ml-2 hover:z-50 transition-all' : '';

  // Container sizing
  const cardSizeClasses = mini 
    ? 'w-14 h-14 rounded-xl border-2' 
    : 'w-28 h-40 rounded-2xl border-[3px]';

  // Base container
  const baseClasses = `
    relative flex flex-col items-center
    transition-all duration-300 select-none overflow-hidden
    ${isFaceDown ? 'bg-stone-300 border-stone-400' : `${palette.border} ${stateClasses}`} 
    ${cursorClass} ${dragClass} ${cardSizeClasses} ${animClass} ${flyClass}
  `;

  // --- Stack Placeholder Render ---
  if (isStackPlaceholder) {
      return (
          <div className={`${baseClasses} shadow-sm opacity-90 ${isFaceDown ? 'bg-stone-300' : ''}`} />
      );
  }

  // --- Mini Card Render (Collection Token) ---
  if (mini && bird) {
    return (
      <div className={`${baseClasses} ${selectedClasses} justify-center`} onClick={onClick}>
        <span className="text-3xl leading-none filter drop-shadow-[0_2px_0_rgba(0,0,0,0.15)] select-none transform transition-transform hover:scale-110">
            {bird.emoji}
        </span>
      </div>
    );
  }

  // --- Face Down Card (Opponent) ---
  if (isFaceDown) {
      return (
        <div className={`flex flex-col items-center group ${stackClasses}`}>
            <div className={baseClasses}>
                <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-500 via-stone-400 to-stone-500 bg-[length:10px_10px]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl opacity-30">🐦</span>
                </div>
            </div>
        </div>
      );
  }

  // --- Standard Card Render ---
  return (
    <div className={`flex flex-col items-center group ${stackClasses} ${selectedClasses}`}>
      
      <div 
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        className={baseClasses}
        onClick={onClick}
      >
        {/* Flock Badge (Printed Effect) */}
        {!isGhost && !isFlying && bird && (
            <div className={`
                absolute top-2 right-3
                text-[13px] font-black tracking-tighter
                ${palette.text} leading-none select-none opacity-80
            `}>
                {bird.smallFlock}/{bird.bigFlock}
            </div>
        )}

        {/* Center: Emoji */}
        <div className="flex-1 flex items-center justify-center w-full pt-4 pb-6">
          {/* Enhanced 3D Drop Shadow */}
          <span className="text-6xl filter drop-shadow-[0_4px_1px_rgba(0,0,0,0.3)] transform group-hover:scale-110 group-active:scale-95 transition-transform duration-300 select-none">
              {bird ? bird.emoji : '?'}
          </span>
          
          {isDimmed && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/40 backdrop-blur-[1px]">
                  <div className="text-stone-800 font-black -rotate-12 text-[10px] border-2 border-stone-800 rounded bg-white px-2 py-1 shadow-md whitespace-nowrap">
                      TAKEN
                  </div>
              </div>
          )}
        </div>

        {/* Name (Printed Effect) */}
        {!isGhost && !isFlying && bird && (
            <div className={`
                absolute bottom-3 w-full text-center
                text-[11px] font-black uppercase tracking-widest
                ${palette.text} opacity-80 select-none
            `}>
                {bird.name}
            </div>
        )}
      </div>
    </div>
  );
};
