from pydantic import BaseModel
from typing import List, Optional

class Activity(BaseModel):
    time: str
    name: Optional[str] = None
    lat: float
    lon: float
    description: str
    namePlace: str
    city: str
    province: Optional[str] = None
    address: str
    rating: float
    
class TripDay(BaseModel):
    day: int
    date: str
    activities: List[Activity]
    
class TripParameters(BaseModel):
    location: str
    days: List[TripDay]
    
class TripPlan(BaseModel):
    name: str
    parameters: TripParameters

class ChatSuggestion(BaseModel):
    label: str  # A short label for the button (e.g., "Hỏi về điểm đến")
    content: str # The actual message content to send

class ChatSuggestions(BaseModel):
    suggestions: List[ChatSuggestion]

class ChatAssistantRequest(BaseModel):
    query: str
    history_context: Optional[str] = None

class ChatAssistantResponse(BaseModel):
    response: str
    suggestions: Optional[List[ChatSuggestion]] = None
