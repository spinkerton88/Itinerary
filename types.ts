export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  suggestions?: string[];
}

export enum TravelType {
  LEISURE = 'Leisure',
  WORK = 'Work',
  HONEYMOON = 'Honeymoon',
  ADVENTURE = 'Adventure',
  FAMILY = 'Family',
  UNSPECIFIED = 'Unspecified'
}

export interface TravelerInfo {
  adults: number;
  children: number;
  infants: number;
}

export type ActivityCategory = 'flight' | 'accommodation' | 'dining' | 'activity' | 'transit' | 'logistics';

export interface Activity {
  id?: string;
  time: string; // e.g. "10:00 AM"
  endTime?: string; // e.g. "12:00 PM"
  title: string; // e.g. "Flight to Paris" or "Louvre Museum"
  subTitle?: string; // e.g. "Flight UA123" or "Italian Cuisine"
  description: string;
  location: string;
  category: ActivityCategory;
  cost?: string;
  notes?: string; // e.g. "Reservation confirmed"
  bookingStatus?: 'booked' | 'pending' | 'suggested';
  imageQuery?: string; // Keyword for fetching a relevant image, e.g. "Eiffel Tower"
  isLocked?: boolean;
}

export interface DayPlan {
  date: string; // ISO string or "Day 1"
  dayTitle?: string; // e.g. "Arrival in Paris"
  activities: Activity[];
}

export interface Itinerary {
  title: string;
  destination: string;
  dates: string;
  travelType: TravelType;
  travelers: TravelerInfo;
  days: DayPlan[];
  totalEstimatedCost?: string;
}

export interface LoyaltyCard {
  id: string;
  provider: string; // e.g. "Amex", "Chase", "Delta"
  cardName: string; // e.g. "Platinum", "Sapphire Reserve"
  pointsBalance: string; // e.g. "150,000"
}

export interface UserProfile {
  loyaltyCards: LoyaltyCard[];
}

// Initial empty state for the itinerary
export const INITIAL_ITINERARY: Itinerary = {
  title: "New Trip",
  destination: "",
  dates: "",
  travelType: TravelType.UNSPECIFIED,
  travelers: { adults: 1, children: 0, infants: 0 },
  days: []
};