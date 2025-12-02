
import React from 'react';
import { Player, BirdType } from '../types';
import { Card } from './Card';

interface CollectionProps {
  players: Player[];
  currentPlayerId: number;
}

export const Collection: React.FC<CollectionProps> = ({ players, currentPlayerId }) => {
  return (
    <div className="w-full max-w-6xl mx-auto mb-2 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {players.map(player => (
          <div 
            key={player.id} 
            className={`
                bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border-2 transition-all
                ${player.id === currentPlayerId ? 'border-green-400 bg-green-50/50' : 'border-transparent'}
            `}
          >
            <div className="flex justify-between items-center mb-3 border-b border-black/5 pb-2">
                <div className="flex items-center gap-2">
                    <span className="font-black text-stone-700 text-sm uppercase tracking-wide">
                        {player.name} {player.isAi ? '🤖' : '👤'}
                    </span>
                    {player.id === currentPlayerId && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">TURN</span>}
                </div>
                <span className="text-xs bg-stone-100 text-stone-600 font-bold px-2 py-1 rounded-lg">
                    Score: {Object.values(player.collection).reduce((a: number, b: any) => (a||0) + (b||0), 0)}
                </span>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[60px]">
                {Object.entries(player.collection).map(([type, count]) => {
                    const c = count as number;
                    return c && c > 0 ? (
                        <div key={type} className="relative group hover:scale-105 transition-transform z-0 hover:z-10">
                            <Card type={type as BirdType} mini />
                            <div className="absolute -bottom-2 -right-2 bg-stone-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-white shadow-sm font-bold z-10">
                                {c}
                            </div>
                        </div>
                    ) : null;
                })}
                {Object.keys(player.collection).length === 0 && (
                    <div className="flex items-center justify-center w-full h-14 text-xs text-stone-400 italic bg-stone-50 rounded-lg border border-dashed">
                        No birds banked
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
