from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from typing import Optional
import math
import auth
from schemas import (
    user_schema, 
    trip_schema, 
    booking_schema, 
    ai_recommendation_schema, 
    conversation_schema
)
from repositories import user_repo, trip_repo, friend_repo, booking_repo
from controllers.auth_ctrl import require_role, assert_owner_or_admin
from services.storage_service import upload_avatar, delete_old_avatar

router = APIRouter()


# ==================== HELPER FUNCTIONS ====================

def verify_user_exists(user_id: str) -> None:
    """Verify that a user exists, raise 404 if not."""
    if not user_repo.get_user_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )


def build_pagination(
    page: int, 
    limit: int, 
    total: int
) -> conversation_schema.Pagination:
    """Build pagination object."""
    return conversation_schema.Pagination(
        page=page,
        limit=limit,
        total=total,
        totalPages=math.ceil(total / limit),
        hasNext=page * limit < total,
        hasPrev=page > 1
    )


# ==================== USER CRUD OPERATIONS ====================

@router.get("/all", response_model=list[user_schema.UserResponse])
def get_all_users(current_user=Depends(require_role([0, 1]))):
    """Get all users in the system."""
    return user_repo.get_users()


@router.post('/sync', response_model=user_schema.UserResponse)
def sync_user(
    user: user_schema.UserCreate,
):
    """
    Synchronize user data. 
    If user (by username/UUID) exists, update their data.
    If not, create a new record.
    """
    # Tìm user theo username (chính là UUID từ hệ thống Booking)
    existing_user = user_repo.get_user_by_username(user.username)
    
    if existing_user:
        # Nếu đã tồn tại, thực hiện cập nhật
        id_user = existing_user[0]["iduser"]
        # Chuyển đổi UserCreate schema sang UserUpdate bằng cách dump dữ liệu
        update_data = user_schema.UserUpdate(**user.model_dump())
        return user_repo.update_user(id_user, update_data)
    
    # Nếu chưa tồn tại, kiểm tra tính hợp lệ và tạo mới
    if not user_repo.is_valid_user(user):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid user data"
        )
    
    return user_repo.create_user(user=user)


@router.post('/create-public', response_model=user_schema.UserResponse, status_code=status.HTTP_201_CREATED)

@router.post("/", response_model=user_schema.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: user_schema.UserCreate,
    current_user=Depends(require_role([0, 1]))
):
    """Create a new user."""
    if user_repo.is_user_exist(user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )
    
    if not user_repo.is_valid_user(user):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid user data"
        )
    
    return user_repo.create_user(user=user)


@router.get(
    "/search/{select}",
    response_model=user_schema.UserResponse,
    summary="Search user by idUser, username, email, or phoneNumber"
)
def search_user(
    select: str,
    lookup: str = Query(..., description="The value to search for"),
    current_user=Depends(require_role([0, 1]))
):
    """
    Search for a user by different criteria.
    
    - **select**: Field to search by (idUser, username, email, phoneNumber)
    - **lookup**: Value to search for
    """
    search_methods = {
        "idUser": user_repo.get_user_by_id,
        "username": user_repo.get_user_by_username,
        "email": user_repo.get_user_by_email,
        "phoneNumber": user_repo.get_user_by_phone,
    }
    
    search_func = search_methods.get(select)
    if not search_func:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid search field. Use: {', '.join(search_methods.keys())}"
        )
    
    user = search_func(lookup)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user[0]


@router.put("/{idUser}", response_model=user_schema.UserResponse)
def update_user(
    idUser: str,
    user: user_schema.UserUpdate,
    current_user=Depends(require_role([0, 1]))
):
    """Update user information."""
    assert_owner_or_admin(current_user, idUser)
    verify_user_exists(idUser)
    
    if not user_repo.is_valid_user(user):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid user data"
        )
    
    if not user_repo.check_after_update_user(user, idUser):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this information already exists"
        )
    
    return user_repo.update_user(idUser=idUser, user=user)


@router.patch("/{idUser}/avatar")
async def update_avatar(
    idUser: str,
    file: UploadFile = File(...),
    current_user=Depends(require_role([0, 1]))
):
    """Update user avatar."""
    assert_owner_or_admin(current_user, idUser)
    
    user = user_repo.get_user_by_id(idUser)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        # Delete old avatar if exists
        if user[0].get("avatar"):
            delete_old_avatar(user[0]["avatar"])
        
        # Upload new avatar
        public_url = await upload_avatar(file)
        updated_user = user_repo.update_user_avatar(idUser, public_url)
        
        return {
            "message": "Avatar updated successfully",
            "avatar_url": public_url,
            "user": updated_user
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update avatar: {str(e)}"
        )


