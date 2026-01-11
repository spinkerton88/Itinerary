import React, { useState } from 'react';
import { Itinerary, TravelType, Activity } from '../types';
import { 
  CalendarIcon, MapIcon, UserGroupIcon, ShareIcon, 
  PlaneIcon, HotelIcon, SparklesIcon, DiningIcon, TransitIcon, LogisticsIcon,
  LockIcon, RefreshIcon
} from './Icons';

interface ItineraryViewProps {
  data: Itinerary;
  onToggleLock: (activity: Activity) => void;
  onRegenerate: (activity: Activity, date: string) => void;
}

const ActivityItem: React.FC<{ activity: Activity, date: string, onToggleLock: (a: Activity) => void, onRegenerate: (a: Activity, d: string) => void }> = ({ activity, date, onToggleLock, onRegenerate }) => {
    let Icon = SparklesIcon;
    let iconColorClass = "text-purple-600";
    let iconBgClass = "bg-purple-100";
    
    // Map categories to icons and colors
    switch (activity.category) {
        case 'flight':
            Icon = PlaneIcon;
            iconColorClass = "text-blue-600";
            iconBgClass = "bg-blue-100";
            break;
        case 'accommodation':
            Icon = HotelIcon;
            iconColorClass = "text-indigo-600";
            iconBgClass = "bg-indigo-100";
            break;
        case 'dining':
            Icon = DiningIcon;
            iconColorClass = "text-orange-600";
            iconBgClass = "bg-orange-100";
            break;
        case 'transit':
            Icon = TransitIcon;
            iconColorClass = "text-green-600";
            iconBgClass = "bg-green-100";
            break;
        case 'logistics':
            Icon = LogisticsIcon;
            iconColorClass = "text-gray-600";
            iconBgClass = "bg-gray-100";
            break;
        case 'activity':
        default:
            Icon = SparklesIcon;
            iconColorClass = "text-purple-600";
            iconBgClass = "bg-purple-100";
            break;
    }

    const isBooked = activity.bookingStatus === 'booked';
    const isLocked = activity.isLocked || isBooked;

    const [imgSrc, setImgSrc] = useState(
      activity.imageQuery 
        ? `https://loremflickr.com/320/240/${encodeURIComponent(activity.imageQuery.replace(/\s+/g, '-'))}/all` 
        : null
    );

    const handleImageError = () => {
        // Fallback to text placeholder if image fails
        setImgSrc(`https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(activity.title)}`);
    };

    return (
        <div className={`group bg-white rounded-xl border transition-all hover:shadow-md overflow-hidden relative ${isLocked ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-100 shadow-sm'}`}>
            <div className="flex">
                {/* Image Section */}
                {imgSrc && (
                    <div className="w-24 sm:w-32 relative hidden sm:block">
                        <img 
                            src={imgSrc} 
                            alt={activity.title} 
                            onError={handleImageError}
                            className="w-full h-full object-cover absolute inset-0" 
                            loading="lazy"
                        />
                         <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                    </div>
                )}

                <div className="flex-1 p-4 flex gap-4">
                     {!imgSrc && (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
                            <Icon className={`w-5 h-5 ${iconColorClass}`} />
                        </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                         {/* Header Line */}
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex flex-col">
                                <h4 className="font-semibold text-gray-900 text-sm truncate pr-2">{activity.title}</h4>
                                {activity.subTitle && (
                                    <span className="text-xs font-medium text-gray-500">{activity.subTitle}</span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 whitespace-nowrap">
                                    {activity.time} {activity.endTime ? `- ${activity.endTime}` : ''}
                                </span>
                            </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1 mb-2">{activity.description}</p>
                        
                        {/* Footer Info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-gray-50">
                             {isLocked && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                                    <LockIcon className="w-3 h-3" /> Saved
                                </span>
                            )}
                            {!isLocked && activity.bookingStatus && (
                                 <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${activity.bookingStatus === 'booked' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {activity.bookingStatus}
                                </span>
                            )}
                            {activity.cost && <span className="text-xs font-bold text-gray-700">{activity.cost}</span>}
                            {activity.notes && <span className="text-xs text-gray-400 italic truncate max-w-[150px]">{activity.notes}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons (Overlay) */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isLocked && (
                    <button 
                        onClick={() => onRegenerate(activity, date)}
                        className="p-1.5 bg-white shadow-md rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Regenerate this option"
                    >
                        <RefreshIcon className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={() => onToggleLock(activity)}
                    className={`p-1.5 shadow-md rounded-full transition-colors ${isLocked ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-white text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                    title={isLocked ? "Unlock" : "Save / Lock in"}
                >
                    <LockIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export const ItineraryView: React.FC<ItineraryViewProps> = ({ data, onToggleLock, onRegenerate }) => {
    
    // Header Section
    const Header = () => (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-blue-900 p-6 sm:p-8 text-white shadow-xl mb-6">
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3 border border-white/10 uppercase tracking-wider text-blue-200">
                            {data.travelType}
                        </span>
                        <h2 className="text-3xl font-bold mb-1 tracking-tight">{data.destination || "Plan Your Trip"}</h2>
                        <p className="text-blue-200/80 font-medium text-sm">{data.title}</p>
                    </div>
                    <button className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
                        <ShareIcon className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 mt-8">
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md border border-white/5">
                        <CalendarIcon className="w-4 h-4 text-blue-200" />
                        <span className="text-xs sm:text-sm font-medium">{data.dates || "Dates TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md border border-white/5">
                        <UserGroupIcon className="w-4 h-4 text-blue-200" />
                        <span className="text-xs sm:text-sm font-medium">
                            {data.travelers.adults} Adults, {data.travelers.children} Kids
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen"></div>
        </div>
    );

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400 mt-10">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                 <MapIcon className="w-8 h-8 opacity-20 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Your journey starts here</h3>
            <p className="text-sm max-w-xs mt-2 text-gray-500">Chat with your concierge to curate the perfect itinerary.</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-y-auto no-scrollbar pb-20 relative">
            <Header />

            {data.days.length === 0 ? <EmptyState /> : (
                <div className="space-y-8 pb-32">
                    {data.days.map((day, index) => (
                        <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="sticky top-0 z-10 bg-[#F2F2F7]/95 backdrop-blur-md py-3 mb-2 flex items-center justify-between border-b border-gray-200/50">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{day.date}</h3>
                                    {day.dayTitle && <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">{day.dayTitle}</p>}
                                </div>
                                <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">{day.activities.length} Events</span>
                            </div>
                            <div className="space-y-3">
                                {day.activities.map((activity, actIndex) => (
                                    <ActivityItem 
                                        key={actIndex} 
                                        activity={activity} 
                                        date={day.date}
                                        onToggleLock={onToggleLock}
                                        onRegenerate={onRegenerate}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {/* Total Estimated Cost - Fixed or at bottom */}
                    {data.totalEstimatedCost && (
                         <div className="mt-8 p-6 bg-gray-900 text-white rounded-2xl flex justify-between items-center shadow-lg transform transition-transform hover:scale-[1.01]">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Estimated Cost</p>
                                <p className="text-sm text-gray-400">Includes flights, hotels & activities</p>
                            </div>
                            <span className="text-3xl font-bold text-white">{data.totalEstimatedCost}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};