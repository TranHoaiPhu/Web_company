from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from schemas import favorite_tour_schema
from repositories import favorite_tour_repo
from controllers.auth_ctrl import get_current_user

router = APIRouter()

@router.get("/my", response_model=List[favorite_tour_schema.FavoriteTourResponse])
def get_my_favorites(current_user=Depends(get_current_user)):
    """Lấy danh sách tour yêu thích của tôi."""
    return favorite_tour_repo.get_favorites_by_user(current_user["iduser"])

@router.post("/add", response_model=favorite_tour_schema.FavoriteTourResponse)
def add_to_favorites(favorite: favorite_tour_schema.FavoriteTourBase, current_user=Depends(get_current_user)):
    """Thêm một tour vào danh sách yêu thích."""
    # Kiểm tra xem đã yêu thích chưa
    if favorite_tour_repo.is_favorite(current_user["iduser"], favorite.id_tour):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tour already in favorites"
        )
    
    favorite_create = favorite_tour_schema.FavoriteTourCreate(
        id_user=current_user["iduser"],
        id_tour=favorite.id_tour
    )
    return favorite_tour_repo.add_favorite(favorite_create)

@router.delete("/remove/{id_tour}")
def remove_from_favorites(id_tour: int, current_user=Depends(get_current_user)):
    """Xóa một tour khỏi danh sách yêu thích."""
    return favorite_tour_repo.remove_favorite(current_user["iduser"], id_tour)

@router.get("/check/{id_tour}")
def check_favorite(id_tour: int, current_user=Depends(get_current_user)):
    """Kiểm tra xem một tour đã được yêu thích chưa."""
    is_fav = favorite_tour_repo.is_favorite(current_user["iduser"], id_tour)
    return {"is_favorite": is_fav}
