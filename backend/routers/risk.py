import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Event

from flask import Flask, Response, jsonify, request

sys.path.append(str(Path(__file__).resolve().parents[1]))
from models.RiskModel import RakshaRiskModel

app = Flask(__name__)

risk_model = RakshaRiskModel()

RISK_ALERTS = []
PREFERENCES = {
    "minSeverity": "high",
    "zones": [],
    "pushEnabled": True,
    "smsEnabled": False,
}

BASE_HOURLY_DISTRIBUTION = [14, 8, 5, 4, 6, 10, 18, 32, 47, 38, 29, 24, 21, 19, 23, 28, 35, 41, 52, 61, 48, 37, 29, 20]
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _coerce_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_payload():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        payload = {}
    return payload


def _build_alert(zone, score, reason=None):
    alert = risk_model.build_alert(zone=zone, score=score, reason=reason)
    alert["id"] = f"risk-{int(time.time() * 1000)}"
    return alert


def _append_alert(zone, score, reason=None):
    alert = _build_alert(zone, score, reason)
    RISK_ALERTS.append(alert)
    if len(RISK_ALERTS) > 100:
        del RISK_ALERTS[:-100]
    return alert


def _default_zone_name(payload):
    if payload.get("zone"):
        return payload["zone"]
    if payload.get("lat") is not None and payload.get("lng") is not None:
        return f"Lat {payload['lat']}, Lng {payload['lng']}"
    return "Unknown Zone"


@app.route("/")
def home():
    return jsonify({
        "message": "Raksha AI Risk API Running",
        "version": "1.0",
    })


@app.route("/risk/score", methods=["POST"])
def risk_score():
    payload = _parse_payload()

    result = risk_model.build_response(
        lat=_coerce_float(payload.get("lat")),
        lng=_coerce_float(payload.get("lng")),
        time=payload.get("time"),
        weather=payload.get("weather"),
        road=payload.get("road"),
        traffic=payload.get("traffic"),
        zone=payload.get("zone"),
    )

    zone = _default_zone_name(payload)
    _append_alert(zone, result["score"], reason=f"Model score {result['score']} for {zone}")

    return jsonify(result)


@app.route("/risk/coordinate", methods=["GET"])
def risk_coordinate():
    lat = _coerce_float(request.args.get("lat"))
    lng = _coerce_float(request.args.get("lng"))

    if lat is None or lng is None:
        return jsonify({
            "success": False,
            "error": "lat and lng are required",
        }), 400

    result = risk_model.build_response(lat=lat, lng=lng)
    _append_alert(f"Lat {lat}, Lng {lng}", result["score"], reason="Coordinate risk check")

    return jsonify(result)


@app.route("/risk/alerts", methods=["GET"])
def risk_alerts():
    min_severity = request.args.get("min_severity")
    status = request.args.get("status", "active")
    limit = request.args.get("limit", default=20, type=int)

    alerts = list(RISK_ALERTS)

    if status:
        alerts = [alert for alert in alerts if alert.get("status") == status]

    if min_severity:
        alerts = [
            alert for alert in alerts
            if SEVERITY_ORDER.get(alert.get("severity", "low"), 3) <= SEVERITY_ORDER.get(min_severity, 3)
        ]

    alerts.sort(key=lambda item: SEVERITY_ORDER.get(item.get("severity", "low"), 3))
    return jsonify(alerts[:limit])


@app.route("/risk/stream")
def risk_stream():
    stop_event = Event()

    def event_stream():
        while not stop_event.is_set():
            if RISK_ALERTS:
                latest_alert = RISK_ALERTS[-1]
                payload = json.dumps(latest_alert)
                yield f"data: {payload}\n\n"
            else:
                yield "event: ping\ndata: {}\n\n"
            time.sleep(12)

    response = Response(event_stream(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response


@app.route("/risk/analytics/hourly", methods=["GET"])
def risk_analytics_hourly():
    zone = request.args.get("zone")
    payload = list(BASE_HOURLY_DISTRIBUTION)

    if zone:
        zone_value = (len(zone) % 24)
        payload[zone_value] = max(payload)

    return jsonify(payload)


@app.route("/risk/analytics/zones", methods=["GET"])
def risk_analytics_zones():
    limit = request.args.get("limit", default=20, type=int)
    days = request.args.get("days", default=30, type=int)

    ranked = []
    for index, alert in enumerate(RISK_ALERTS[:limit]):
        ranked.append({
            "zone": alert.get("zone", "Unknown Zone"),
            "lat": None,
            "lng": None,
            "score": alert.get("score", 0),
            "count": max(1, len(RISK_ALERTS) - index),
            "delta": min(30, (days % 10) + index),
        })

    if not ranked:
        ranked = [
            {
                "zone": f"Zone {index + 1}",
                "lat": None,
                "lng": None,
                "score": max(1, BASE_HOURLY_DISTRIBUTION[index % len(BASE_HOURLY_DISTRIBUTION)]),
                "count": 1,
                "delta": 0,
            }
            for index in range(min(limit, 5))
        ]

    return jsonify(ranked[:limit])


@app.route("/risk/route-profile", methods=["POST"])
def risk_route_profile():
    payload = _parse_payload()
    waypoints = payload.get("waypoints")

    if not isinstance(waypoints, list) or len(waypoints) < 2:
        return jsonify({
            "success": False,
            "error": "waypoints must be an array with at least 2 entries",
        }), 400

    route = risk_model.profile_route(
        waypoints,
        time=payload.get("time"),
        weather=payload.get("weather"),
        traffic=payload.get("traffic"),
        road=payload.get("road"),
    )

    return jsonify(route)


@app.route("/risk/preferences", methods=["GET", "PUT"])
def risk_preferences():
    if request.method == "GET":
        return jsonify(PREFERENCES)

    payload = _parse_payload()
    PREFERENCES.update(payload)
    return jsonify(PREFERENCES)


if __name__ == "__main__":
    app.run(debug=True)
