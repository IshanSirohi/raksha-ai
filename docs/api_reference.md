# Raksha AI API Reference

This document describes the backend endpoints that are currently implemented in Raksha AI and highlights the frontend service calls that are still out of sync.

## 1. Current backend scope

The current Flask backend exposes these routes in `backend/main.py`:

- `/`
- `/health`
- `/risk/score`
- `/risk/coordinate`
- `/risk/alerts`
- `/risk/stream`
- `/risk/analytics/hourly`
- `/risk/analytics/zones`
- `/risk/route-profile`
- `/risk/preferences`
- `/dashboard/summary`
- `/dashboard/recent-issues`
- `/dashboard/hotspots`
- `/dashboard/map`
- `/roads/detect`
- `/roads/detect/<job_id>`
- `/maps/reverse-geocode`
- `/maps/hospitals`
- `/sos/activate`

## 2. Base URL

Default local backend URL:

```text
http://127.0.0.1:5000
```

The frontend uses `REACT_APP_API_BASE_URL` and defaults to the same base URL.

## 3. Health and metadata

### GET /

Returns basic service metadata.

**Response example**

```json
{
  "message": "Raksha AI backend running",
  "version": "1.0"
}
```

### GET /health

Checks backend health and returns Firebase configuration status from `backend/services/firebase_service.py`.

**Response example**

```json
{
  "available": false,
  "project_id": null,
  "database_url": null,
  "service_account_path": false
}
```

> The old documentation incorrectly showed `firebase` as a string. The current backend returns a structured object.

## 4. Risk endpoints

### POST /risk/score

Computes a risk score from route or zone context.

**Request body**

```json
{
  "lat": 28.6139,
  "lng": 77.209,
  "time": "evening",
  "weather": "rain",
  "road": "pothole",
  "traffic": "heavy",
  "zone": "NH-48 Ring Road"
}
```

**Response example**

```json
{
  "score": 84,
  "label": "critical",
  "color": "#dc2626",
  "factors": {
    "timeOfDay": 6,
    "weather": 7,
    "roadCondition": 8,
    "trafficLevel": 8
  },
  "advice": "Avoid this zone if possible. High accident probability detected. Drive with extreme caution and allow extra travel time.",
  "generatedAt": "2026-05-26T12:00:00+00:00"
}
```

### GET /risk/coordinate

Computes a risk score using latitude and longitude query parameters.

**Example**

```text
GET /risk/coordinate?lat=28.6139&lng=77.209
```

**Validation**

- `lat` and `lng` are required.
- Missing values return `400` with `{"success": false, "error": "lat and lng are required"}`.

### GET /risk/alerts

Returns in-memory risk alerts.

**Query parameters**

- `min_severity`
- `status`
- `limit`

### GET /risk/stream

Streams the latest risk alert as Server-Sent Events.

### GET /risk/analytics/hourly

Returns a 24-point hourly risk distribution.

### GET /risk/analytics/zones

Returns ranked risk zones from recent alerts.

### POST /risk/route-profile

Calculates a route profile for a list of waypoints.

**Request body**

```json
{
  "waypoints": [
    { "lat": 28.6, "lng": 77.2, "zone": "Zone A" },
    { "lat": 28.7, "lng": 77.3, "zone": "Zone B" }
  ],
  "time": "evening",
  "weather": "rain",
  "traffic": "heavy"
}
```

**Validation**

- `waypoints` must be an array with at least 2 entries.

### GET /risk/preferences

Returns the current risk preferences.

### PUT /risk/preferences

Updates risk preferences.

## 5. Dashboard endpoints

### GET /dashboard/summary

Returns dashboard summary cards, hotspot data, recent issues, and a map payload.

### GET /dashboard/recent-issues

Returns recent issue entries.

### GET /dashboard/hotspots

Returns hotspot entries.

### GET /dashboard/map

Returns map marker data.

## 6. Road detection endpoints

### POST /roads/detect

Uploads an image and starts detection.

**Request**

- `multipart/form-data`
- field name: `file`

**Successful response (processing)**

```json
{
  "jobId": "ai-abc123def456",
  "status": "processing"
}
```

**Successful response (complete)**

```json
{
  "jobId": "ai-abc123def456",
  "status": "complete",
  "label": "Pothole",
  "confidence": 0.9,
  "severity": "critical",
  "description": "Deep pothole detected with high confidence. Immediate repair recommended.",
  "bbox": null
}
```

**Validation**

