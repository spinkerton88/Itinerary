import React, { useState } from 'react';
import { LoyaltyCard, UserProfile } from '../types';
import { XIcon, CreditCardIcon, PlusIcon, TrashIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const COMMON_CARDS = [
  "Amex Platinum",
  "Amex Gold",
  "Chase Sapphire Reserve",
  "Delta SkyMiles Reserve",
  "Marriott Bonvoy Brilliant",
  "Capital One Venture X",
  "United Infinite Card"
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onUpdateProfile }) => {
  const [newCardName, setNewCardName] = useState('');
  const [points, setPoints] = useState('');
  
  if (!isOpen) return null;

  const handleAddCard = () => {
    if (!newCardName) return;
    
    // Simple heuristic to guess provider
    let provider = "Bank";
    if (newCardName.toLowerCase().includes("amex")) provider = "American Express";
    else if (newCardName.toLowerCase().includes("chase")) provider = "Chase";
    else if (newCardName.toLowerCase().includes("delta")) provider = "Delta";
    else if (newCardName.toLowerCase().includes("marriott")) provider = "Marriott";
    else if (newCardName.toLowerCase().includes("united")) provider = "United";
    else if (newCardName.toLowerCase().includes("capital")) provider = "Capital One";

    const newCard: LoyaltyCard = {
      id: Date.now().toString(),
      cardName: newCardName,
      provider,
      pointsBalance: points || "0"
    };

    onUpdateProfile({
      ...profile,
      loyaltyCards: [...profile.loyaltyCards, newCard]
    });
    
    setNewCardName('');
    setPoints('');
  };

  const removeCard = (id: string) => {
    onUpdateProfile({
      ...profile,
      loyaltyCards: profile.loyaltyCards.filter(c => c.id !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Travel Preferences</h2>
            <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                <XIcon className="w-4 h-4 text-gray-600" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6">
            <p className="text-sm text-gray-500 mb-6">
                Add your travel cards and loyalty programs. The AI will use this to optimize points and benefits.
            </p>

            {/* List */}
            <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto no-scrollbar">
                {profile.loyaltyCards.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                        <CreditCardIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">No cards added yet</p>
                    </div>
                ) : (
                    profile.loyaltyCards.map(card => (
                        <div key={card.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-gradient-to-r from-gray-700 to-gray-900 rounded-md shadow-sm"></div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{card.cardName}</p>
                                    <p className="text-xs text-gray-500">{card.pointsBalance} pts</p>
                                </div>
                            </div>
                            <button onClick={() => removeCard(card.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add New */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add Card</h3>
                <div className="flex flex-col gap-2">
                    <select 
                        value={newCardName} 
                        onChange={(e) => setNewCardName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                        <option value="" disabled>Select a card...</option>
                        {COMMON_CARDS.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="Other">Other</option>
                    </select>
                    {newCardName === "Other" && (
                         <input 
                            type="text" 
                            placeholder="Card Name"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5"
                            onChange={(e) => setNewCardName(e.target.value)}
                         />
                    )}
                    <div className="flex gap-2">
                         <input 
                            type="text" 
                            placeholder="Points Balance (Optional)"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5"
                        />
                        <button 
                            onClick={handleAddCard}
                            className="bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors flex items-center justify-center"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};