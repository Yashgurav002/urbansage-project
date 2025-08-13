from transformers import pipeline
from datetime import datetime
from typing import Dict
import os

class UrbanSageAI:
    def __init__(self):
        self.classifier = None  # Don't load at startup
        self.model_name = "distilbert-base-uncased-finetuned-sst-2-english"

    def load_model(self):
        """
        Load the Hugging Face model on demand
        """
        if self.classifier is None:
            try:
                print("⚡ Loading AI classification model...")
                self.classifier = pipeline(
                    "text-classification",
                    model=self.model_name,
                    return_all_scores=True
                )
                print("✅ AI model loaded successfully!")
            except Exception as e:
                print(f"❌ Error loading AI model: {e}")
                self.classifier = None

    def classify_issue_type(self, title: str, description: str) -> Dict:
        text = f"{title} {description}".lower()
        categories = {
            "infrastructure": {
                "keywords": ["pothole", "road", "sidewalk", "bridge", "pavement", "construction",
                           "street", "curb", "drainage", "sewer", "water", "pipe"],
                "priority_base": 7, "urgency_multiplier": 1.2
            },
            "lighting": {
                "keywords": ["light", "lamp", "streetlight", "lighting", "dark", "bulb",
                           "electricity", "power", "illumination"],
                "priority_base": 6, "urgency_multiplier": 1.1
            },
            "safety": {
                "keywords": ["unsafe", "danger", "crime", "accident", "emergency", "fire",
                           "police", "violence", "security", "hazard"],
                "priority_base": 9, "urgency_multiplier": 1.5
            },
            "cleanliness": {
                "keywords": ["trash", "garbage", "waste", "dirty", "cleaning", "litter",
                           "sanitation", "smell", "odor", "pest"],
                "priority_base": 5, "urgency_multiplier": 1.0
            },
            "transportation": {
                "keywords": ["traffic", "bus", "transit", "parking", "vehicle", "car",
                           "bike", "bicycle", "signal", "sign", "crossing"],
                "priority_base": 6, "urgency_multiplier": 1.1
            },
            "environment": {
                "keywords": ["pollution", "noise", "air", "water", "environment", "park",
                           "tree", "green", "nature", "wildlife"],
                "priority_base": 6, "urgency_multiplier": 1.0
            },
            "general": {"keywords": [], "priority_base": 5, "urgency_multiplier": 1.0}
        }
        scores = {cat: sum(1 for kw in data["keywords"] if kw in text) or 0 for cat, data in categories.items()}
        best_category = max(scores.items(), key=lambda x: x[1])
        category_name = best_category[0] if best_category[1] > 0 else "general"
        return {
            "category": category_name,
            "confidence": min(best_category[1] / 3, 1.0),
            "priority_base": categories[category_name]["priority_base"],
            "urgency_multiplier": categories[category_name]["urgency_multiplier"]
        }

    def analyze_sentiment(self, text: str) -> Dict:
        self.load_model()  # Load model only when needed
        if not self.classifier:
            return {"sentiment": "neutral", "urgency_score": 0.5}
        try:
            results = self.classifier(text[:512])
            neg_score = pos_score = 0
            for res in results[0]:
                if res['label'] == 'NEGATIVE':
                    neg_score = res['score']
                elif res['label'] == 'POSITIVE':
                    pos_score = res['score']
            urgency_score = neg_score
            sentiment = "urgent" if neg_score > 0.7 else "moderate" if neg_score > 0.4 else "low"
            return {"sentiment": sentiment, "urgency_score": urgency_score,
                    "negative_confidence": neg_score, "positive_confidence": pos_score}
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return {"sentiment": "neutral", "urgency_score": 0.5}

    def calculate_priority_score(self, issue_data: Dict) -> Dict:
        classification = self.classify_issue_type(issue_data.get('title', ''), issue_data.get('description', ''))
        sentiment_analysis = self.analyze_sentiment(f"{issue_data.get('title', '')} {issue_data.get('description', '')}")
        created_at = issue_data.get('created_at', datetime.now())
        if isinstance(created_at, str):
            from datetime import datetime as dt
            created_at = dt.fromisoformat(created_at.replace('Z', '+00:00'))
        time_diff = (datetime.now() - created_at.replace(tzinfo=None)).total_seconds()
        time_factor = max(0.8, 1.2 - (time_diff / 86400))
        location_factor = 1.0
        if any(loc in issue_data.get('location', '').lower() for loc in ["downtown", "school", "hospital", "main street", "highway"]):
            location_factor = 1.2
        urgency_boost = 1.3 if any(kw in (issue_data.get('title', '') + issue_data.get('description', '')).lower() for kw in ["emergency", "urgent", "immediate", "danger", "broken", "flooded", "blocked"]) else 0.5
        base_score = classification["priority_base"]
        urgency_multiplier = classification["urgency_multiplier"]
        sentiment_multiplier = 1.0 + (sentiment_analysis["urgency_score"] * 0.3)
        final_score = max(1.0, min(10.0, base_score * urgency_multiplier * sentiment_multiplier * time_factor * location_factor * urgency_boost))
        priority_level = "HIGH" if final_score >= 9.2 else "MEDIUM" if final_score >= 7.0 else "LOW"
        return {
            "category": classification["category"],
            "priority_score": round(final_score, 2),
            "priority_level": priority_level,
            "sentiment": sentiment_analysis["sentiment"],
            "factors": {
                "base_score": base_score,
                "classification_confidence": classification["confidence"],
                "urgency_score": sentiment_analysis["urgency_score"],
                "time_factor": round(time_factor, 2),
                "location_factor": location_factor,
                "urgency_boost": urgency_boost
            }
        }

# Singleton AI service
ai_service = UrbanSageAI()
