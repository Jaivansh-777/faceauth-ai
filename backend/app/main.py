import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.utils.rate_limit import limiter

from app.api import enroll, auth, logs, users, detect
from app.db.database import engine, Base, SessionLocal
from app.models.user import User, AuthLog
from sqlalchemy import func

app = FastAPI(
    title="FaceAuth AI",
    description="AI-powered facial authentication system",
    version="2.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

paths = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist"),
]
for p in paths:
    if os.path.isdir(os.path.join(p, "assets")):
        frontend_dist = p
        break
else:
    frontend_dist = paths[0]

assets_path = os.path.join(frontend_dist, "assets")
if os.path.isdir(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173")
cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


@app.get("/")
async def serve_frontend():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_path):
        with open(index_path) as f:
            return HTMLResponse(f.read())
    return {"message": "FaceAuth AI API — frontend not built. Run `cd frontend && npm run build`"}


app.include_router(enroll.router)
app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(users.router)
app.include_router(detect.router)


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok", "service": "FaceAuth AI", "version": "2.0.0"}


@app.get("/stats")
def stats():
    db = SessionLocal()
    try:
        total_users = db.query(func.count(User.id)).scalar()
        total_logs = db.query(func.count(AuthLog.id)).scalar()
        success_logs = db.query(func.count(AuthLog.id)).filter(AuthLog.success == True).scalar()
        failed_logs = db.query(func.count(AuthLog.id)).filter(AuthLog.success == False).scalar()
        recent_logs = db.query(AuthLog).order_by(AuthLog.created_at.desc()).limit(10).all()
        users_list = db.query(User).order_by(User.created_at.desc()).limit(10).all()
        return {
            "total_users": total_users or 0,
            "total_logs": total_logs or 0,
            "success_logs": success_logs or 0,
            "failed_logs": failed_logs or 0,
            "recent_logs": [
                {
                    "id": log.id,
                    "user_name": log.user_name,
                    "confidence": log.confidence,
                    "success": log.success,
                    "timestamp": log.created_at.isoformat() if log.created_at else None,
                }
                for log in recent_logs
            ],
            "recent_users": [
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "is_active": u.is_active,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                }
                for u in users_list
            ],
        }
    finally:
        db.close()


@app.get("/{path:path}")
async def serve_spa(path: str):
    if path.startswith(("enroll/", "auth/", "logs/", "users/", "stats", "health")):
        return JSONResponse({"detail": "Not found"}, status_code=404)
    return await serve_frontend()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
