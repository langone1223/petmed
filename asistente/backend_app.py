import os
import sqlite3
import jwt
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Header, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt
from cadet_core import CadetUserSession

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "cadet-secret-key-123"
ALGORITHM = "HS256"
USERS_DB = "users.db"

# Setup Users DB
with sqlite3.connect(USERS_DB) as conn:
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
    ''')
    conn.commit()

class RegisterReq(BaseModel):
    username: str
    password: str

class LoginReq(BaseModel):
    username: str
    password: str

class ChatReq(BaseModel):
    message: str

class PreferencesUpdateReq(BaseModel):
    voice_enabled: bool

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token missing or invalid")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/register")
def register(req: RegisterReq):
    with sqlite3.connect(USERS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (req.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already registered")
        
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(req.password.encode('utf-8'), salt).decode('utf-8')
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (req.username, hashed_pw))
        conn.commit()
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login(req: LoginReq):
    with sqlite3.connect(USERS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (req.username,))
        user = cursor.fetchone()
        
        if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user[1].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        token = jwt.encode(
            {"sub": str(user[0]), "exp": datetime.utcnow() + timedelta(days=7)},
            SECRET_KEY, algorithm=ALGORITHM
        )
        return {"access_token": token, "token_type": "bearer", "username": req.username}

@app.get("/api/me")
def get_me(user_id: str = Depends(verify_token)):
    with sqlite3.connect(USERS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session = CadetUserSession(user_id)
    return {
        "user_id": user_id, 
        "username": user[0],
        "preferences": session.preferences
    }

@app.post("/api/chat")
def chat(req: ChatReq, user_id: str = Depends(verify_token)):
    session = CadetUserSession(user_id)
    reply = session.process_message(req.message)
    return {"response": reply, "voice_enabled": session.preferences.get("opciones", {}).get("voice_enabled", True)}

@app.get("/api/chat/history")
def get_chat_history(user_id: str = Depends(verify_token)):
    session = CadetUserSession(user_id)
    history = []
    if os.path.exists(session.history_db):
        with sqlite3.connect(session.history_db) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_input, assistant_response FROM conversations ORDER BY id ASC")
            for user_msg, assistant_msg in cursor.fetchall():
                history.append({"sender": "user", "text": user_msg})
                history.append({"sender": "cadet", "text": assistant_msg})
    return {"history": history}

@app.post("/api/preferences")
def update_preferences(req: PreferencesUpdateReq, user_id: str = Depends(verify_token)):
    session = CadetUserSession(user_id)
    if "opciones" not in session.preferences:
        session.preferences["opciones"] = {}
    session.preferences["opciones"]["voice_enabled"] = req.voice_enabled
    session.save_preferences()
    return {"message": "Preferences updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend_app:app", host="0.0.0.0", port=8000, reload=True)
