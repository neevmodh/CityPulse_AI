from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel
from typing import Optional
from services.csv_store import read_csv, append_row, new_id, now_iso
import hashlib, secrets
import math

try:
    import bcrypt
except ImportError:
    bcrypt = None

router = APIRouter()

# In-memory session store {token → user_id}
_sessions: dict[str, str] = {}


def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def _verify(pw: str, hashed: str) -> bool:
    if hashed.startswith("$2") and bcrypt is not None:
        try:
            return bcrypt.checkpw(pw.encode(), hashed.encode())
        except ValueError:
            return False
    return secrets.compare_digest(_hash(pw), hashed)


class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "citizen"
    ward_id: Optional[str] = None
    department_id: Optional[str] = None


def _row_to_user(u: dict) -> dict:
    def clean(value):
        return "" if value is None or (isinstance(value, float) and math.isnan(value)) else value

    return {
        "id":            clean(u.get("id")),
        "name":          clean(u.get("name")),
        "email":         clean(u.get("email")),
        "role":          clean(u.get("role")),
        "ward_id":       clean(u.get("ward_id")),
        "ward":          clean(u.get("ward_id")),
        "department_id": clean(u.get("department_id")),
    }


# POST /api/auth/login
@router.post("/login")
def login(body: LoginRequest, response: Response):
    df = read_csv("users")
    if df.empty or "email" not in df.columns:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    rows = df[df["email"] == body.email]
    if rows.empty:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    u = rows.iloc[0].to_dict()
    if not _verify(body.password, u.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_hex(32)
    _sessions[token] = u["id"]
    response.set_cookie(key="session_token", value=token, httponly=True, samesite="lax")
    return {"token": token, "user": _row_to_user(u)}


# POST /api/auth/logout
@router.post("/logout")
def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token and session_token in _sessions:
        del _sessions[session_token]
    response.delete_cookie("session_token")
    return {"message": "Logged out"}


# GET /api/auth/me
@router.get("/me")
def me(session_token: Optional[str] = Cookie(None)):
    if not session_token or session_token not in _sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = _sessions[session_token]
    df  = read_csv("users")
    rows = df[df["id"] == uid]
    if rows.empty:
        raise HTTPException(status_code=404, detail="User not found")
    return _row_to_user(rows.iloc[0].to_dict())


# POST /api/auth/register
@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    df = read_csv("users")
    if not df.empty and "email" in df.columns and (df["email"] == body.email).any():
        raise HTTPException(status_code=400, detail="Email already registered")
    append_row("users", {
        "id":            new_id("u"),
        "name":          body.name,
        "email":         body.email,
        "password_hash": _hash(body.password),
        "role":          body.role,
        "ward_id":       body.ward_id or "",
        "department_id": body.department_id or "",
        "created_at":    now_iso(),
    })
    return {"message": "Registration successful"}
