from supabase_client import supabase
from schemas.favorite_tour_schema import FavoriteTourCreate
from datetime import datetime

def get_favorites_by_user(id_user: str):
    return supabase.table("favorite_tours").select("*").eq("id_user", id_user).execute().data

def add_favorite(favorite: FavoriteTourCreate):
    response = supabase.table("favorite_tours").insert({
        "id_user": str(favorite.id_user),
        "id_tour": favorite.id_tour
    }).execute()
    return response.data[0]

def remove_favorite(id_user: str, id_tour: int):
    supabase.table("favorite_tours").delete().eq("id_user", id_user).eq("id_tour", id_tour).execute()
    return {"message": "Favorite tour removed successfully"}

def is_favorite(id_user: str, id_tour: int):
    response = supabase.table("favorite_tours").select("*").eq("id_user", id_user).eq("id_tour", id_tour).execute().data
    return len(response) > 0