- Missing or empty file returns `400` with `{"success": false, "error": "No image file provided"}`.
- Unsupported extensions return `400` with `{"success": false, "error": "Invalid file type"}`.

### GET /roads/detect/<jobId>

Polls the status of a detection job.

**Processing response**

```json
{
  "jobId": "ai-abc123def456",
  "status": "processing"
}
```

**Failed response**

```json
{
  "jobId": "ai-abc123def456",
  "status": "failed",
  "error": "Job not found"
}
```

## 7. Maps endpoints

### GET /maps/reverse-geocode

Reverse geocodes a latitude and longitude.

**Example**

```text
GET /maps/reverse-geocode?lat=28.6139&lng=77.209
```

**Validation**

- `lat` and `lng` are required.

### GET /maps/hospitals

Returns nearby hospitals for a location.

**Example**

```text
GET /maps/hospitals?lat=28.6139&lng=77.209&radius_km=5&limit=5
```

**Validation**

- `lat` and `lng` are required.

## 8. SOS endpoints

### POST /sos/activate

Starts the SOS workflow.

**Request body**

```json
{
  "location": {
    "lat": 28.6139,
    "lng": 77.209,
    "city": "New Delhi"
  },
  "emergency_contacts": [
    "+91-9876543210",
    "family@example.com"
  ],
  "user_id": "user-123",
  "note": "Vehicle hit a pothole and stopped unexpectedly.",
  "device_info": {
    "platform": "web",
    "browser": "Chrome"
  }
}
```

**Response example**

```json
{
  "status": "dispatched",
  "message": "Emergency protocol activated.",
  "detection": {
    "detected": true,
    "probability": 8,
    "threshold": 7
  },
  "alert": {
    "alert_id": "SOS-20260526120000",
    "status": "dispatched",
    "contacts_notified": 2
  },
  "log": {
    "saved": true,
    "path": "sos_logs.txt",
    "message": "Incident log saved successfully."
  },
  "location": {
    "lat": 28.6139,
    "lng": 77.209
  },
  "error": null
}
```

## 9. Frontend service compatibility

The frontend services are **not fully aligned** with the current backend. These are the current mismatches:

### Implemented backend routes

- `frontend/src/services/riskService.js` matches `/risk/*` and is currently aligned with the backend.
- `frontend/src/services/roadService.js` currently uses `/roads/detect` and `/roads/detect/<jobId>`, which are implemented.

### Not implemented in the current backend

- `frontend/src/services/roadService.js` also references issue-management endpoints that do not exist yet:
  - `/roads/issues`
  - `/roads/issues/<issueId>`
  - `/roads/issues/<issueId>/upvote`
  - `/roads/issues/<issueId>/status`
  - `/roads/hotspots`
- `frontend/src/services/sosService.js` references routes that are not implemented:
  - `/sos`
  - `/sos/nearby-hospitals`
  - `/sos/<alertId>/cancel`
  - `/sos/history`
- `frontend/src/services/mapsService.js` is currently empty, so there is no client wrapper for the map endpoints yet.

### What this means

- The backend currently supports **risk**, **dashboard**, **road detection**, **maps**, and **SOS activation** routes.
- The frontend still contains **additional service methods that assume routes that are not present**.
- The docs now reflect the current state instead of implying that those routes already exist.

## 10. Validation notes

- Image uploads must use supported extensions such as `jpg`, `jpeg`, `png`, `webp`, or `heic`.
- `/roads/detect` returns `processing` immediately while the job is being processed.
- `/risk/alerts` and `/risk/stream` are backed by in-memory state in the current backend.
- `/sos/activate` currently simulates emergency workflow behavior and writes a log file.
- `/health` returns a structured Firebase status object, not a simple string.

## 11. Example curl commands

### Check health

```bash
curl http://127.0.0.1:5000/health
```

### Get risk score

```bash
curl -X POST http://127.0.0.1:5000/risk/score \
  -H "Content-Type: application/json" \
  -d '{"lat":28.6139,"lng":77.209,"time":"evening","weather":"rain","road":"pothole","traffic":"heavy","zone":"NH-48 Ring Road"}'
```

### Upload a road image

```bash
curl -X POST http://127.0.0.1:5000/roads/detect \
  -F "file=@sample-image.png"
```

### Trigger SOS

```bash
curl -X POST http://127.0.0.1:5000/sos/activate \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo-user","emergency_contacts":["+91-9876543210"]}'
```
