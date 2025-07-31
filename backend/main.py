from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="UrbanSage API", 
    description="Smart City Issue Management System",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test endpoint
@app.get("/")
def read_root():
    return {"message": "UrbanSage API is running successfully!", "status": "active"}

# Issues endpoint
@app.get("/issues")
def get_issues():
    return {
        "issues": [
            {"id": 1, "title": "Pothole on Main Street", "status": "open"},
            {"id": 2, "title": "Broken streetlight", "status": "in-progress"}
        ]
    }

# Create new issue endpoint
@app.post("/issues")
def create_issue(title: str, description: str, location: str):
    return {
        "message": "Issue created successfully",
        "issue": {
            "title": title,
            "description": description,
            "location": location,
            "status": "open"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
