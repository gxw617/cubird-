
import React from 'react';
import { BirdType } from '../types';
import { BIRD_DATA } from '../constants';

interface CardProps {
  type: BirdType;
  onClick?: () => void;
  selected?: boolean;
  mini?: boolean;
  stacked?: boolean; // For legacy row stacking if needed
  isGhost?: boolean; // For previewing placement
  isDimmed?: boolean; // For previewing capture
  isStackPlaceholder?: boolean; // NEW: If true, renders a simplified version for the "stack" effect
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
  onDragStart 
}) => {
  const bird = BIRD_DATA[type];
  
  // Define a rich, full-card color palette
  const getPalette = (bgClass: string) => {
    switch (bgClass) {
      case 'bg-green-500': 
        return { 
            base: 'bg-green-100', 
            border: 'border-green-400', 
            text: 'text-green-900', 
            badgeBg: 'bg-green-300', 
            badgeText: 'text-green-900',
            nameBg: 'bg-green-200'
        };
      case 'bg-indigo-600': 
        return { 
            base: 'bg-indigo-100', 
            border: 'border-indigo-400', 
            text: 'text-indigo-900', 
            badgeBg: 'bg-indigo-300', 
            badgeText: 'text-indigo-900',
            nameBg: 'bg-indigo-200'
        };
      case 'bg-pink-500': 
        return { 
            base: 'bg-pink-100', 
            border: 'border-pink-400', 
            text: 'text-pink-900', 
            badgeBg: 'bg-pink-300', 
            badgeText: 'text-pink-900',
            nameBg: 'bg-pink-200'
        };
      case 'bg-orange-500': 
        return { 
            base: 'bg-orange-100', 
            border: 'border-orange-400', 
            text: 'text-orange-900', 
            badgeBg: 'bg-orange-300', 
            badgeText: 'text-orange-900',
            nameBg: 'bg-orange-200'
        };
      case 'bg-yellow-400': 
        return { 
            base: 'bg-yellow-100', 
            border: 'border-yellow-400', 
            text: 'text-yellow-900', 
            badgeBg: 'bg-yellow-300', 
            badgeText: 'text-yellow-900',
            nameBg: 'bg-yellow-200'
        };
      case 'bg-slate-700': 
        return { 
            base: 'bg-slate-200', 
            border: 'border-slate-400', 
            text: 'text-slate-900', 
            badgeBg: 'bg-slate-300', 
            badgeText: 'text-slate-900',
            nameBg: 'bg-slate-300'
        };
      case 'bg-emerald-600': 
        return { 
            base: 'bg-emerald-100', 
            border: 'border-emerald-400', 
            text: 'text-emerald-900', 
            badgeBg: 'bg-emerald-300', 
            badgeText: 'text-emerald-900',
            nameBg: 'bg-emerald-200'
        };
      case 'bg-red-500': 
        return { 
            base: 'bg-red-100', 
            border: 'border-red-400', 
            text: 'text-red-900', 
            badgeBg: 'bg-red-300', 
            badgeText: 'text-red-900',
            nameBg: 'bg-red-200'
        };
      default: 
        return { 
            base: 'bg-gray-100', 
            border: 'border-gray-300', 
            text: 'text-gray-900', 
            badgeBg: 'bg-gray-300', 
            badgeText: 'text-gray-900',
            nameBg: 'bg-gray-200'
        };
    }
  };

  const palette = getPalette(bird.color);

  // Interaction classes
  const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';
  const dragClass = onDragStart ? 'cursor-grab active:cursor-grabbing' : '';
  
  // State styles
  const stateClasses = isGhost 
    ? 'opacity-50 border-dashed bg-white' 
    : isDimmed 
        ? 'opacity-40 grayscale contrast-125' 
        : `opacity-100 shadow-[0_2px_0px_rgba(0,0,0,0.1)] ${palette.base}`; // Simplified shadow for flat look

  // Selection is handled by parent for stacks usually, but if this specific card is selected
  const selectedClasses = selected 
    ? 'ring-[4px] ring-offset-2 ring-stone-800 -translate-y-6 z-20 shadow-xl' 
    : !isGhost && !isDimmed && !isStackPlaceholder && onClick ? 'hover:-translate-y-2 hover:shadow-md' : '';

  const stackClasses = stacked ? '-ml-16 hover:ml-2 hover:z-50 transition-all' : '';

  // Container sizing
  const cardSizeClasses = mini 
    ? 'w-14 h-14 rounded-xl border-2' // Square token for collection
    : 'w-28 h-40 rounded-2xl border-[3px]'; // Slightly wider/taller for better layout

  // Base container
  const baseClasses = `
    relative flex flex-col items-center
    transition-all duration-300 select-none overflow-hidden
    ${palette.border} ${stateClasses} ${cursorClass} ${dragClass} ${cardSizeClasses}
  `;

  // --- Stack Placeholder Render ---
  // Just the shape and color, no content
  if (isStackPlaceholder) {
      return (
          <div className={`${baseClasses} shadow-sm opacity-90`} />
      );
  }

  // --- Mini Card Render (Collection Token) ---
  if (mini) {
    return (
      <div 
        className={`${baseClasses} ${selectedClasses} justify-center`} 
        onClick={onClick}
      >
        <span className="text-3xl leading-none filter drop-shadow-sm select-none transform transition-transform hover:scale-110">
            {bird.emoji}
        </span>
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
        {/* Top Right: Flock Badge (Merged Look) */}
        {!isGhost && (
            <div className={`
                absolute top-0 right-0 pt-1 pb-1.5 pl-2 pr-1.5
                rounded-bl-2xl ${palette.badgeBg} 
                text-[11px] font-black tracking-tighter z-10 
                ${palette.badgeText} leading-none flex flex-col items-end
            `}>
                <span>{bird.smallFlock}/{bird.bigFlock}</span>
            </div>
        )}

        {/* Center: Emoji (Large & Centered) */}
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

        {/* Bottom: Name (Merged Look) */}
        {!isGhost && (
            <div className={`
                absolute bottom-0 w-full text-center py-2
                text-[11px] font-extrabold uppercase tracking-widest
                ${palette.nameBg} ${palette.text}
            `}>
                {bird.name}
            </div>
        )}
      </div>
    </div>
  );
};
