import React, { useState, useRef, useEffect } from 'react';
import { 
    PlaneIcon, HotelIcon, CarIcon, ShipIcon, MapIcon, 
    UserGroupIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon,
    XIcon, PlusIcon, CircleIcon, ArrowRightLeftIcon
} from './Icons';

export interface MultiCityLeg {
    id: string;
    origin: string;
    destination: string;
    date: string;
    isHome?: boolean;
}

export interface TripContext {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    tripType: string;
    legs?: MultiCityLeg[];
    travelers: {
        adults: number;
        children: number;
        infants: number;
    };
    vibes: string[];
    needs: {
        flight: boolean;
        hotel: boolean;
        car: boolean;
        cruise: boolean;
    };
}

interface TripSetupFormProps {
    isOpen: boolean;
    onToggle: () => void;
    onStart: (context: TripContext) => void;
}

const VIBE_OPTIONS = [
    "Relaxed", "Adventure", "Family", "Fun", "Romantic", 
    "Cultural", "Nightlife", "Luxury", "Budget", "Foodie",
    "Work", "Honeymoon", "Party"
];

const TRIP_TYPES = ["Round Trip", "One Way", "Multi-City"];

export const TripSetupForm: React.FC<TripSetupFormProps> = ({ isOpen, onToggle, onStart }) => {
    // Form State
    const [tripType, setTripType] = useState('Round Trip');
    const [origin, setOrigin] = useState('Austin');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Multi-City State
    const [legs, setLegs] = useState<MultiCityLeg[]>([
        { id: '1', origin: 'Austin', destination: '', date: '', isHome: false },
        { id: '2', origin: '', destination: '', date: '', isHome: false }
    ]);

    // Traveler State
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);

    // Menus State
    const [isTravelerMenuOpen, setIsTravelerMenuOpen] = useState(false);
    const [isTripTypeMenuOpen, setIsTripTypeMenuOpen] = useState(false);
    const travelerMenuRef = useRef<HTMLDivElement>(null);
    const tripTypeMenuRef = useRef<HTMLDivElement>(null);

    // Vibe State
    const [vibes, setVibes] = useState<string[]>([]);

    // Essentials State
    const [needsFlight, setNeedsFlight] = useState(false);
    const [needsHotel, setNeedsHotel] = useState(false);
    const [needsCar, setNeedsCar] = useState(false);
    const [needsCruise, setNeedsCruise] = useState(false);

    // Sync state when switching trip types
    useEffect(() => {
        if (tripType === 'Multi-City') {
            // Pre-populate first leg if empty
            if (legs[0].origin === '' && origin) {
                const newLegs = [...legs];
                newLegs[0].origin = origin;
                newLegs[0].destination = destination;
                newLegs[0].date = startDate;
                setLegs(newLegs);
            }
        }
    }, [tripType]);

    // Close menus on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (travelerMenuRef.current && !travelerMenuRef.current.contains(event.target as Node)) {
                setIsTravelerMenuOpen(false);
            }
            if (tripTypeMenuRef.current && !tripTypeMenuRef.current.contains(event.target as Node)) {
                setIsTripTypeMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleVibe = (vibe: string) => {
        setVibes(prev => prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]);
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        
        if (newStart) {
            // Using UTC to avoid timezone shifts when adding days
            const [y, m, d] = newStart.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d));
            date.setUTCDate(date.getUTCDate() + 1);
            
            const nextDayStr = date.toISOString().split('T')[0];
            setEndDate(nextDayStr);
        }
    };

    const handleLegChange = (id: string, field: keyof MultiCityLeg, value: any) => {
        setLegs(prev => {
            const newLegs = prev.map(leg => {
                if (leg.id !== id) return leg;
                
                // If toggling 'Home', pre-fill the destination with the main trip origin, but keep editable
                if (field === 'isHome' && value === true) {
                     return { ...leg, [field]: value, destination: origin };
                }
                
                return { ...leg, [field]: value };
            });

            // Cascade dates logic
            if (field === 'date') {
                const changedIndex = newLegs.findIndex(l => l.id === id);
                if (changedIndex !== -1 && changedIndex < newLegs.length - 1) {
                     let prevDateStr = newLegs[changedIndex].date;
                     for (let i = changedIndex + 1; i < newLegs.length; i++) {
                         const currentLeg = newLegs[i];
                         if (!prevDateStr) break;
                         
                         const [py, pm, pd] = prevDateStr.split('-').map(Number);
                         const pDate = new Date(Date.UTC(py, pm - 1, pd));
                         
                         let cDateVal = 0;
                         if (currentLeg.date) {
                             const [cy, cm, cd] = currentLeg.date.split('-').map(Number);
                             cDateVal = new Date(Date.UTC(cy, cm - 1, cd)).getTime();
                         }
                         
                         if (!currentLeg.date || cDateVal <= pDate.getTime()) {
                             pDate.setUTCDate(pDate.getUTCDate() + 1);
                             const newDateStr = pDate.toISOString().split('T')[0];
                             newLegs[i] = { ...currentLeg, date: newDateStr };
                             prevDateStr = newDateStr;
                         } else {
                             prevDateStr = currentLeg.date;
                         }
                     }
                }
            }
            return newLegs;
        });
    };

    const addLeg = () => {
        const lastLeg = legs[legs.length - 1];
        
        // Calculate default date for next leg: Last leg date + 1 day
        let nextDate = '';
        if (lastLeg && lastLeg.date) {
            const [y, m, d] = lastLeg.date.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d));
            date.setUTCDate(date.getUTCDate() + 1);
            nextDate = date.toISOString().split('T')[0];
        }

        setLegs(prev => [
            ...prev, 
            { 
                id: Date.now().toString(), 
                origin: lastLeg ? (lastLeg.isHome ? '' : lastLeg.destination) : '', 
                destination: '', 
                date: nextDate,
                isHome: false
            }
        ]);
    };

    const removeLeg = (id: string) => {
        if (legs.length <= 1) return;
        setLegs(prev => prev.filter(l => l.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalOrigin = origin;
        let finalDestination = destination;
        let finalStartDate = startDate;
        let finalEndDate = endDate;

        if (tripType === 'Multi-City') {
            const validLegs = legs.filter(l => l.destination || l.isHome); // Simple validation
            if (validLegs.length > 0) {
                finalOrigin = validLegs[0].origin;
                finalStartDate = validLegs[0].date;
                finalEndDate = validLegs[validLegs.length - 1].date;
                
                // Construct a narrative destination string for the AI prompt
                finalDestination = validLegs.map((leg, i) => {
                    const dateStr = leg.date ? ` on ${leg.date}` : '';
                    
                    if (leg.isHome) {
                        return `returning to ${leg.destination} (Home)${dateStr}`;
                    }
                    
                    return `${leg.destination}${dateStr}`;
                }).join(', then to ');
            }
        }

        onStart({
            origin: finalOrigin,
            destination: finalDestination,
            startDate: finalStartDate,
            endDate: finalEndDate,
            tripType,
            legs: tripType === 'Multi-City' ? legs : undefined,
            travelers: { adults, children, infants },
            vibes,
            needs: {
                flight: needsFlight,
                hotel: needsHotel,
                car: needsCar,
                cruise: needsCruise
            }
        });
    };

    const Counter = ({ label, value, onChange, subLabel }: { label: string, value: number, onChange: (val: number) => void, subLabel?: string }) => (
        <div className="flex items-center justify-between py-3 min-w-[200px]">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                {subLabel && <span className="text-xs text-gray-400">{subLabel}</span>}
            </div>
            <div className="flex items-center gap-3">
                <button 
                    type="button" 
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors ${value === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={value === 0}
                >
                    <span className="text-lg leading-none mb-0.5">-</span>
                </button>
                <span className="text-sm w-4 text-center font-medium">{value}</span>
                <button 
                    type="button" 
                    onClick={() => onChange(value + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    <span className="text-lg leading-none mb-0.5">+</span>
                </button>
            </div>
        </div>
    );

    const ToggleOption = ({ 
        icon: Icon, 
        label, 
        active, 
        onClick 
    }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
        <button 
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border
            ${active 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
            {label}
        </button>
    );

    const totalTravelers = adults + children + infants;

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm z-20">
            {/* Header / Toggle Bar */}
            <button 
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm group-hover:bg-blue-200 transition-colors">
                        <SparklesIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">Plan a new trip</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Customize dates, passengers, and vibes</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                     <span className="text-xs font-medium uppercase tracking-wider">{isOpen ? "Hide" : "Show"}</span>
                    {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </div>
            </button>

            {/* Collapsible Content */}
            {isOpen && (
                <div className="px-6 pb-6 pt-2 animate-fade-in-down border-t border-gray-50">
                    <form onSubmit={handleSubmit}>
                        
                        {/* Row 1: Top Controls (Trip Type & Travelers) */}
                        <div className="flex flex-wrap gap-4 mb-4 relative z-50">
                            
                            {/* Trip Type Dropdown */}
                            <div className="relative" ref={tripTypeMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsTripTypeMenuOpen(!isTripTypeMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    {tripType}
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                </button>
                                {isTripTypeMenuOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 overflow-hidden animate-fade-in-up">
                                        {TRIP_TYPES.map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => { setTripType(type); setIsTripTypeMenuOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${tripType === type ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Travelers Dropdown */}
                            <div className="relative" ref={travelerMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsTravelerMenuOpen(!isTravelerMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <UserGroupIcon className="w-4 h-4 text-gray-500" />
                                    {totalTravelers} Traveler{totalTravelers !== 1 ? 's' : ''}
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                </button>
                                {isTravelerMenuOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in-up cursor-default">
                                        <div className="space-y-1">
                                            <Counter label="Adults" subLabel="Ages 18+" value={adults} onChange={setAdults} />
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <Counter label="Children" subLabel="Ages 2-17" value={children} onChange={setChildren} />
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <Counter label="Infants" subLabel="On lap" value={infants} onChange={setInfants} />
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                type="button"
                                                onClick={() => setIsTravelerMenuOpen(false)}
                                                className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Flight Inputs */}
                        {tripType === 'Multi-City' ? (
                             <div className="space-y-3 mb-6">
                                {legs.map((leg, index) => {
                                    const isLastLeg = index === legs.length - 1;
                                    
                                    return (
                                        <div key={leg.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3 animate-fade-in-up relative">
                                            <div className="grid grid-cols-12 gap-3 items-center">
                                                {/* Locations: Origin & Dest */}
                                                <div className="col-span-12 md:col-span-7 flex shadow-sm rounded-xl overflow-hidden border border-gray-300">
                                                    <div className="flex-1 relative border-r border-gray-300 bg-white hover:bg-gray-50 transition-colors group">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600">
                                                            <CircleIcon className="w-3 h-3" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={leg.origin}
                                                            onChange={(e) => handleLegChange(leg.id, 'origin', e.target.value)}
                                                            className="w-full pl-9 pr-2 py-3.5 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:ring-0 text-sm font-medium truncate"
                                                            placeholder="Where from?"
                                                        />
                                                    </div>
                                                    <div className="flex-1 relative bg-white hover:bg-gray-50 transition-colors group">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600">
                                                            <MapIcon className="w-4 h-4" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={leg.destination}
                                                            onChange={(e) => handleLegChange(leg.id, 'destination', e.target.value)}
                                                            className={`w-full pl-9 pr-2 py-3.5 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:ring-0 text-sm font-medium truncate ${leg.isHome ? 'text-blue-700' : ''}`}
                                                            placeholder="Where to?"
                                                        />
                                                        {/* Home Checkbox for last leg */}
                                                        {isLastLeg && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white pl-2">
                                                                <input 
                                                                    type="checkbox"
                                                                    id={`home-${leg.id}`}
                                                                    checked={leg.isHome || false}
                                                                    onChange={(e) => handleLegChange(leg.id, 'isHome', e.target.checked)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <label htmlFor={`home-${leg.id}`} className="text-xs text-gray-500 font-medium cursor-pointer select-none">
                                                                    Home
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <div className="col-span-10 md:col-span-4 relative shadow-sm rounded-xl overflow-hidden border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                                                    <input
                                                        type="date"
                                                        value={leg.date}
                                                        onChange={(e) => handleLegChange(leg.id, 'date', e.target.value)}
                                                        className="w-full px-4 py-3.5 bg-transparent border-none text-gray-900 focus:ring-0 text-sm font-medium"
                                                        placeholder="Departure"
                                                    />
                                                </div>
                                                
                                                {/* Remove Button */}
                                                <div className="col-span-2 md:col-span-1 flex justify-center">
                                                    {legs.length > 1 && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeLeg(leg.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Remove flight"
                                                        >
                                                            <XIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                <button 
                                    type="button"
                                    onClick={addLeg}
                                    className="flex items-center gap-2 px-4 py-2 text-[#007AFF] bg-blue-50 hover:bg-blue-100 rounded-full text-sm font-semibold transition-colors mt-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add segment
                                </button>
                             </div>
                        ) : (
                            // Standard Single/Round Trip Layout
                            <div className="mb-6 z-0 space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                    <div className="md:col-span-6 flex flex-col md:flex-row shadow-sm rounded-xl overflow-hidden border border-gray-300">
                                        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-gray-300 bg-white hover:bg-gray-50 transition-colors group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600">
                                                <CircleIcon className="w-3 h-3" />
                                            </div>
                                            <input
                                                type="text"
                                                value={origin}
                                                onChange={(e) => setOrigin(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:ring-0 text-base font-medium truncate"
                                                placeholder="Where from?"
                                            />
                                            <span className="hidden md:block absolute -top-1.5 left-12 bg-transparent text-[10px] text-gray-500 font-medium">From</span>
                                        </div>
                                        <div className="flex-1 relative bg-white hover:bg-gray-50 transition-colors group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600">
                                                <MapIcon className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:ring-0 text-base font-medium truncate"
                                                placeholder="Where to?"
                                                required
                                            />
                                            <span className="hidden md:block absolute -top-1.5 left-12 bg-transparent text-[10px] text-gray-500 font-medium">To</span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-6 flex flex-col md:flex-row shadow-sm rounded-xl overflow-hidden border border-gray-300">
                                        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={handleStartDateChange}
                                                className="w-full px-4 py-4 bg-transparent border-none text-gray-900 focus:ring-0 text-sm font-medium"
                                                required
                                            />
                                        </div>
                                        {tripType !== 'One Way' && (
                                            <div className="flex-1 relative bg-white hover:bg-gray-50 transition-colors">
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="w-full px-4 py-4 bg-transparent border-none text-gray-900 focus:ring-0 text-sm font-medium"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Row 3: Vibes & Essentials */}
                        <div className="flex flex-col md:flex-row gap-6">
                            
                            {/* Vibes */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <SparklesIcon className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vibes</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {VIBE_OPTIONS.map(vibe => (
                                        <button
                                            key={vibe}
                                            type="button"
                                            onClick={() => toggleVibe(vibe)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                                vibes.includes(vibe)
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {vibe}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Essentials */}
                            <div className="flex-1">
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Essentials</span>
                                <div className="flex flex-wrap gap-2">
                                    <ToggleOption icon={PlaneIcon} label="Flight" active={needsFlight} onClick={() => setNeedsFlight(!needsFlight)} />
                                    <ToggleOption icon={HotelIcon} label="Hotel" active={needsHotel} onClick={() => setNeedsHotel(!needsHotel)} />
                                    <ToggleOption icon={CarIcon} label="Car" active={needsCar} onClick={() => setNeedsCar(!needsCar)} />
                                    <ToggleOption icon={ShipIcon} label="Cruise" active={needsCruise} onClick={() => setNeedsCruise(!needsCruise)} />
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center md:justify-end">
                            <button
                                type="submit"
                                className="bg-[#007AFF] text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-all transform active:scale-[0.98] flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                Explore
                            </button>
                        </div>

                    </form>
                </div>
            )}
        </div>
    );
};