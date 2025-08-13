import os
from sqlalchemy import func
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime

from database import get_db, Issue
from ai_service import UrbanSageAI

# === Lazy load AI service ===
ai_service = None  # Will initialize on first request


# ======================
# Pydantic Models
# ======================
class IssueCreate(BaseModel):
    title: str
    description: str
    location: str


class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    location: str
    status: str
    created_at: datetime
    category: str
    priority_score: float
    priority_level: str
    sentiment: str
    ai_confidence: float
    urgency_score: float

    class Config:
        from_attributes = True


class AIAnalysisResponse(BaseModel):
    category: str
    priority_score: float
    priority_level: str
    sentiment: str
    factors: dict


# ======================
# FastAPI App Config
# ======================
app = FastAPI(
    title="UrbanSage AI API",
    description="Smart City Issue Management with AI Classification",
    version="3.0.0"
)

# CORS Settings - allow frontend + local dev
origins = [
    "http://localhost:3000",  # Local frontend
    "https://urbansage.vercel.app"  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Only allow trusted domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================
# Helper - Lazy AI Init
# ======================
def get_ai_service():
    """Lazy initialize AI service when needed."""
    global ai_service
    if ai_service is None:
        print("🚀 Loading AI service for the first time...")
        ai_service = UrbanSageAI()
    return ai_service


# ======================
# Routes
# ======================
@app.get("/", include_in_schema=False)
@app.head("/", include_in_schema=False)
def read_root():
    """Root endpoint for health checks."""
    return {
        "message": "UrbanSage AI API v3.0 is running!",
        "status": "active",
        "features": ["database", "ai_classification", "priority_scoring"],
        "ai_status": "loaded" if ai_service else "not_loaded"
    }


@app.get("/issues", response_model=List[IssueResponse])
def get_issues(
    priority: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Fetch all issues, with optional filters."""
    query = db.query(Issue)

    if priority:
        query = query.filter(Issue.priority_level == priority.upper())
    if category:
        query = query.filter(Issue.category == category.lower())

    issues = query.order_by(Issue.priority_score.desc(), Issue.created_at.desc()).all()
    return issues


@app.post("/issues", response_model=dict)
def create_issue(issue: IssueCreate, db: Session = Depends(get_db)):
    """Create a new issue with AI classification."""
    ai = get_ai_service()

    issue_data = {
        "title": issue.title,
        "description": issue.description,
        "location": issue.location,
        "created_at": datetime.now()
    }

    ai_analysis = ai.calculate_priority_score(issue_data)

    db_issue = Issue(
        title=issue.title,
        description=issue.description,
        location=issue.location,
        category=ai_analysis["category"],
        priority_score=ai_analysis["priority_score"],
        priority_level=ai_analysis["priority_level"],
        sentiment=ai_analysis["sentiment"],
        ai_confidence=ai_analysis["factors"]["classification_confidence"],
        urgency_score=ai_analysis["factors"]["urgency_score"]
    )

    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)

    return {
        "message": "Issue analyzed and saved with AI classification!",
        "issue": {
            "id": db_issue.id,
            "title": db_issue.title,
            "description": db_issue.description,
            "location": db_issue.location,
            "status": db_issue.status,
            "created_at": db_issue.created_at,
            "ai_analysis": ai_analysis
        }
    }


@app.post("/analyze", response_model=AIAnalysisResponse)
def analyze_issue(issue: IssueCreate):
    """Analyze an issue with AI without saving it."""
    ai = get_ai_service()

    issue_data = {
        "title": issue.title,
        "description": issue.description,
        "location": issue.location,
        "created_at": datetime.now()
    }

    analysis = ai.calculate_priority_score(issue_data)
    return analysis


@app.get("/issues/priority/{priority_level}")
def get_issues_by_priority(priority_level: str, db: Session = Depends(get_db)):
    """Get issues filtered by priority level."""
    issues = db.query(Issue).filter(
        Issue.priority_level == priority_level.upper()
    ).order_by(Issue.priority_score.desc()).all()

    return {
        "priority_level": priority_level.upper(),
        "count": len(issues),
        "issues": issues
    }


@app.get("/stats")
def get_statistics(db: Session = Depends(get_db)):
    """Get statistics about issues."""
    total_issues = db.query(Issue).count()

    high_priority = db.query(Issue).filter(Issue.priority_level == "HIGH").count()
    medium_priority = db.query(Issue).filter(Issue.priority_level == "MEDIUM").count()
    low_priority = db.query(Issue).filter(Issue.priority_level == "LOW").count()

    categories = db.query(Issue.category, func.count(Issue.id)).group_by(Issue.category).all()
    avg_priority = db.query(func.avg(Issue.priority_score)).scalar() or 0

    return {
        "total_issues": total_issues,
        "priority_distribution": {
            "HIGH": high_priority,
            "MEDIUM": medium_priority,
            "LOW": low_priority
        },
        "categories": [{"category": cat, "count": count} for cat, count in categories],
        "average_priority_score": round(avg_priority, 2),
        "ai_status": "loaded" if ai_service else "not_loaded"
    }


# ======================
# Run Locally
# ======================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
