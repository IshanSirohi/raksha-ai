# Raksha AI Architecture

Raksha AI is a multi-layer application that combines a React frontend, a Flask backend, and lightweight AI components for road safety, risk prediction, and emergency response.

## 1. High-level architecture

```text
User browser
   |
   v
React frontend
   |
   v
Flask backend
   |-- Risk scoring and alerting
   |-- Road image detection
   |-- Dashboard summaries
   |-- Maps and SOS workflows
   |
   +--> AI bridge
         |
         +--> RoadModel
   |
   +--> Firebase / Google Maps integrations (optional and currently adapter-based)
```

## 2. Frontend

The frontend is built with React and contains these core areas:

- Dashboard pages for hotspots and safety analytics
- Road issue upload and detection UI
- Risk alert pages
- SOS pages with emergency actions
- Legal information pages

The frontend communicates with the backend through API services in `frontend/src/services/`.

## 3. Backend

The backend is implemented in Flask and exposed from `backend/main.py`.

### Core responsibilities

- Serve the health endpoint and application metadata
- Compute accident-risk scores from location and route context
- Detect road issues from uploaded images
- Provide dashboard summaries and hotspot feeds
- Resolve geocodes and nearby hospitals
- Trigger the SOS workflow

### Main modules

- `backend/main.py` — route definitions and server bootstrap
- `backend/config.py` — environment and runtime settings
- `backend/models/` — reusable model logic
- `backend/services/` — bridge, mapping, and Firebase integration logic

## 4. AI and inference flow

### Road issue detection

1. The user uploads an image from the frontend.
2. The frontend calls `POST /roads/detect`.
3. The backend saves the file and creates a detection job via `RakshaAIBridge`.
4. The bridge invokes `RakshaRoadModel`.
5. The model returns a structured detection payload with label, confidence, severity, and description.
6. The frontend polls `GET /roads/detect/<jobId>` until the result is complete.

### Risk prediction

1. The frontend sends GPS or zone context to `/risk/score` or `/risk/coordinate`.
2. `RakshaRiskModel` computes a score using time, weather, road, traffic, and location factors.
3. The backend returns a label, score, color, advice, and timestamp.
4. Alerts are stored in memory for `/risk/alerts` and `/risk/stream`.

### SOS workflow

1. The frontend sends an SOS request to `/sos/activate`.
2. The backend uses `RakshaAISOS` to create a structured alert payload.
3. The model resolves a location, simulates accident detection, and stores an incident log.

## 5. Data flow

### Dashboard

The dashboard uses `GET /dashboard/summary`, `GET /dashboard/recent-issues`, `GET /dashboard/hotspots`, and `GET /dashboard/map`.

### Maps

The maps layer uses `GET /maps/reverse-geocode` and `GET /maps/hospitals`.

### Local storage and runtime state

- Detection jobs are kept in memory inside `RakshaAIBridge`.
- Risk alerts are kept in memory in `backend/main.py`.
- SOS logs are written to `sos_logs.txt`.

## 6. Current implementation status

### Production-ready pieces

- Flask backend structure
- React frontend service layer
- AI bridge for road-image processing
- Risk scoring and dashboard APIs
- Maps and SOS route stubs

### Prototype-level pieces

- Road detection is currently a lightweight model with deterministic/mock behavior
- SOS alerts are simulated rather than sent through a real SMS or push provider
- Location enrichment uses fallback behavior when external APIs are unavailable
- Firebase and Google Maps integrations are prepared but not fully enforced by the current runtime

## 7. Extension points

The code is designed to be extended with:

- A real computer-vision road inspection model
- Live GPS and sensor input
- SMS / push notification providers
- Firebase-backed incident persistence
- Government and emergency-service integrations

## 8. Operational notes

- The backend uses environment variables for runtime configuration.
- The frontend expects `REACT_APP_API_BASE_URL` to point at the backend.
- The current setup is suitable for local development and UI validation.
- The default backend port is `5000`.

## 9. Recommended development sequence

1. Start the backend.
2. Start the frontend.
3. Validate health and dashboard APIs.
4. Test road-image detection.
5. Test risk scoring and alert streaming.
6. Wire real external services for production rollout.
