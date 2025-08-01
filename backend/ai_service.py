from transformers import pipeline
import numpy as np
from datetime import datetime
import re
from typing import Dict, List, Tuple

class UrbanSageAI:
    def __init__(self):
        # Initialize the text classification pipeline
        # Using DistilBERT - faster and smaller than BERT
        # self.hf_token = os.getenv("HUGGINGFACE_TOKEN")
        try:
            self.classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                return_all_scores=True
            )
            print("✅ AI Classification model loaded successfully!")
        except Exception as e:
            print(f"❌ Error loading AI model: {e}")
            self.classifier = None
    
    def classify_issue_type(self, title: str, description: str) -> Dict:
        """
        Classify urban issues into categories based on keywords and content
        """
        text = f"{title} {description}".lower()
        
        # Define issue categories with keywords
        categories = {
            "infrastructure": {
                "keywords": ["pothole", "road", "sidewalk", "bridge", "pavement", "construction", 
                           "street", "curb", "drainage", "sewer", "water", "pipe"],
                "priority_base": 7,
                "urgency_multiplier": 1.2
            },
            "lighting": {
                "keywords": ["light", "lamp", "streetlight", "lighting", "dark", "bulb", 
                           "electricity", "power", "illumination"],
                "priority_base": 6,
                "urgency_multiplier": 1.1
            },
            "safety": {
                "keywords": ["unsafe", "danger", "crime", "accident", "emergency", "fire", 
                           "police", "violence", "security", "hazard"],
                "priority_base": 9,
                "urgency_multiplier": 1.5
            },
            "cleanliness": {
                "keywords": ["trash", "garbage", "waste", "dirty", "cleaning", "litter", 
                           "sanitation", "smell", "odor", "pest"],
                "priority_base": 5,
                "urgency_multiplier": 1.0
            },
            "transportation": {
                "keywords": ["traffic", "bus", "transit", "parking", "vehicle", "car", 
                           "bike", "bicycle", "signal", "sign", "crossing"],
                "priority_base": 6,
                "urgency_multiplier": 1.1
            },
            "environment": {
                "keywords": ["pollution", "noise", "air", "water", "environment", "park", 
                           "tree", "green", "nature", "wildlife"],
                "priority_base": 6,
                "urgency_multiplier": 1.0
            },
            "general": {
                "keywords": [],
                "priority_base": 5,
                "urgency_multiplier": 1.0
            }
        }
        
        # Count keyword matches for each category
        scores = {}
        for category, data in categories.items():
            if category == "general":
                scores[category] = 1  # Default fallback
                continue
                
            keyword_count = sum(1 for keyword in data["keywords"] if keyword in text)
            scores[category] = keyword_count
        
        # Find the best matching category
        best_category = max(scores.items(), key=lambda x: x[1])
        category_name = best_category[0]
        
        # If no specific keywords matched, use general
        if best_category[1] == 0:
            category_name = "general"
        
        return {
            "category": category_name,
            "confidence": min(best_category[1] / 3, 1.0),  # Normalize confidence
            "priority_base": categories[category_name]["priority_base"],
            "urgency_multiplier": categories[category_name]["urgency_multiplier"]
        }
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment to determine urgency level
        """
        if not self.classifier:
            return {"sentiment": "neutral", "urgency_score": 0.5}
            
        try:
            results = self.classifier(text[:512])  # Limit text length
            
            # Find negative sentiment (indicates urgency/frustration)
            negative_score = 0
            positive_score = 0
            
            for result in results[0]:
                if result['label'] == 'NEGATIVE':
                    negative_score = result['score']
                elif result['label'] == 'POSITIVE':
                    positive_score = result['score']
            
            # Higher negative sentiment = higher urgency
            urgency_score = negative_score
            sentiment = "urgent" if negative_score > 0.7 else "moderate" if negative_score > 0.4 else "low"
            
            return {
                "sentiment": sentiment,
                "urgency_score": urgency_score,
                "negative_confidence": negative_score,
                "positive_confidence": positive_score
            }
            
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return {"sentiment": "neutral", "urgency_score": 0.5}
    
    def calculate_priority_score(self, issue_data: Dict) -> Dict:
        """
        Calculate comprehensive priority score based on multiple factors
        """
        title = issue_data.get('title', '')
        description = issue_data.get('description', '')
        location = issue_data.get('location', '')
        created_at = issue_data.get('created_at', datetime.now())
        
        # 1. Classify issue type
        classification = self.classify_issue_type(title, description)
        
        # 2. Analyze sentiment for urgency
        full_text = f"{title} {description}"
        sentiment_analysis = self.analyze_sentiment(full_text)
        
        # 3. Calculate time factor (newer issues get slight priority boost)
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        time_diff = (datetime.now() - created_at.replace(tzinfo=None)).total_seconds()
        time_factor = max(0.8, 1.2 - (time_diff / 86400))  # Decreases over 24 hours
        
        # 4. Location factor (some areas might be more critical)
        location_factor = 1.0
        critical_locations = ["downtown", "school", "hospital", "main street", "highway"]
        if any(loc in location.lower() for loc in critical_locations):
            location_factor = 1.2
        
        # 5. Urgency keywords detection
        urgency_keywords = ["emergency", "urgent", "immediate", "danger", "broken", "flooded", "blocked"]
        urgency_boost = 0.5
        if any(keyword in full_text.lower() for keyword in urgency_keywords):
            urgency_boost = 1.3
        
        # 6. Calculate final priority score (1-10 scale)
        base_score = classification["priority_base"]
        urgency_multiplier = classification["urgency_multiplier"]
        sentiment_multiplier = 1.0 + (sentiment_analysis["urgency_score"] * 0.3)
        
        final_score = (
            base_score * 
            urgency_multiplier * 
            sentiment_multiplier * 
            time_factor * 
            location_factor * 
            urgency_boost
        )
        
        # Clamp to 1-10 range
        final_score = max(1.0, min(10.0, final_score))
        
        # Determine priority level
        if final_score >= 9.2:
            priority_level = "HIGH"
        elif final_score >= 7.0:
            priority_level = "MEDIUM"
        else:
            priority_level = "LOW"
        
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

# Global AI instance
ai_service = UrbanSageAI()
