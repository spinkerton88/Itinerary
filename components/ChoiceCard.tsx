import React from 'react';
import { Activity } from '../types';
import { SparklesIcon, PlaneIcon, HotelIcon, DiningIcon, TransitIcon, LogisticsIcon, CircleIcon } from './Icons';

interface ChoiceCardProps {
  options: Activity[];
  onSelect: (option: Activity) => void;
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({ options, onSelect }) => {
  if (!options || options.length === 0) return null;

  const getIcon = (category: string) => {
    switch (category) {
      case 'flight': return PlaneIcon;
      case 'accommodation': return HotelIcon;
      case 'dining': return DiningIcon;
      case 'transit': return TransitIcon;
      case 'logistics': return LogisticsIcon;
      default: return SparklesIcon;
    }
  };

  return (
    <div className="mx-4 sm:mx-0 mb-6 bg-white rounded-3xl p-6 shadow-lg border border-blue-100 animate-fade-in-up relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">concierge suggestions</h3>
                <p className="text-xs text-gray-500">Select an option to add it to your itinerary.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            {options.map((option, idx) => {
                const Icon = getIcon(option.category);
                return (
                    <div 
                        key={idx} 
                        className="flex flex-col h-full bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md rounded-2xl p-4 transition-all duration-200 cursor-pointer group"
                        onClick={() => onSelect(option)}
                    >
                        {/* Icon & Cost Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Icon className="w-5 h-5 text-gray-700" />
                            </div>
                            {option.cost && (
                                <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-full shadow-sm">
                                    {option.cost}
                                </span>
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 mb-4">
                            <h4 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{option.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{option.description}</p>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-auto">
                            <button className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold group-hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <CircleIcon className="w-3 h-3" />
                                Select This
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};