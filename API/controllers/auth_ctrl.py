from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from datetime import timedelta
from jose import jwt
import auth
from supabase_client import supabase
from repositories.user_repo import get_user_by_id
import uuid
from dotenv import load_dotenv
import os
from urllib.parse import urlencode
import httpx

load_dotenv()

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"

# Scope yêu cầu
SCOPE = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"

# Config security with OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# API register user
@router.post("/register")
def register(username: str, password: str, email: str = None):
    try:
        if not username or not password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username and password are required")
        
        # Check if username or email already exists
        existing_user = supabase.table("users").select("*").eq("username", username).execute()
        if existing_user.data:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")
        
        if email:
            existing_email = supabase.table("users").select("*").eq("email", email).execute()
            if existing_email.data:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        hashed_pw = auth.hash_password(password)
        
        # Generate proper UUID
        idUser = str(uuid.uuid4())
        
        user_data = {
            "iduser": idUser, 
            "username": username, 
            "password": hashed_pw, 
            "role": 1
        }
        if email:
            user_data["email"] = email
            
        response = supabase.table("users").insert(user_data).execute()

        return response.data[0] if response.data else None
    except Exception as e:
        print(f"❌ Register error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {str(e)}")

# API login user
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = supabase.table("users").select("*").eq("email", form_data.username).execute()
    if not user.data or not auth.verify_password(form_data.password, user.data[0]["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = auth.create_access_token({"sub": user.data[0]["iduser"], "role": user.data[0]["role"]}, timedelta(minutes=30))
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        iduser: str = payload.get("sub")
        role: int = payload.get("role")
        if not iduser or role is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception

    return {"iduser": iduser, "role": role}

def require_role(roles: list[int]):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return current_user
    return role_checker
    
def assert_owner_or_admin(user, target_id):
    if user["role"] != 0 and user["iduser"] != target_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")
    
@router.get("/google/login")
def google_login():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
    }
     
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url)
""" 
@router.get("/google/callback")
async def auth_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No code provided")
    
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = token_resp.json()
        
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to get access token")
    
    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_info = userinfo_resp.json()
        
    email = user_info["email"]
    name = user_info["name"]
    avatar = user_info["picture"]
    
    # Generate proper UUID
    idUser = str(uuid.uuid4())
    
    new_user = {
        "iduser": idUser, 
        "name": name,
        "username": name,
        "password": None,
        "gender": 2,           
        "email": email,
        "phonenumber": None,   
        "avatar": avatar,
        "theme": 0,          
        "language": 0,
        "role": 1   
    }
    
    role = 1
    existing = supabase.table("users").select("*").eq("email", email).execute()
    if not existing.data:
        supabase.table("users").insert(new_user).execute()
    else:
        idUser = existing.data[0]["iduser"]
        role = existing.data[0]["role"]
        
    access_token = auth.create_access_token({"sub": idUser, "role": role}, timedelta(minutes=30))
    return RedirectResponse(f"http://localhost:3000/auth/callback?access_token={access_token}") """
    
@router.get("/google/callback")
async def auth_callback(request: Request):
    # 1️⃣ Lấy authorization code
    code = request.query_params.get("code")
    print("🔥 GOOGLE CALLBACK HIT")
    print("URL:", request.url)
    print("QUERY:", request.query_params)
    print(f"Authorization code: {code}")
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not found"
        )

    async with httpx.AsyncClient() as client:
        # 2️⃣ Đổi code → access_token
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            },
        )

        token_data = token_resp.json()

        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google token error: {token_data}"
            )

        access_token_google = token_data.get("access_token")
        if not access_token_google:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Access token missing: {token_data}"
            )

        # 3️⃣ Lấy thông tin user từ Google
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={
                "Authorization": f"Bearer {access_token_google}"
            },
        )

        user_info = userinfo_resp.json()

        if userinfo_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google userinfo error: {user_info}"
            )

    # 4️⃣ Parse user info (defensive)
    email = user_info.get("email")
    name = user_info.get("name") or "Google User"
    avatar = user_info.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account has no email"
        )

    # 5️⃣ Check user tồn tại chưa
    existing = supabase.table("users").select("*").eq("email", email).execute()

    if not existing.data:
        idUser = str(uuid.uuid4())
        role = 1

        new_user = {
            "iduser": idUser,
            "name": name,
            "username": name,
            "password": None,
            "gender": 2,
            "email": email,
            "phonenumber": None,
            "avatar": avatar,
            "theme": 0,
            "language": 0,
            "role": role,
        }

        supabase.table("users").insert(new_user).execute()
    else:
        idUser = existing.data[0]["iduser"]
        role = existing.data[0]["role"]

    # 6️⃣ Generate JWT cho hệ thống của mình
    access_token = auth.create_access_token(
        data={
            "sub": idUser,
            "role": role
        },
        expires_delta=timedelta(minutes=30)
    )

    # 7️⃣ Redirect về FE
    return RedirectResponse(
        url=f"http://localhost:3000/auth/callback?access_token={access_token}"
    )
