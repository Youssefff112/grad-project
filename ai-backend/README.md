# AI Backend (Python FastAPI)

Handles workout plan generation, nutrition plans, computer vision pose analysis, and the AI chatbot.

## Setup

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in values
copy .env.example .env
```

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `DATABASE_URL` — SQLite path (default: `./gym.db`)
- `OPENAI_API_KEY` — Optional, enables AI chatbot (falls back to rule-based if missing)

## Run

```bash
uvicorn main:app --reload --port 8000
```

The Node.js backend connects to this service at `http://localhost:8000` (configurable via `AI_SERVICE_URL` env var).

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/clients` | Create AI client profile |
| PUT | `/clients/{id}` | Update client profile |
| POST | `/clients/{id}/exercise-plan` | Generate workout plan |
| POST | `/clients/{id}/nutrition-plan` | Generate meal plan |
| POST | `/clients/{id}/chat` | AI chatbot message |
| POST | `/analyze-frame` | Real-time pose analysis (base64 image) |
| POST | `/test-exercise-base64` | Video exercise analysis |

## Structure

```
ai-backend/
├── main.py                  # FastAPI app entry point
├── config.py                # Settings (env vars)
├── models.py                # SQLAlchemy DB models
├── requirements.txt         # Python dependencies
├── data/
│   └── exercises_catalog.json  # Exercise dataset
├── schemas/                 # Pydantic request/response schemas
├── services/
│   ├── chatbot_service.py
│   ├── exercise_service.py
│   ├── nutrition_service.py
│   ├── pose_corrector.py
│   ├── cv/                  # Computer vision pipeline
│   ├── exercise_catalog/    # Exercise loading & rules
│   └── program_generator/   # Workout & nutrition generators
└── static/                  # HTML test pages
```
