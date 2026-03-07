# AutoParts AI Dashboard

AI-powered car spare parts inventory management system.

## Tech Stack
- **Backend:** Python, FastAPI, NumPy, Pandas
- **Frontend:** React, Vite, Recharts
- **AI:** Anthropic Claude API

## Features
- 30-day demand forecasting
- Reorder alerts with AI recommendations
- Dead stock detection
- ABC classification
- AI chat (Ask Claude about your inventory)

## Setup

### Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
set ANTHROPIC_API_KEY=your_key_here
uvicorn main:app --reload --port 8000

### Frontend
cd frontend
npm install
npm run dev