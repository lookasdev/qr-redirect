from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import db
from models import UserResponse, AnalyticsResponse, DailyScanCount
from auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/{slug}", response_model=AnalyticsResponse)
async def get_analytics(slug: str, current_user: UserResponse = Depends(get_current_user)):
    # Verify ownership
    link = await db["links"].find_one({"slug": slug, "owner_id": current_user.id})
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    total_scans = await db["scan_events"].count_documents({"slug": slug})
    
    # Aggregate daily scans for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    pipeline = [
        {"$match": {"slug": slug, "timestamp": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {
                "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    daily_results = await db["scan_events"].aggregate(pipeline).to_list(length=30)
    daily_scans = [DailyScanCount(date=res["_id"], count=res["count"]) for res in daily_results]
    
    # Aggregate top user agents
    ua_pipeline = [
        {"$match": {"slug": slug}},
        {"$group": {
            "_id": "$user_agent",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    
    ua_results = await db["scan_events"].aggregate(ua_pipeline).to_list(length=5)
    top_user_agents = {res["_id"] or "Unknown": res["count"] for res in ua_results}
    
    # Aggregate top locations
    loc_pipeline = [
        {"$match": {"slug": slug, "country": {"$ne": None}}},
        {"$group": {
            "_id": "$country",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    
    loc_results = await db["scan_events"].aggregate(loc_pipeline).to_list(length=10)
    locations = {res["_id"]: res["count"] for res in loc_results}

    # Aggregate devices
    device_pipeline = [
        {"$match": {"slug": slug, "device_type": {"$ne": None}}},
        {"$group": {
            "_id": "$device_type",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    device_results = await db["scan_events"].aggregate(device_pipeline).to_list(length=10)
    devices = {res["_id"]: res["count"] for res in device_results}

    # Aggregate OS
    os_pipeline = [
        {"$match": {"slug": slug, "os_name": {"$ne": None}}},
        {"$group": {
            "_id": "$os_name",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    os_results = await db["scan_events"].aggregate(os_pipeline).to_list(length=10)
    os_breakdown = {res["_id"]: res["count"] for res in os_results}

    return AnalyticsResponse(
        slug=slug,
        total_scans=total_scans,
        daily_scans=daily_scans,
        top_user_agents=top_user_agents,
        locations=locations,
        devices=devices,
        os_breakdown=os_breakdown
    )
