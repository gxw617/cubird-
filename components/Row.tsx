import React from 'react';
import { BirdType, GameMove, MoveOutcome } from '../types';
import { Card } from './Card';

interface RowProps {
  birds: BirdType[];
  index: number;
  onSelectSide: (rowIndex: number, side: 'LEFT' | 'RIGHT') => void;
  isCurrentPlayerTurn: boolean;
  selectedBird: BirdType | null;
  pendingMove: { move: GameMove, outcome: MoveOutcome } | null;
}

export const Row: React.FC<RowProps> = ({ birds, index, onSelectSide, isCurrentPlayerTurn, selectedBird, pendingMove }) => {
  const canInteract = isCurrentPlayerTurn && selectedBird && !pendingMove;
  const isTargetRow = pendingMove?.move.rowIndex === index;
  const targetSide = isTargetRow ? pendingMove?.move.side : null;

  const handleDragOver = (e: React.DragEvent) => { if (canInteract) e.preventDefault(); };
  const handleDrop = (side: 'LEFT' | 'RIGHT') => (e: React.DragEvent) => {
    if (canInteract) { e.preventDefault(); onSelectSide(index, side); }
  };

  const renderBirds = () => {
    let displayBirds: { type: BirdType, isGhost?: boolean, isDimmed?: boolean }[] = birds.map(b => ({ type: b }));
    if (isTargetRow && pendingMove) {
        const ghosts = (pendingMove.move.birdType && pendingMove.outcome.isValid) 
            ? Array(1).fill({ type: pendingMove.move.birdType, isGhost: true }) 
            : [];
        const capturedCounts = pendingMove.outcome.captured.reduce((acc, b) => { acc[b] = (acc[b]||0)+1; return acc; }, {} as Record<string, number>);
        displayBirds = displayBirds.map(b => {
            if (capturedCounts[b.type] && capturedCounts[b.type] > 0) {
                capturedCounts[b.type]--;
                return { ...b, isDimmed: true };
            }
            return b;
        });
        if (targetSide === 'LEFT') displayBirds = [...ghosts, ...displayBirds];
        else displayBirds = [...displayBirds, ...ghosts];
    }
    return displayBirds;
  };

  const displayList = renderBirds();

  return (
    <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-1 md:p-2 rounded-xl mb-2 md:mb-3 shadow-sm w-full max-w-4xl mx-auto transition-all">
      {/* Left */}
      <div 
        onDragOver={handleDragOver} onDrop={handleDrop('LEFT')} onClick={() => canInteract && onSelectSide(index, 'LEFT')}
        className={`
            w-10 h-24 md:w-14 md:h-32 rounded-lg border-2 border-dashed flex items-center justify-center mr-1 md:mr-4 transition-all relative shrink-0
            ${canInteract ? 'border-blue-400 bg-blue-50/50 hover:bg-blue-100 cursor-pointer text-blue-500' : 'border-gray-200 text-gray-200 cursor-default'}
            ${targetSide === 'LEFT' ? 'ring-4 ring-green-400 bg-green-50 border-green-500 text-green-600 scale-105' : ''}
        `}
      >
        <span className="font-bold text-sm md:text-lg">{targetSide === 'LEFT' ? '✓' : 'L'}</span>
      </div>

      {/* Cards - Reduced min-height on mobile */}
      <div className="flex-1 flex overflow-x-auto scrollbar-hide py-1 px-1 md:px-2 items-center justify-center min-h-[6rem] md:min-h-[140px]">
        <div className="flex pl-8 md:pl-12"> 
            {displayList.map((item, i) => (
            <div key={`${index}-${i}`} className={`${i > 0 ? '-ml-12 md:-ml-14' : ''} transition-all`}>
                <Card type={item.type} isGhost={item.isGhost} isDimmed={item.isDimmed} />
            </div>
            ))}
            {displayList.length === 0 && <span className="text-gray-400 italic text-xs">Empty</span>}
        </div>
      </div>

      {/* Right */}
      <div 
        onDragOver={handleDragOver} onDrop={handleDrop('RIGHT')} onClick={() => canInteract && onSelectSide(index, 'RIGHT')}
        className={`
            w-10 h-24 md:w-14 md:h-32 rounded-lg border-2 border-dashed flex items-center justify-center ml-1 md:ml-4 transition-all relative shrink-0
            ${canInteract ? 'border-blue-400 bg-blue-50/50 hover:bg-blue-100 cursor-pointer text-blue-500' : 'border-gray-200 text-gray-200 cursor-default'}
            ${targetSide === 'RIGHT' ? 'ring-4 ring-green-400 bg-green-50 border-green-500 text-green-600 scale-105' : ''}
        `}
      >
        <span className="font-bold text-sm md:text-lg">{targetSide === 'RIGHT' ? '✓' : 'R'}</span>
      </div>
    </div>
  );
};