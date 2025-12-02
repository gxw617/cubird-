
import React from 'react';
import { BirdType } from '../types';
import { BIRD_DATA } from '../constants';

interface CardProps {
  type: BirdType;
  onClick?: () => void;
  selected?: boolean;
  mini?: boolean;
  stacked?: boolean;
  isGhost?: boolean; // For previewing placement
  isDimmed?: boolean; // For previewing capture
  onDragStart?: (e: React.DragEvent) => void;
}

export const Card: React.FC<CardProps> = ({ type, onClick, selected, mini, stacked, isGhost, isDimmed, onDragStart }) => {
  const bird = BIRD_DATA[type];
  
  // Define a precise color palette for each bird type to ensure high quality UI
  const getPalette = (bgClass: string) => {
    switch (bgClass) {
      case 'bg-green-500': 
        return { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-800', badgeText: 'text-green-600', ring: 'ring-green-300' };
      case 'bg-indigo-600': 
        return { border: 'border-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-800', badgeText: 'text-indigo-600', ring: 'ring-indigo-300' };
      case 'bg-pink-500': 
        return { border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-800', badgeText: 'text-pink-600', ring: 'ring-pink-300' };
      case 'bg-orange-500': 
        return { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-900', badgeText: 'text-orange-600', ring: 'ring-orange-300' };
      case 'bg-yellow-400': 
        return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-900', badgeText: 'text-yellow-600', ring: 'ring-yellow-300' };
      case 'bg-slate-700': 
        return { border: 'border-slate-700', bg: 'bg-slate-100', text: 'text-slate-800', badgeText: 'text-slate-600', ring: 'ring-slate-300' };
      case 'bg-emerald-600': 
        return { border: 'border-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-900', badgeText: 'text-emerald-600', ring: 'ring-emerald-300' };
      case 'bg-red-500': 
        return { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-900', badgeText: 'text-red-600', ring: 'ring-red-300' };
      default: 
        return { border: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-800', badgeText: 'text-gray-600', ring: 'ring-gray-300' };
    }
  };

  const palette = getPalette(bird.color);

  // Interaction classes
  const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';
  const dragClass = onDragStart ? 'cursor-grab active:cursor-grabbing' : '';
  
  // State styles
  const stateClasses = isGhost 
    ? 'opacity-50 border-dashed scale-95 bg-white' 
    : isDimmed 
        ? 'opacity-40 grayscale scale-95' 
        : `opacity-100 shadow-sm ${palette.bg}`;

  const selectedClasses = selected 
    ? 'ring-4 ring-offset-2 ring-yellow-400 -translate-y-4 z-20 shadow-xl' 
    : !isGhost && !isDimmed ? 'hover:-translate-y-1 hover:shadow-md' : '';

  const stackClasses = stacked ? '-ml-16 hover:ml-2 hover:z-50 transition-all' : '';

  // Container sizing
  // Increased height slightly to accommodate internal text comfortably
  const cardSizeClasses = mini 
    ? 'w-10 h-14 rounded-md border-2' 
    : 'w-24 h-32 rounded-xl border-[3px]';

  // Base container
  const baseClasses = `
    relative flex flex-col items-center justify-between
    transition-all duration-200 select-none overflow-hidden
    ${palette.border} ${stateClasses} ${cursorClass} ${dragClass} ${cardSizeClasses}
  `;

  // --- Mini Card Render (Collection) ---
  if (mini) {
    return (
      <div 
        className={`${baseClasses} ${selectedClasses} justify-center bg-white`} 
        onClick={onClick}
      >
        <span className="text-xl drop-shadow-sm">{bird.emoji}</span>
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
        {/* Top Right: Flock Badge (Embedded) */}
        {!isGhost && (
            <div className={`
                absolute top-1.5 right-1.5 px-1.5 py-0.5 
                rounded-md bg-white/80 backdrop-blur-[2px]
                text-[9px] font-black tracking-tighter z-10 
                shadow-sm border border-white/50
                ${palette.badgeText}
            `}>
                {bird.smallFlock}/{bird.bigFlock}
            </div>
        )}

        {/* Center: Emoji */}
        <div className="flex-1 flex items-center justify-center w-full pt-1 pb-4">
          <span className="text-5xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">
              {bird.emoji}
          </span>
          
          {isDimmed && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/20">
                  <div className="text-red-600 font-bold -rotate-12 text-[10px] border-2 border-red-500 rounded bg-white px-1 py-0.5 shadow-sm whitespace-nowrap">
                      TAKEN
                  </div>
              </div>
          )}
        </div>

        {/* Bottom: Name (Embedded) */}
        {!isGhost && (
            <div className={`
                absolute bottom-0 w-full text-center py-1
                text-[9px] font-bold uppercase tracking-wide
                bg-white/40 backdrop-blur-[1px]
                ${palette.text}
            `}>
                {bird.name}
            </div>
        )}
      </div>
    </div>
  );
};
