
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
  isFaceDown?: boolean; // NEW: Render card back
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
  onDragStart 
}) => {
  const bird = BIRD_DATA[type];
  
  // Define a rich, full-card color palette
  const getPalette = (bgClass: string) => {
    switch (bgClass) {
      case 'bg-green-500': return { base: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' };
      case 'bg-indigo-600': return { base: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-900' };
      case 'bg-pink-500': return { base: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-900' };
      case 'bg-orange-500': return { base: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-900' };
      case 'bg-yellow-400': return { base: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900' };
      case 'bg-slate-700': return { base: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-900' };
      case 'bg-emerald-600': return { base: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900' };
      case 'bg-blue-500': return { base: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' };
      case 'bg-red-500': return { base: 'bg-red-100', border: 'border-red-400', text: 'text-red-900' };
      default: return { base: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-900' };
    }
  };

  const palette = getPalette(bird.color);

  // Interaction classes
  const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';
  const dragClass = onDragStart && !isFaceDown ? 'cursor-grab active:cursor-grabbing' : '';
  
  // State styles
  const stateClasses = isGhost 
    ? 'opacity-50 border-dashed bg-white' 
    : isDimmed 
        ? 'opacity-40 grayscale contrast-125' 
        : `opacity-100 shadow-[0_2px_0px_rgba(0,0,0,0.05)] ${palette.base}`; 

  // Selection visual logic
  const selectedClasses = selected 
    ? 'ring-[4px] ring-offset-2 ring-stone-800 -translate-y-6 z-20 shadow-xl' 
    : !isGhost && !isDimmed && !isStackPlaceholder && onClick && !isFaceDown ? 'hover:-translate-y-2 hover:shadow-md' : '';

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
    ${cursorClass} ${dragClass} ${cardSizeClasses}
  `;

  // --- Stack Placeholder Render ---
  if (isStackPlaceholder) {
      return (
          <div className={`${baseClasses} shadow-sm opacity-90 ${isFaceDown ? 'bg-stone-300' : ''}`} />
      );
  }

  // --- Mini Card Render (Collection Token) ---
  if (mini) {
    return (
      <div className={`${baseClasses} ${selectedClasses} justify-center`} onClick={onClick}>
        <span className="text-3xl leading-none filter drop-shadow-sm select-none transform transition-transform hover:scale-110">
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
        {/* Top Right: Flock Badge */}
        {!isGhost && (
            <div className={`
                absolute top-2 right-3
                text-[13px] font-black tracking-tighter
                ${palette.text} leading-none select-none
            `}>
                {bird.smallFlock}/{bird.bigFlock}
            </div>
        )}

        {/* Center: Emoji */}
        <div className="flex-1 flex items-center justify-center w-full pt-4 pb-6">
          <span className="text-6xl filter drop-shadow-sm transform group-hover:scale-110 group-active:scale-95 transition-transform duration-300 select-none">
              {bird.emoji}
          </span>
          
          {isDimmed && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/40 backdrop-blur-[1px]">
                  <div className="text-stone-800 font-black -rotate-12 text-[10px] border-2 border-stone-800 rounded bg-white px-2 py-1 shadow-md whitespace-nowrap">
                      TAKEN
                  </div>
              </div>
          )}
        </div>

        {/* Bottom: Name */}
        {!isGhost && (
            <div className={`
                absolute bottom-3 w-full text-center
                text-[11px] font-black uppercase tracking-widest
                ${palette.text} opacity-90 select-none
            `}>
                {bird.name}
            </div>
        )}
      </div>
    </div>
  );
};
