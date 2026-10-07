from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class FavoriteTourBase(BaseModel):
    id_tour: int

class FavoriteTourCreate(FavoriteTourBase):
    id_user: UUID

class FavoriteTourResponse(FavoriteTourBase):
    id_user: UUID
    created_at: datetime

    class Config:
        from_attributes = True
