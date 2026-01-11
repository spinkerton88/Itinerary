import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from './services/geminiService';
import { Message, Itinerary, INITIAL_ITINERARY, UserProfile, Activity, TravelType } from './types';
import { ChatBubble, TypingIndicator } from './components/ChatBubble';
import { ItineraryView } from './components/ItineraryView';
import { SettingsModal } from './components/SettingsModal';
import { TripSetupForm, TripContext } from './components/TripSetupForm';
import { SendIcon, SparklesIcon, SettingsIcon } from './components/Icons';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary>(INITIAL_ITINERARY);
  const [activeTab, setActiveTab] = useState<'chat' | 'itinerary'>('chat'); // For mobile view
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ loyaltyCards: [] });

  // Trip Context State
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  
  // Suggestions & Options State
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [pendingChoices, setPendingChoices] = useState<Activity[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Mobile UX: Auto-switch to itinerary view when choice cards appear
  useEffect(() => {
    if (pendingChoices.length > 0 && window.innerWidth < 768) {
        setActiveTab('itinerary');
    }
  }, [pendingChoices]);

  useEffect(() => {
      // Initial Greeting
      const initChat = async () => {
        setIsTyping(true);
        try {
            await geminiService.startChat((updatedItinerary) => {
                setItinerary(prev => ({ ...prev, ...updatedItinerary }));
            }, userProfile);
            
            const greeting = "Hello! I'm your travel assistant. You can use the trip planner above to set your preferences, or just start chatting.";
            setMessages([{ id: 'init', role: 'model', text: greeting }]);
        } catch (e) {
            console.error("Failed to start chat", e);
        } finally {
            setIsTyping(false);
        }
      };
      initChat();
  }, []);

  const handleTripStart = async (context: TripContext) => {
      setIsSetupOpen(false); // Collapse form
      
      // PRE-POPULATE VISUAL STATE (Immediate Feedback)
      const derivedTravelType = context.vibes.find(v => Object.values(TravelType).includes(v as any)) as TravelType || TravelType.LEISURE;
      let displayDestination = context.destination;
      let displayTitle = `Trip to ${context.destination}`;
      if (context.tripType === 'Multi-City') {
          displayTitle = "Multi-City Adventure";
          displayDestination = "Multi-City Route";
      }

      let dateRange = "";
      if (context.startDate) {
          dateRange = context.startDate;
          if (context.endDate) dateRange += ` - ${context.endDate}`;
      }

      setItinerary({
          ...INITIAL_ITINERARY,
          title: displayTitle,
          destination: displayDestination,
          dates: dateRange,
          travelType: derivedTravelType,
          travelers: context.travelers,
      });

      // GENERATE PROMPT
      const needs = [];
      if (context.needs.flight) needs.push("flights");
      if (context.needs.hotel) needs.push("hotels");
      if (context.needs.car) needs.push("car rental");
      if (context.needs.cruise) needs.push("cruise");

      const travelersParts = [];
      if (context.travelers.adults > 0) travelersParts.push(`${context.travelers.adults} adult${context.travelers.adults > 1 ? 's' : ''}`);
      if (context.travelers.children > 0) travelersParts.push(`${context.travelers.children} child${context.travelers.children > 1 ? 'ren' : ''}`);
      if (context.travelers.infants > 0) travelersParts.push(`${context.travelers.infants} infant${context.travelers.infants > 1 ? 's' : ''}`);
      const travelerStr = travelersParts.join(', ');

      const vibeStr = context.vibes.length > 0 ? context.vibes.join(', ').toLowerCase() + " " : "";

      let prompt = "";
      
      if (context.tripType === 'Multi-City' && context.legs) {
          const routeDescription = context.legs.map(leg => {
              let legDesc = `${leg.origin} to ${leg.destination}`;
              if (leg.isHome) legDesc = `returning home to ${leg.destination}`;
              if (leg.date) legDesc += ` on ${leg.date}`;
              return legDesc;
          }).join('; then ');
          
          prompt = `I'm planning a ${vibeStr}multi-city trip. Route: ${routeDescription}. `;
      } else {
          let datePart = "";
          if (context.startDate && context.endDate) {
              datePart = `from ${context.startDate} to ${context.endDate}`;
          } else if (context.startDate) {
              datePart = `starting ${context.startDate}`;
          }
          
          prompt = `I'm planning a ${vibeStr}trip to ${context.destination} leaving from ${context.origin} ${datePart}. `;
      }

      prompt += `It will be for ${travelerStr}.`;

      if (needs.length > 0) {
          const needsStr = needs.length === 1 ? needs[0] : needs.slice(0, -1).join(', ') + ' and ' + needs[needs.length - 1];
          prompt += ` I'd like help booking ${needsStr}.`;
      }
      
      prompt += " Please suggest an itinerary. Start by offering flight and hotel options if needed.";

      // Add user message locally
      const userMsg: Message = { id: Date.now().toString(), role: 'user', text: prompt };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      setSelectedSuggestions(new Set());
      setPendingChoices([]);
      
      try {
        let capturedSuggestions: string[] | undefined = undefined;
        const text = await geminiService.sendMessage(
             prompt, 
             (partialUpdate) => setItinerary(prev => ({...prev, ...partialUpdate})),
             (s) => { capturedSuggestions = s; },
             (options) => { setPendingChoices(options); }
        );

        const aiMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: text,
            suggestions: capturedSuggestions
        };
        setMessages(prev => [...prev, aiMsg]);

      } catch (e) {
         console.error(e);
      } finally {
         setIsTyping(false);
      }
  };

  const handleSendMessage = async (text: string) => {
    let finalInput = text;
    if (selectedSuggestions.size > 0) {
        const selectedList = Array.from(selectedSuggestions);
        const suggestionsText = selectedList.length === 1 
            ? selectedList[0] 
            : selectedList.slice(0, -1).join(', ') + ' and ' + selectedList[selectedList.length - 1];
            
        finalInput += `\n\nPlease proceed with: ${suggestionsText}`;
    }

    if (!finalInput.trim()) return;

    // Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: finalInput };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInputValue('');
    setSelectedSuggestions(new Set());
    setPendingChoices([]);

    try {
      let capturedSuggestions: string[] | undefined = undefined;
      // Call Gemini Service
      const responseText = await geminiService.sendMessage(
          finalInput, 
          (partialUpdate) => setItinerary(prev => ({...prev, ...partialUpdate})),
          (s) => { capturedSuggestions = s; },
          (options) => { setPendingChoices(options); }
      );

      // Add AI Message
      const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: responseText,
          suggestions: capturedSuggestions
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const onSendClick = () => {
      handleSendMessage(inputValue);
  }

  // --- Itinerary Actions ---

  const handleToggleLock = (activity: Activity) => {
    setItinerary(prev => {
        const newDays = prev.days.map(day => ({
            ...day,
            activities: day.activities.map(a => {
                if (a === activity) { 
                    return { ...a, isLocked: !a.isLocked };
                }
                return a;
            })
        }));
        return { ...prev, days: newDays };
    });
  };

  const handleRegenerate = (activity: Activity, date: string) => {
      const prompt = `For the itinerary on ${date}, I don't like the activity "${activity.title}". Please remove it and suggest a better alternative for that time slot. Keep everything else the same.`;
      handleSendMessage(prompt);
  };
  
  const handleRemoveActivity = (activity: Activity, date: string) => {
      const prompt = `Please remove "${activity.title}" from the itinerary on ${date}.`;
      handleSendMessage(prompt);
  };
  
  const handleToggleSuggestion = (suggestion: string) => {
      setSelectedSuggestions(prev => {
          const newSet = new Set(prev);
          if (newSet.has(suggestion)) {
              newSet.delete(suggestion);
          } else {
              newSet.add(suggestion);
          }
          return newSet;
      });
  };
  
  const handleSelectChoice = (activity: Activity) => {
      setPendingChoices([]); // Clear options
      // Inform AI of the choice so it can update the structured state
      const prompt = `I have selected the option "${activity.title}". Please add it to my itinerary plan and remove the other options.`;
      handleSendMessage(prompt);
  };

  return (
    <div className="flex h-screen bg-[#F2F2F7] text-gray-900 font-sans overflow-hidden">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        profile={userProfile}
        onUpdateProfile={(p) => {
            setUserProfile(p);
        }}
      />

      {/* Mobile Tab Switcher (Visible only on small screens) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around md:hidden z-50 pb-safe">
        <button 
            onClick={() => setActiveTab('chat')}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-blue-500' : 'text-gray-400'}`}
        >
            <SparklesIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Assistant</span>
        </button>
        <button 
            onClick={() => setActiveTab('itinerary')}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'itinerary' ? 'text-blue-500' : 'text-gray-400'}`}
        >
            <SendIcon className="w-6 h-6 rotate-[-45deg]" />
            <span className="text-[10px] font-medium">Trip Plan</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex w-full max-w-[1600px] mx-auto h-full md:p-6 gap-6">
        
        {/* Left Column: Chat Interface */}
        <div className={`
            flex-1 flex flex-col h-full bg-white md:rounded-3xl shadow-sm overflow-hidden transition-all duration-300 relative
            ${activeTab === 'chat' ? 'block' : 'hidden md:flex'}
        `}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
            <div className="w-8"></div> {/* Spacer for balance */}
            <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Travel Assistant</span>
                <h1 className="text-lg font-bold text-gray-900">Itinerary AI</h1>
            </div>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
                <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Trip Setup Dropdown - Placed directly under header */}
          <TripSetupForm 
             isOpen={isSetupOpen} 
             onToggle={() => setIsSetupOpen(!isSetupOpen)}
             onStart={handleTripStart}
          />

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-gray-50/50 to-white">
            {messages.map((msg) => (
              <ChatBubble 
                key={msg.id} 
                message={msg} 
                selectedSuggestions={selectedSuggestions}
                onToggleSuggestion={handleToggleSuggestion}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 pb-20 md:pb-4">
            <div className="relative flex items-center bg-gray-100 rounded-full px-2 py-2 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
              <input
                type="text"
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 px-4 py-2 text-[15px]"
                placeholder={selectedSuggestions.size > 0 ? "Add any details or just press send..." : "Where to next? (e.g. Honeymoon in Italy)"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                onClick={onSendClick}
                disabled={(!inputValue.trim() && selectedSuggestions.size === 0) || isTyping}
                className={`p-2 rounded-full transition-colors ${
                    (inputValue.trim() || selectedSuggestions.size > 0) && !isTyping ? 'bg-[#007AFF] text-white shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Itinerary Visualization */}
        <div className={`
            flex-1 h-full md:block
            ${activeTab === 'itinerary' ? 'block w-full bg-[#F2F2F7]' : 'hidden'}
        `}>
           <div className="h-full md:rounded-3xl md:bg-white md:shadow-sm md:border md:border-gray-100 overflow-hidden md:p-6 p-4">
             <ItineraryView 
                data={itinerary} 
                pendingChoices={pendingChoices}
                onSelectChoice={handleSelectChoice}
                onToggleLock={handleToggleLock} 
                onRegenerate={handleRegenerate}
                onRemove={handleRemoveActivity}
             />
           </div>
        </div>

      </div>
    </div>
  );
}

export default App;