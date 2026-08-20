from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

load_dotenv()

from routers import auth, issues, ai, risk, assignments, resolution, dashboard
from routers import workers, notifications

app = FastAPI(title="CityPulse AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router,          prefix="/api/auth")
app.include_router(issues.router,        prefix="/api/issues")
app.include_router(ai.router,            prefix="/api/ai")
app.include_router(risk.router,          prefix="/api/risk")
app.include_router(assignments.router,   prefix="/api/assignments")
app.include_router(resolution.router,    prefix="/api/resolution")
app.include_router(dashboard.router,     prefix="/api/dashboard")
app.include_router(workers.router,       prefix="/api/workers")
app.include_router(notifications.router, prefix="/api/notifications")


@app.get("/")
def root():
    return {"message": "CityPulse AI API is running", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
