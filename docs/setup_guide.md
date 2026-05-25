# Raksha AI Setup Guide

This guide explains how to run the Raksha AI project locally for development and testing.

## 1. Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- Git
- A local terminal with access to the repository

## 2. Repository setup

```bash
git clone https://github.com/your-username/raksha-ai.git
cd raksha-ai
```

## 3. Backend setup

### Create and activate a virtual environment

```bash
python -m venv .venv
.venv\Scripts\activate
```

### Install Python dependencies

```bash
pip install -r backend/Requirements.txt
```

### Configure environment variables

The backend reads configuration from environment variables in `backend/config.py`.

Recommended defaults for local development:

```bash
set FLASK_ENV=development
set FLASK_DEBUG=1
set PORT=5000
set HOST=0.0.0.0
set SECRET_KEY=raksha-ai-dev-secret
set UPLOAD_DIR=backend/uploads
```

If you plan to use Google Maps or Firebase integrations, set these values as well:

```bash
set GOOGLE_MAPS_API_KEY=your_google_maps_key
set FIREBASE_PROJECT_ID=your_project_id
set FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
set FIREBASE_SERVICE_ACCOUNT_PATH=path/to/serviceAccount.json
```

### Run the backend

```bash
python backend/main.py
```

The server runs at `http://127.0.0.1:5000` by default.

### Verify backend health

```bash
curl http://127.0.0.1:5000/health
```

You should receive a JSON response with a `status` of `ok`.

## 4. Frontend setup

### Install dependencies

```bash
cd frontend
npm install
```

### Start the development server

```bash
npm start
```

The app opens in your browser at `http://localhost:3000` (or the next available port).

### Configure the API base URL

Create a `.env` file in `frontend/` if you need to point the app to a non-default backend:

```env
REACT_APP_API_BASE_URL=http://127.0.0.1:5000
```

## 5. Run the AI demos

The repository contains demo scripts for the risk and pothole models.

### Pothole demo

```bash
python ai-models/pothole_detection/demo.py
```

### Risk demo

```bash
python ai-models/risk_pridiction/demo.py
```

### Run both demos together

```bash
python ai-models/run_demos.py
```

## 6. Common checks

### Frontend API check

Open the browser and confirm that the dashboard and SOS pages load.

### Backend endpoint checks

Test a few endpoints with `curl`:

```bash
curl http://127.0.0.1:5000/
curl http://127.0.0.1:5000/risk/analytics/hourly
curl http://127.0.0.1:5000/dashboard/summary
```

## 7. Troubleshooting

### Backend import errors

- Confirm the virtual environment is active.
- Reinstall dependencies from `backend/Requirements.txt`.

### Frontend fails to connect to backend

- Confirm the backend is running.
- Ensure `REACT_APP_API_BASE_URL` matches your backend URL.

### Image uploads fail

- Confirm the upload directory exists.
- Check that the image uses a supported extension such as `jpg`, `jpeg`, `png`, `webp`, or `heic`.

### SOS or maps features are unavailable

- The current implementation uses fallback behavior and optional external integrations.
- Verify your API keys and environment variables if you are enabling those integrations.

## 8. Recommended development flow

1. Start the backend.
2. Start the frontend.
3. Test `/health`, `/dashboard/summary`, and `/risk/score`.
4. Upload a sample image to validate road detection.
5. Trigger the SOS flow once the frontend is connected.

## 9. Project files to know

- `backend/main.py` — Flask application and route definitions
- `backend/models/` — lightweight model logic
- `backend/services/` — Google Maps, AI bridge, and Firebase helpers
- `frontend/src/services/` — frontend API wrappers
- `ai-models/` — local demo scripts and model artifacts
