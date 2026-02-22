from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from pydantic import BaseModel
from datetime import datetime
from nanoid import generate
import user_agents
from cachetools import TTLCache
import httpx

from database import db
from models import (
    UserCreate, UserResponse, UserInDB, 
    QRLinkCreate, QRLinkUpdate, QRLinkResponse, ScanEvent
)
from auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

router = APIRouter()
cache = TTLCache(maxsize=1000, ttl=60) # 60 seconds TTL cache

# Background task for logging
async def log_scan_event(slug: str, user_agent: str, ip_address: str):
    country = None
    city = None
    region = None
    device_type = "Unknown"
    os_name = "Unknown"
    
    if user_agent:
        try:
            ua = user_agents.parse(user_agent)
            os_name = ua.os.family
            if ua.is_mobile:
                device_type = "Mobile"
            elif ua.is_tablet:
                device_type = "Tablet"
            elif ua.is_pc:
                device_type = "Desktop"
            elif ua.is_bot:
                device_type = "Bot"
        except Exception:
            pass

    if ip_address and ip_address not in ("127.0.0.1", "localhost", "::1"):
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"http://ip-api.com/json/{ip_address}?fields=status,country,regionName,city", timeout=3.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "success":
                        country = data.get("country")
                        region = data.get("regionName")
                        city = data.get("city")
        except Exception:
            pass # Silently fail on API limits/network errors
            
    event = ScanEvent(
        slug=slug,
        timestamp=datetime.utcnow(),
        user_agent=user_agent,
        ip_address=ip_address,
        country=country,
        city=city,
        region=region,
        device_type=device_type,
        os_name=os_name
    )
    await db["scan_events"].insert_one(event.dict())

# ================= AUTHENTICATION =================

@router.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    existing_user = await db["users"].find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = {"username": user.username, "password_hash": hashed_password}
    
    result = await db["users"].insert_one(new_user)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    created_user["id"] = str(created_user["_id"])
    return UserResponse(**created_user)

@router.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db["users"].find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ================= PUBLIC REDIRECT API =================

@router.get("/api/r/{slug}")
async def get_redirect_destination(slug: str, request: Request, background_tasks: BackgroundTasks):
    cached_data = cache.get(slug)
    
    if not cached_data:
        link = await db["links"].find_one({"slug": slug})
        if link:
            cached_data = {
                "destination_url": link["destination_url"],
                "is_paused": link.get("is_paused", False),
                "is_protected": link.get("is_protected", False),
                "password_hash": link.get("password_hash")
            }
            cache[slug] = cached_data
            
    if cached_data:
        if cached_data["is_paused"]:
            return {"is_paused": True, "destination_url": None, "is_protected": False}
        if cached_data.get("is_protected"):
            return {"is_paused": False, "destination_url": None, "is_protected": True}
            
        # Trigger async logging and return JSON
        user_agent = request.headers.get("user-agent", "")
        # Forwarded for is highly important for Ngrok tunnel reverse proxying to get the client IP
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            ip_address = forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else ""
            
        background_tasks.add_task(log_scan_event, slug, user_agent, ip_address)
        return {"is_paused": False, "destination_url": cached_data["destination_url"], "is_protected": False}
        
    raise HTTPException(status_code=404, detail="Link not found")

class VerifyPasswordRequest(BaseModel):
    password: str

@router.post("/api/r/{slug}/verify")
async def verify_link_password(slug: str, req: VerifyPasswordRequest, request: Request, background_tasks: BackgroundTasks):
    cached_data = cache.get(slug)
    if not cached_data:
        link = await db["links"].find_one({"slug": slug})
        if link:
            cached_data = {
                "destination_url": link["destination_url"],
                "is_paused": link.get("is_paused", False),
                "is_protected": link.get("is_protected", False),
                "password_hash": link.get("password_hash")
            }
            cache[slug] = cached_data
            
    if not cached_data or not cached_data.get("is_protected"):
        raise HTTPException(status_code=400, detail="Link is not password protected or does not exist")
        
    if not verify_password(req.password, cached_data.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Incorrect password")
        
    user_agent = request.headers.get("user-agent", "")
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else ""
        
    background_tasks.add_task(log_scan_event, slug, user_agent, ip_address)
    return {"destination_url": cached_data["destination_url"]}

# ================= CRUD LINKS =================

@router.get("/api/links", response_model=List[QRLinkResponse])
async def get_links(current_user: UserResponse = Depends(get_current_user)):
    cursor = db["links"].find({"owner_id": current_user.id}).sort("created_at", -1)
    links = await cursor.to_list(length=100)
    for link in links:
        link["id"] = str(link["_id"])
    return links

@router.post("/api/links", response_model=QRLinkResponse)
async def create_link(link: QRLinkCreate, current_user: UserResponse = Depends(get_current_user)):
    slug = link.slug
    if slug:
        existing_slug = await db["links"].find_one({"slug": slug})
        if existing_slug:
            raise HTTPException(status_code=400, detail="Custom slug is already in use")
    else:
        slug = generate(size=8)  # 8 char random string
        while await db["links"].find_one({"slug": slug}):
            slug = generate(size=8)
            
    link_data = {
        "title": link.title,
        "destination_url": str(link.destination_url),
        "owner_id": current_user.id,
        "slug": slug,
        "is_paused": link.is_paused,
        "is_protected": link.is_protected,
        "password_hash": get_password_hash(link.password_hash) if link.password_hash else None,
        "qr_customization": link.qr_customization,
        "created_at": datetime.utcnow()
    }
    result = await db["links"].insert_one(link_data)
    created_link = await db["links"].find_one({"_id": result.inserted_id})
    created_link["id"] = str(created_link["_id"])
    return QRLinkResponse(**created_link)

@router.patch("/api/links/{slug}", response_model=QRLinkResponse)
async def update_link(slug: str, link_update: QRLinkUpdate, current_user: UserResponse = Depends(get_current_user)):
    existing_link = await db["links"].find_one({"slug": slug, "owner_id": current_user.id})
    if not existing_link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    update_data = {k: v for k, v in link_update.dict(exclude_unset=True).items()}
    if "destination_url" in update_data:
        update_data["destination_url"] = str(update_data["destination_url"])
    if "password_hash" in update_data and update_data["password_hash"] is not None:
        update_data["password_hash"] = get_password_hash(update_data["password_hash"])
        
    if update_data:
        await db["links"].update_one(
            {"_id": existing_link["_id"]},
            {"$set": update_data}
        )
        if slug in cache and ("destination_url" in update_data or "is_paused" in update_data or "is_protected" in update_data or "password_hash" in update_data):
            del cache[slug]
            
    updated_link = await db["links"].find_one({"_id": existing_link["_id"]})
    updated_link["id"] = str(updated_link["_id"])
    return QRLinkResponse(**updated_link)

@router.delete("/api/links/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(slug: str, current_user: UserResponse = Depends(get_current_user)):
    existing_link = await db["links"].find_one({"slug": slug, "owner_id": current_user.id})
    if not existing_link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    await db["links"].delete_one({"_id": existing_link["_id"]})
    # Also delete associated scan events
    await db["scan_events"].delete_many({"slug": slug})
    
    if slug in cache:
        del cache[slug]
