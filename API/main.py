from fastapi import FastAPI
from controllers import review_ctrl, trip_ctrl, trip_member_ctrl, user_ctrl, auth_ctrl, booking_ctrl, notification_ctrl, friend_ctrl, ai_recommendation_ctrl, detail_information_ctrl, place_ctrl, detail_booking_ctrl, place_image_ctrl, place_review_ctrl, proxy_image, conversation_ctrl, message_ctrl, contact_ctrl, system_setting_ctrl, favorite_tour_ctrl, chat_ctrl, role_ctrl
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "version": "1.0.2", "message": "System settings should be here"}

@app.get("/test-settings")
def test_settings():
    return {"message": "Deployment is working!"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://your-frontend-domain.com", 
        "https://ai-trip-system-frontend-40205731279.us-central1.run.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# proxy_image.start_cache_cleaner()

app.include_router(auth_ctrl.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(user_ctrl.router, prefix="/api/v1/users", tags=["users"])
app.include_router(friend_ctrl.router, prefix="/api/v1/friends", tags=["friends"])
app.include_router(notification_ctrl.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(trip_ctrl.router, prefix="/api/v1/trips", tags=["trips"])
app.include_router(trip_member_ctrl.router, prefix="/api/v1/trip_members", tags=["trip_members"])
app.include_router(place_ctrl.router, prefix="/api/v1/places", tags=["places"])
app.include_router(detail_information_ctrl.router, prefix="/api/v1/details", tags=["detail_informations"])
app.include_router(review_ctrl.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(booking_ctrl.router, prefix="/api/v1/bookings", tags=["bookings"])
app.include_router(detail_booking_ctrl.router, prefix="/api/v1/detail_bookings", tags=["detail_bookings"])
app.include_router(ai_recommendation_ctrl.router, prefix="/api/v1/ai_recs", tags=["ai_recommendations"])
app.include_router(place_image_ctrl.router, prefix="/api/v1/place_images", tags=["place_images"])
app.include_router(place_review_ctrl.router, prefix="/api/v1/place_reviews", tags=["place_reviews"])
app.include_router(proxy_image.router, prefix="/api/v1/proxy_image", tags=["proxy_image"])
app.include_router(conversation_ctrl.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(message_ctrl.router, prefix="/api/v1/messages", tags=["messages"])
app.include_router(system_setting_ctrl.router, prefix="/api/v1/system-settings", tags=["system-settings"])
app.include_router(favorite_tour_ctrl.router, prefix="/api/v1/favorite-tours", tags=["favorite-tours"])
app.include_router(contact_ctrl.router, prefix="/api/v1", tags=["contact"])
app.include_router(chat_ctrl.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(role_ctrl.router, prefix="/api/v1/roles-management", tags=["roles-management"])
