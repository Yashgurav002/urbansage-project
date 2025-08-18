# UrbanSage: Smart City Issue Reporting Platform

UrbanSage is a full-stack, AI-powered platform for **citizens, administrators, and city representatives** to **report, analyze, and resolve urban issues** using technology.  
It is deployed and available via both **web and mobile apps** (Expo/React Native/Next.js/FastAPI stack).

---

## 🌎 Project Overview

Citizens use UrbanSage to:
- **Report city issues** (e.g., potholes, broken lights, sanitation, safety hazards)
- **Attach photos and GPS location** (mobile app)
- **AI-powered priority scoring** of issues for city admin teams

Administrators can:
- **View, filter, and manage** all citizen-reported issues in real time
- **Track issue statistics, categories, and resolved status**
- Access a dashboard to **prioritize urgent problems** based on AI analysis

### 🚦 Technology Used
- **Backend:** FastAPI (Python), PostgreSQL, AI text classification
- **Web App:** Next.js (React), Tailwind CSS
- **Mobile App:** Expo/React Native (supports camera and location permissions)
- **AI/ML:** Hugging Face Transformers (BERT-based model)
- **Cloud/DevOps:** Free-tier hosting (e.g. Render, Vercel, Expo EAS)

---

## 🤖 AI-Powered Features

UrbanSage leverages **Hugging Face Transformers** for intelligent issue analysis:

### **Model Used:** 
- **`distilbert-base-uncased`** - A lightweight BERT variant optimized for fast inference
- **Text Classification Pipeline** for sentiment analysis and categorization

### **Why This Model:**
- **Efficient Performance:** DistilBERT is 60% smaller than BERT while retaining 97% of its performance
- **Low Resource Usage:** Perfect for free-tier hosting with limited CPU/memory
- **Multilingual Capabilities:** Works well with diverse city issue descriptions
- **Pre-trained Excellence:** Strong understanding of context and sentiment in text

### **AI Features:**
- **Automatic Issue Categorization** (Infrastructure, Safety, Cleanliness, Transportation, etc.)
- **Priority Scoring** (1-10 scale based on urgency and severity)
- **Sentiment Analysis** (Positive, Negative, Neutral citizen sentiment)
- **Confidence Scoring** for AI predictions

---

## 📱 Mobile App Features

- **Supports Android & iOS**
- **Camera integration:** Take and attach photos to issue reports
- **GPS integration:** Automatically captures location coordinates
- **Real-time sync** with backend database

## 🌐 Web App Features

- **Admin dashboard:** List, search, and filter issues
- **View statistics:** Total issues, categories, status, priority analysis
- **AI insights:** Priority distribution, sentiment trends, category breakdown
- **Issue resolution:** Change status, add comments, track progress

---

## 🚀 Live Demo & Deployment

UrbanSage is **deployed** for public testing.  
> **Note:**  
Due to the intensity of backend AI features (Hugging Face model inference) and real-time processing, the app may crash or slow down under heavy load on free-tier cloud hosting plans. The AI model requires significant CPU resources for text analysis, which can exceed free hosting limits during peak usage. For production or large-scale use, upgrading to a paid server or optimizing backend workloads is recommended.

---

## ✨ How To Use

- **Web version**: Open the UrbanSage website link (https://urbansage.vercel.app/).
- **Mobile version**: Download or run the UrbanSage app using Expo Go or install from a public build; use your phone camera and location to report issues instantly. 
1) Download Expo Go App from playstore/AppStore
2) Scan the QR below
<img width="594" height="429" alt="image" src="https://github.com/user-attachments/assets/3b9ce7e8-8a9c-4b83-bab6-8ecb18ef0786" />


---

## 🔗 Main Features Summary

- **Issue reporting (text and image)**
- **Automatic location tagging**
- **AI-powered issue scoring (urgency, sentiment) using Hugging Face BERT**
- **Intelligent categorization with confidence scores**
- **Admin panel for efficient management**
- **Built for mobile and web users**
- **Easy deployment and demo on free cloud providers**
- **Open source – extensible for any smart city**

---

## ⚠️ Hosting Limitation (Free Tier)

UrbanSage runs on free hosting services for demonstration.  
- Under sustained usage, the backend (FastAPI and **Hugging Face model inference**) may fail or become unavailable due to limited server resources on free-tier plans.
- **AI processing is CPU-intensive** - the DistilBERT model requires significant computational resources for real-time text analysis.
- For full production, migrate backend/API to a scalable paid cloud or dedicated server with GPU acceleration for optimal AI performance.

---

## 🧠 AI Model Details

**Model Configuration Used**
-model_name = "distilbert-base-uncased"
-pipeline = pipeline("text-classification", model=model_name)

**Categories Supported**
-categories = [
"infrastructure", "lighting", "safety",
"cleanliness", "transportation", "environment", "general"
]

**Features**
-Priority scoring: 1-10 scale
-Sentiment analysis: positive/negative/neutral
-Confidence scoring for AI predictions
-Real-time inference on issue submission


## Authors & Credits

UrbanSage is designed and engineered by *Yashgurav002** ([@BuildWithYash](https://github.com/Yashgurav002))  
Built with ❤️ and powered by Hugging Face Transformers.
