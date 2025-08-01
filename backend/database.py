from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enhanced Issue model with AI fields
class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    location = Column(String)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # AI-powered fields
    category = Column(String, default="general")  # AI-classified category
    priority_score = Column(Float, default=5.0)  # 1-10 priority score
    priority_level = Column(String, default="MEDIUM")  # HIGH/MEDIUM/LOW
    sentiment = Column(String, default="neutral")  # AI sentiment analysis
    
    # AI analysis metadata
    ai_confidence = Column(Float, default=0.5)  # Classification confidence
    urgency_score = Column(Float, default=0.5)  # Urgency level

# Create tables (this will add new columns to existing table)
Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
