from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as assessment_router


app = FastAPI(
    title="AI Assessment Evaluator API",
    description="Extracts questions, maps handwritten student answers, and returns bounding boxes",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check():

    return {
        "status": "healthy",
        "service": "AI Assessment Evaluator API",
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {
        "message": "AI Assessment Evaluator API is active."
    }


# ============================================================
# ROUTES
# ============================================================

app.include_router(
    assessment_router
)