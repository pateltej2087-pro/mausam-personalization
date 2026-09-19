from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db

from routes.weather import router as weather_router
from routes.activities import router as activities_router
from routes.profiles import router as profiles_router

# Phase 3 routes
from routes.planner import router as planner_router
from routes.warnings import router as warnings_router
from routes.changes import router as changes_router
from routes.personalized import router as personalized_router

app = FastAPI(
    title="Mausam Personalization Engine API",
    description=(
        "Backend for the personalized Mausam homepage "
        "prototype (SIH26076)."
    ),
    version="0.3.0",
)


# -------------------------------------------------
# CORS
# -------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://mausam-personalization.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# DATABASE STARTUP
# -------------------------------------------------

@app.on_event("startup")
def on_startup():
    init_db()


# -------------------------------------------------
# ROOT
# -------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "mausam-backend",
        "version": "0.3.0",
    }


# -------------------------------------------------
# ROUTES
# -------------------------------------------------

app.include_router(weather_router)
app.include_router(activities_router)
app.include_router(profiles_router)

# Phase 3
app.include_router(planner_router)
app.include_router(warnings_router)
app.include_router(changes_router)
app.include_router(personalized_router)