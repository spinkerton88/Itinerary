import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { Itinerary, TravelType, UserProfile } from "../types";

// Tool definition to allow the AI to update the structured itinerary state
const updateItineraryTool: FunctionDeclaration = {
  name: "updateItinerary",
  description: "Update the structured travel itinerary. Use this to visualize flights, hotels, dining, and activities. Be specific with categories.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy title for the trip" },
      destination: { type: Type.STRING, description: "The main location(s) of the trip" },
      dates: { type: Type.STRING, description: "Date range of the trip" },
      travelType: { 
        type: Type.STRING, 
        description: "Type of travel: Leisure, Work, Honeymoon, Adventure, Family" 
      },
      adults: { type: Type.NUMBER, description: "Number of adults" },
      children: { type: Type.NUMBER, description: "Number of children" },
      infants: { type: Type.NUMBER, description: "Number of infants" },
      days: {
        type: Type.ARRAY,
        description: "List of daily plans",
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "Day label or date e.g., 'Day 1' or '2024-05-12'" },
            dayTitle: { type: Type.STRING, description: "Theme for the day, e.g., 'Arrival & Check-in'" },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique ID for the activity (if updating existing)" },
                  time: { type: Type.STRING, description: "Start time e.g. 10:00 AM" },
                  endTime: { type: Type.STRING, description: "End time e.g. 12:00 PM" },
                  title: { type: Type.STRING, description: "Main title e.g. 'Flight to NYC'" },
                  subTitle: { type: Type.STRING, description: "Subtitle e.g. 'Flight UA123' or 'Italian Cuisine'" },
                  description: { type: Type.STRING, description: "Details about the activity" },
                  location: { type: Type.STRING, description: "Address or place name" },
                  category: { 
                    type: Type.STRING, 
                    description: "Category: flight, accommodation, dining, activity, transit, logistics" 
                  },
                  bookingStatus: { 
                    type: Type.STRING, 
                    description: "Status: booked, pending, suggested" 
                  },
                  notes: { type: Type.STRING, description: "Important notes, reservation numbers, etc." },
                  cost: { type: Type.STRING, description: "Estimated cost e.g. '$150', 'Free', '~$50/person'" },
                  imageQuery: { type: Type.STRING, description: "A short search term to find a photo of this place, e.g. 'Eiffel Tower', 'Sushi Platter'" },
                  isLocked: { type: Type.BOOLEAN, description: "If true, this activity has been saved/locked by the user. Do not change it." }
                }
              }
            }
          }
        }
      },
      totalEstimatedCost: { type: Type.STRING, description: "Total estimated trip cost (e.g. '$3,500')" }
    },
    required: ["destination", "days"]
  }
};

const searchFlightsTool: FunctionDeclaration = {
  name: "searchFlights",
  description: "Search for real-world flight data (Simulated for this demo).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: { type: Type.STRING },
      destination: { type: Type.STRING },
      date: { type: Type.STRING }
    },
    required: ["origin", "destination", "date"]
  }
};

const suggestNextStepsTool: FunctionDeclaration = {
  name: "suggestNextSteps",
  description: "Provide a list of suggested follow-up actions or questions for the user to choose from.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      suggestions: {
        type: Type.ARRAY,
        description: "List of short, actionable suggestions for the user, e.g., 'Swap the hotel', 'Add a dinner reservation', 'Find cheaper flights'",
        items: { type: Type.STRING }
      }
    },
    required: ["suggestions"]
  }
};

const tools: Tool[] = [{ functionDeclarations: [updateItineraryTool, searchFlightsTool, suggestNextStepsTool] }];