@router.delete("/{idUser}", status_code=status.HTTP_200_OK)
def delete_user(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Delete a user."""
    assert_owner_or_admin(current_user, idUser)
    verify_user_exists(idUser)
    
    return user_repo.delete_user(idUser=idUser)


# ==================== USER RELATIONSHIPS ====================

@router.get("/{idUser}/conversations", response_model=conversation_schema.CombineResponse)
def get_user_conversations(
    idUser: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    includeArchived: bool = Query(True),
    search: Optional[str] = Query(None),
    current_user=Depends(require_role([0, 1]))
):
    """Get paginated conversations for a user."""
    assert_owner_or_admin(current_user, idUser)
    verify_user_exists(idUser)
    
    conversations, total = user_repo.get_conversations_by_user(
        idUser, page, limit, includeArchived, search
    )
    
    if not conversations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No conversations found"
        )
    
    pagination = build_pagination(page, limit, total)
    
    return conversation_schema.CombineResponse(
        conversations=conversations,
        pagination=pagination
    )


@router.get("/{idUser}/trips", response_model=list[trip_schema.TripResponse])
def get_user_trips(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Get all trips for a user."""
    verify_user_exists(idUser)
    
    trip_ids = user_repo.get_trips_of_user(idUser)
    if not trip_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no trips"
        )
    
    return [trip_repo.get_trip_by_id(trip_id)[0] for trip_id in trip_ids]


@router.get("/{idUser}/friends", response_model=list[user_schema.UserResponse])
def get_user_friends(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Get all friends for a user."""
    verify_user_exists(idUser)
    
    friend_data = friend_repo.get_friends_by_user(idUser)
    if not friend_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no friends"
        )
    
    return user_repo.get_friends_of_user(idUser, friend_data)


@router.get("/{idUser}/bookings", response_model=list[booking_schema.BookingResponse])
def get_user_bookings(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Get all bookings for a user."""
    assert_owner_or_admin(current_user, idUser)
    verify_user_exists(idUser)
    
    booking_ids = user_repo.get_booking_ids_of_user(idUser)
    if not booking_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no bookings"
        )
    
    return [booking_repo.get_booking_by_id(booking_id)[0] for booking_id in booking_ids]


@router.get("/{idUser}/friend_requests_sent", response_model=list[user_schema.UserResponse])
def get_sent_friend_requests(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Get all friend requests sent by the user."""
    assert_owner_or_admin(current_user, idUser)
    verify_user_exists(idUser)
    
    friend_ids = user_repo.get_friend_request_ids_of_user(idUser)
    if not friend_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has not sent any friend requests"
        )
    
    return [user_repo.get_user_by_id(friend_id)[0] for friend_id in friend_ids]


@router.get("/{idUser}/friend_requests_received", response_model=list[user_schema.UserResponse])
def get_received_friend_requests(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Get all friend requests received by the user."""
    assert_owner_or_admin(current_user, idUser)
    verify_user_exists(idUser)
    
    friend_ids = user_repo.get_friend_request_ids_to_user(idUser)
    if not friend_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has not received any friend requests"
        )
    
    return [user_repo.get_user_by_id(friend_id)[0] for friend_id in friend_ids]


@router.get("/{idUser}/reviewed_trips", response_model=list[trip_schema.TripResponse])
def get_user_reviewed_trips(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Get all trips reviewed by the user."""
    verify_user_exists(idUser)
    
    trip_ids = user_repo.get_reviewed_trip_ids_of_user(idUser)
    if not trip_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has not reviewed any trips"
        )
    
    return [trip_repo.get_trip_by_id(trip_id)[0] for trip_id in trip_ids]


@router.get("/{idUser}/ai_recommendations", response_model=list[ai_recommendation_schema.AIRecResponse])
def get_user_ai_recommendations(
    idUser: str,
    current_user=Depends(require_role([0, 1]))
):
    """Get all AI recommendations for the user."""
    assert_owner_or_admin(current_user, idUser)
    verify_user_exists(idUser)
    
    recommendations = user_repo.get_ai_recommendations_of_user(idUser)
    if not recommendations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no AI recommendations"
        )
    
    return recommendations