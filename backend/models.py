from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

# User models
class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    
    class Config:
        from_attributes = True

class UserInDB(UserCreate):
    password_hash: str

# QRLink models
class QRLinkBase(BaseModel):
    title: str
    destination_url: HttpUrl
    is_paused: bool = False
    is_protected: bool = False
    password_hash: Optional[str] = None
    qr_customization: Dict = Field(default_factory=dict)

class QRLinkCreate(QRLinkBase):
    slug: Optional[str] = None

class QRLinkUpdate(BaseModel):
    title: Optional[str] = None
    destination_url: Optional[HttpUrl] = None
    is_paused: Optional[bool] = None
    is_protected: Optional[bool] = None
    password_hash: Optional[str] = None
    qr_customization: Optional[Dict] = None

class QRLinkResponse(QRLinkBase):
    id: str
    owner_id: str
    slug: str
    created_at: datetime
    
    class Config:
        populate_by_name = True

# ScanEvent models
class ScanEvent(BaseModel):
    slug: str
    timestamp: datetime
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    device_type: Optional[str] = None
    os_name: Optional[str] = None

# Analytics response models
class DailyScanCount(BaseModel):
    date: str
    count: int

class AnalyticsResponse(BaseModel):
    slug: str
    total_scans: int
    daily_scans: List[DailyScanCount]
    top_user_agents: Dict[str, int]
    locations: Dict[str, int]
    devices: Dict[str, int]
    os_breakdown: Dict[str, int]
