// Types for Trip History and Chat History

export interface ChatHistoryItem {
  id: string;
  type: 'chat' | 'trip';
  title: string;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
  tripData?: TripPlanData;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TripPlanData {
  departure: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  travelStyle: string;
  interests: string[];
  accommodation: string;
  transportation: string;
  generatedPlan?: unknown;
}

export interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  historyItems: ChatHistoryItem[];
  currentItemId?: string;
  onSelectItem: (item: ChatHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onNewItem: () => void;
  type: 'chat' | 'trip';
  title: string;
}
