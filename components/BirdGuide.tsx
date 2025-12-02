
import React from 'react';
import { BIRD_DATA } from '../constants';

interface BirdGuideProps {
  className?: string;
  onClose?: () => void;
}

export const BirdGuide: React.FC<BirdGuideProps> = ({ className, onClose }) => {
  
  // Helper to get a nice pastel background for the text badge based on the bird's main color
  const getBadgeStyle = (colorClass: string) => {
    if (colorClass.includes('green')) return 'bg-green-100 text-green-800';
    if (colorClass.includes('indigo')) return 'bg-indigo-100 text-indigo-800';
    if (colorClass.includes('pink')) return 'bg-pink-100 text-pink-800';
    if (colorClass.includes('orange')) return 'bg-orange-100 text-orange-800';
    if (colorClass.includes('yellow')) return 'bg-yellow-100 text-yellow-800';
    if (colorClass.includes('slate')) return 'bg-slate-200 text-slate-800';
    if (colorClass.includes('emerald')) return 'bg-emerald-100 text-emerald-800';
    if (colorClass.includes('red')) return 'bg-red-100 text-red-800';
    if (colorClass.includes('blue')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden flex flex-col ${className}`}>
      <div className="bg-stone-800 text-white px-4 py-3 border-b border-stone-700 flex justify-between items-center">
        <h3 className="font-bold">Bird Guide & Rules</h3>
        {onClose && (
            <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
                ✕
            </button>
        )}
      </div>
      
      <div className="overflow-y-auto p-4 space-y-6">
        
        {/* Victory Conditions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-bold text-yellow-800 text-xs uppercase tracking-wider mb-2">🏆 Winning Conditions</h4>
            <ul className="text-sm text-yellow-900 space-y-1 list-disc pl-4">
                <li>Collect <strong>7 different</strong> species.</li>
                <li>Collect <strong>2 species</strong> of at least <strong>3 birds</strong> each.</li>
            </ul>
        </div>

        {/* Legend */}
        <div>
            <h4 className="font-bold text-stone-700 text-xs uppercase tracking-wider mb-2">Species List</h4>
            <table className="w-full text-sm">
                <thead className="text-xs text-stone-500 border-b border-stone-100">
                    <tr>
                        <th className="pb-2 text-left pl-1">Bird</th>
                        <th className="pb-2 text-center text-[10px] uppercase">Total</th>
                        <th className="pb-2 text-center text-[10px] uppercase text-orange-600">Small</th>
                        <th className="pb-2 text-center text-[10px] uppercase text-green-600">Big</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                    {Object.values(BIRD_DATA).map((bird) => (
                        <tr key={bird.id} className="hover:bg-stone-50">
                            <td className="py-2 pl-1 flex items-center gap-2 font-medium text-stone-700">
                                <span className="text-lg">{bird.emoji}</span>
                                <span 
                                  className={`px-2 py-0.5 rounded text-xs font-bold truncate max-w-[100px] ${getBadgeStyle(bird.color)}`} 
                                  title={bird.name}
                                >
                                    {bird.name}
                                </span>
                            </td>
                            <td className="text-center text-stone-500 font-mono">{bird.total}</td>
                            <td className="text-center font-bold text-orange-500">{bird.smallFlock}</td>
                            <td className="text-center font-bold text-green-600">{bird.bigFlock}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Rules Summary */}
        <div className="text-xs text-stone-500 space-y-2 border-t pt-4">
            <p><strong className="text-stone-700">Flocking:</strong> Reveal birds from your hand. If you have enough (≥ Small or Big), keep 1 or 2 in your collection and discard the rest.</p>
            <p><strong className="text-stone-700">Capturing:</strong> Play cards to surround birds of a different species. Take the <em>surrounded</em> birds into your hand.</p>
        </div>
      </div>
    </div>
  );
};