const MODEL_NAME = "gemini-3-flash-preview";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async startChat(onItineraryUpdate: (itinerary: Itinerary) => void, userProfile?: UserProfile) {
    const loyaltyContext = userProfile?.loyaltyCards?.length 
        ? `
        **USER LOYALTY PROFILE & PREFERENCES**:
        The user holds the following credit cards and statuses. You MUST prioritize vendors, airlines, and hotels that align with these to maximize their benefits.
        ${userProfile.loyaltyCards.map(c => `- ${c.provider} ${c.cardName} (Points: ${c.pointsBalance})`).join('\n')}
        
        Strategy:
        - Amex Platinum/Centurion: Prioritize "Fine Hotels & Resorts" properties, Centurion Lounges, and Delta flights.
        - Chase Sapphire: Prioritize Hyatt, United, or travel partners compatible with Ultimate Rewards.
        - Brand Specific (Delta, Marriott, etc.): Prioritize that specific brand.
        - Explicitly mention in the chat why you chose a specific hotel/flight (e.g. "I selected the Ritz-Carlton because you can use your Marriott Bonvoy points...").
        ` 
        : "";

    this.chatSession = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `You are 'Itinerary', an exclusive, high-end travel concierge. Your mission is to curate bespoke travel experiences.
        
        **Your Persona**:
        - Professional, polished, and enthusiastic.
        - You are detail-oriented and proactive.
        - You speak in a natural, human way (not robotic).
        
        ${loyaltyContext}

        **Interaction Protocol**:
        1.  **Discovery Phase**: Do NOT generate a full itinerary immediately. You MUST ask clarifying questions first to understand the user's needs.
            - Ask for: Travel Dates, Duration, Destination (if unknown), Party Size (Adults/Kids), and Vibe (Relaxed, Adventure, Luxury, etc.).
            - Only after you have these details should you start building the plan.
        
        2.  **Drafting the Plan**:
            - **CRITICAL**: Always include a HOTEL/ACCOMMODATION option in the itinerary by default.
            - **COSTS**: You MUST provide an estimated cost for EVERY activity (e.g., "$25", "Free", "$200/night"). You MUST also calculate and provide the \`totalEstimatedCost\` for the entire trip.
            - When you have enough info, use the \`updateItinerary\` tool to visualize the plan on the right side of the screen.
            - Populate the \`imageQuery\` field for every activity so the user sees photos.
        
        3.  **Presentation (Chat Output)**:
            - Summarize your recommendations in the chat.
            - Use **Markdown** to make it readable (Bold headings, bullet points).
            - **HYPERLINKS**: When mentioning specific hotels, restaurants, or attractions, you MUST try to provide a Markdown link (e.g., \`[The Ritz Paris](https://www.ritzparis.com)\`).
            - **SUGGESTIONS**: You MUST use the \`suggestNextSteps\` tool at the end of every turn to offer 2-4 actionable options to the user. For example: "Swap the hotel", "Find a cheaper flight", "Add a museum tour".
            - Ask for feedback: "How does this look?" "Would you like to adjust the dinner reservation?"
        
        **Itinerary Data Rules**:
        - \`category\`: strictly use 'flight', 'accommodation', 'dining', 'activity', 'transit', 'logistics'.
        - \`imageQuery\`: Provide a simple keyword for the location/activity.
        - \`bookingStatus\`: Start as 'suggested'.
        - \`isLocked\`: If the user locks an activity, you MUST preserve it in future updates.
        `,
        tools: tools,
      },
    });

    return this.chatSession;
  }

  async sendMessage(
    message: string, 
    onItineraryUpdate: (itinerary: Partial<Itinerary>) => void,
    onSuggestionsUpdate?: (suggestions: string[]) => void
  ): Promise<string> {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized");
    }

    try {
      let result = await this.chatSession.sendMessage({ message });
      let finalSuggestions: string[] = [];

      while (result.functionCalls && result.functionCalls.length > 0) {
        const functionCalls = result.functionCalls;
        const functionResponses = [];

        for (const call of functionCalls) {
          if (call.name === "updateItinerary") {
             const args = call.args as any;
             const updateData: Partial<Itinerary> = {
                title: args.title || "Trip Plan",
                destination: args.destination || "",
                dates: args.dates || "",
                travelType: (args.travelType as TravelType) || TravelType.UNSPECIFIED,
                travelers: {
                    adults: args.adults || 1,
                    children: args.children || 0,
                    infants: args.infants || 0
                },
                days: args.days || [],
                totalEstimatedCost: args.totalEstimatedCost
             };

             onItineraryUpdate(updateData);
             
             functionResponses.push({
               id: call.id,
               name: call.name,
               response: { result: "Itinerary updated successfully on screen." }
             });
          } else if (call.name === "searchFlights") {
              functionResponses.push({
                  id: call.id,
                  name: call.name,
                  response: { result: "Simulated Search: Delta DL123 ($400), United UA456 ($420)." }
              });
          } else if (call.name === "suggestNextSteps") {
              const args = call.args as any;
              if (args.suggestions && Array.isArray(args.suggestions)) {
                  finalSuggestions = args.suggestions;
                  if (onSuggestionsUpdate) onSuggestionsUpdate(finalSuggestions);
              }
              functionResponses.push({
                  id: call.id,
                  name: call.name,
                  response: { result: "Suggestions received." }
              });
          }
        }

        result = await this.chatSession.sendMessage({
            message: functionResponses.map(r => ({ functionResponse: r })) 
        });
      }

      return result.text || "I've updated your plan.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "I'm having trouble connecting to the travel network right now. Please try again.";
    }
  }
}

export const geminiService = new GeminiService();