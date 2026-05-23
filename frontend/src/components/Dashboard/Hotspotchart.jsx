import { useState, useRef, useEffect } from "react";

/**
 * HotspotChart — Accident hotspot visualization for Raksha AI Dashboard
 *
 * Renders two views:
 *   1. Zone Chart  — horizontal bar chart of top accident-prone zones
 *   2. Time Chart  — 24-hour radial/arc distribution of accidents by hour
 *
 * Props:
 *   zones   {Array}   Zone data  — [{ name, count, delta, lat, lng }]
 *   hourly  {Array}   24 numbers — accident count per hour (index 0 = midnight)
 *   title   {string}  Card title override
 *   onZoneClick {fn}  Called with zone object when a bar is clicked
 *
 * Default demo data is provided so the component is self-contained.
 */

// ── Demo data ────────────────────────────────────────────────────────────────
const DEFAULT_ZONES = [
  { name: "NH-48 Ring Road",      count: 142, delta: +18, lat: 28.6284, lng: 77.2194 },
  { name: "Mathura Road Flyover", count: 118, delta: -6,  lat: 28.5928, lng: 77.2475 },
  { name: "Outer Ring Road N",    count: 97,  delta: +31, lat: 28.7041, lng: 77.1025 },
  { name: "DND Flyway",           count: 83,  delta: +4,  lat: 28.5621, lng: 77.3089 },
  { name: "Mehrauli-Gurgaon Rd",  count: 71,  delta: -12, lat: 28.5065, lng: 77.1890 },
  { name: "GT Karnal Road",       count: 64,  delta: +9,  lat: 28.7573, lng: 77.1273 },
  { name: "Rohtak Road NH-9",     count: 52,  delta: -3,  lat: 28.6647, lng: 77.0508 },
];

const DEFAULT_HOURLY = [
  14, 8, 5, 4, 6, 10, 18, 32,   // 00–07
  47, 38, 29, 24, 21, 19, 23, 28, // 08–15
  35, 41, 52, 61, 48, 37, 29, 20, // 16–23
];

// ── Utility helpers ──────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const from = 0;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value]);
  return display;
}

// ── Zone bar chart ───────────────────────────────────────────────────────────
function ZoneChart({ zones, onZoneClick }) {
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);
  const inView = useInView(ref);
  const max = Math.max(...zones.map(z => z.count));

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {zones.map((zone, i) => {
        const pct = (zone.count / max) * 100;
        const isHot = hovered === i;
        const delay = `${i * 60}ms`;
        const risk = pct > 80 ? "critical" : pct > 55 ? "high" : pct > 35 ? "medium" : "low";
        const riskColors = {
          critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#6b7280"
        };
        const color = riskColors[risk];

        return (
          <div
            key={zone.name}
            onClick={() => onZoneClick?.(zone)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: "pointer",
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${isHot ? color + "40" : "rgba(255,255,255,0.04)"}`,
              background: isHot ? color + "0a" : "rgba(255,255,255,0.02)",
              transition: "all 0.18s",
              animationDelay: delay,
            }}
          >
            {/* Label row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 7,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Risk dot */}
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: color,
                  boxShadow: isHot ? `0 0 8px ${color}` : "none",
                  flexShrink: 0,
                  transition: "box-shadow 0.18s",
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: isHot ? "#f1f5f9" : "rgba(255,255,255,0.6)",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.2px",
                  transition: "color 0.18s",
                }}>
                  {zone.name}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Delta badge */}
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 4,
                  background: zone.delta > 0 ? "rgba(220,38,38,0.12)" : "rgba(34,197,94,0.1)",
                  border: `1px solid ${zone.delta > 0 ? "rgba(220,38,38,0.25)" : "rgba(34,197,94,0.2)"}`,
                  color: zone.delta > 0 ? "#f87171" : "#4ade80",
                }}>
                  {zone.delta > 0 ? "▲" : "▼"} {Math.abs(zone.delta)}%
                </span>
                {/* Count */}
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isHot ? color : "rgba(255,255,255,0.75)",
                  fontFamily: "'Bebas Neue', cursive",
                  letterSpacing: "1px",
                  transition: "color 0.18s",
                }}>
                  {zone.count}
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div style={{
              height: 4, borderRadius: 2,
              background: "rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: inView ? `${pct}%` : "0%",
                borderRadius: 2,
                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                boxShadow: isHot ? `0 0 8px ${color}80` : "none",
                transition: `width 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}, box-shadow 0.18s`,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 24-hour radial chart ─────────────────────────────────────────────────────
function TimeRadialChart({ hourly }) {
  const [hoveredHour, setHoveredHour] = useState(null);
  const ref = useRef(null);
  const inView = useInView(ref);
  const max = Math.max(...hourly);

  const W = 280, H = 280, CX = 140, CY = 140;
  const R_INNER = 58, R_OUTER = 118;
  const TOTAL = 24;

  function polarToXY(angle, r) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }

  function buildArc(hour, fraction) {
    const segDeg = 360 / TOTAL;
    const gap = 1.8;
    const startDeg = hour * segDeg + gap / 2;
    const endDeg = startDeg + segDeg - gap;
    const rOuter = R_INNER + (R_OUTER - R_INNER) * fraction;

    const s1 = polarToXY(startDeg, R_INNER);
    const e1 = polarToXY(endDeg,   R_INNER);
    const s2 = polarToXY(startDeg, rOuter);
    const e2 = polarToXY(endDeg,   rOuter);
    const large = endDeg - startDeg > 180 ? 1 : 0;

    return [
      `M ${s1.x} ${s1.y}`,
      `A ${R_INNER} ${R_INNER} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${e2.x} ${e2.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 0 ${s2.x} ${s2.y}`,
      "Z",
    ].join(" ");
  }

  // Hour labels (every 3 hours)
  const hourLabels = [0, 3, 6, 9, 12, 15, 18, 21].map(h => {
    const deg = h * (360 / 24) - 90;
    const rad = deg * Math.PI / 180;
    const r = R_OUTER + 18;
    return {
      h, label: h === 0 ? "12A" : h < 12 ? `${h}A` : h === 12 ? "12P" : `${h - 12}P`,
      x: CX + r * Math.cos(rad),
      y: CY + r * Math.sin(rad),
    };
  });

  const hoveredPos = hoveredHour != null
    ? polarToXY(hoveredHour * (360 / 24) - 90 + (360 / 24) / 2, R_OUTER + 10)
    : null;

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <svg
        width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: "visible" }}
      >
        {/* Concentric guide rings */}
        {[R_INNER, (R_INNER + R_OUTER) / 2, R_OUTER].map(r => (
          <circle key={r} cx={CX} cy={CY} r={r}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}

        {/* Radial divider lines */}
        {Array.from({ length: 24 }).map((_, i) => {
          const deg = i * 15 - 90;
          const rad = deg * Math.PI / 180;
          return (
            <line key={i}
              x1={CX + R_INNER * Math.cos(rad)} y1={CY + R_INNER * Math.sin(rad)}
              x2={CX + R_OUTER * Math.cos(rad)} y2={CY + R_OUTER * Math.sin(rad)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          );
        })}

        {/* Arc segments */}
        {hourly.map((count, h) => {
          const fraction = count / max;
          const isHot = h === hoveredHour;
          const isNight = h < 6 || h >= 22;
          const isPeak  = h >= 7 && h <= 9 || h >= 17 && h <= 20;
          const color = fraction > 0.8 ? "#dc2626"
            : fraction > 0.55 ? "#f97316"
            : fraction > 0.3  ? "#eab308"
            : isNight ? "#3b82f6" : "#4b5563";

          return (
            <path
              key={h}
              d={buildArc(h, inView ? fraction : 0.01)}
              fill={color}
              fillOpacity={isHot ? 1 : 0.7}
              style={{
                transition: `d 0.6s cubic-bezier(0.16,1,0.3,1) ${h * 18}ms, fill-opacity 0.15s`,
                cursor: "pointer",
                filter: isHot ? `drop-shadow(0 0 6px ${color})` : "none",
              }}
              onMouseEnter={() => setHoveredHour(h)}
              onMouseLeave={() => setHoveredHour(null)}
            />
          );
        })}

        {/* Centre text */}
        <text x={CX} y={CY - 10} textAnchor="middle"
          fill="rgba(255,255,255,0.8)" fontSize="22"
          fontFamily="'Bebas Neue', cursive" letterSpacing="2">
          {hoveredHour != null ? hourly[hoveredHour] : hourly.reduce((a, b) => a + b, 0)}
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize="9"
          fontFamily="'DM Mono', monospace" letterSpacing="1.5">
          {hoveredHour != null
            ? `${hoveredHour}:00 – ${hoveredHour + 1}:00`
            : "TOTAL / 24H"}
        </text>

        {/* Hour labels */}
        {hourLabels.map(({ h, label, x, y }) => (
          <text key={h} x={x} y={y + 4} textAnchor="middle"
            fill="rgba(255,255,255,0.25)" fontSize="8"
            fontFamily="'DM Mono', monospace">
            {label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {[
          { color: "#dc2626", label: "Critical" },
          { color: "#f97316", label: "High" },
          { color: "#eab308", label: "Medium" },
          { color: "#3b82f6", label: "Night" },
        ].map(({ color, label }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 10, color: "rgba(255,255,255,0.35)",
            fontFamily: "'DM Mono', monospace",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2,
              background: color, flexShrink: 0,
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main HotspotChart ────────────────────────────────────────────────────────
export default function HotspotChart({
  zones   = DEFAULT_ZONES,
  hourly  = DEFAULT_HOURLY,
  title   = "Accident Hotspots",
  onZoneClick,
}) {
  const [view, setView] = useState("zones"); // "zones" | "time"
  const rootRef = useRef(null);
  const inView = useInView(rootRef);

  const totalAccidents  = zones.reduce((s, z) => s + z.count, 0);
  const peakHour        = hourly.indexOf(Math.max(...hourly));
  const peakLabel       = peakHour < 12 ? `${peakHour}:00 AM` : `${peakHour - 12 || 12}:00 PM`;
  const trending        = zones.filter(z => z.delta > 0).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

        .hc-root {
          background: #080c14;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          position: relative;
        }

        /* Top noise grain */
        .hc-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          border-radius: 16px;
        }

        .hc-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .hc-title {
          font-family: 'Bebas Neue', cursive;
          font-size: 20px;
          letter-spacing: 2.5px;
          color: #f1f5f9;
          line-height: 1;
        }

        .hc-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 4px;
          letter-spacing: 0.3px;
          font-family: 'DM Mono', monospace;
        }

        .hc-tabs {
          display: flex;
          gap: 2px;
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 3px;
          flex-shrink: 0;
        }

        .hc-tab {
          padding: 5px 12px;
          border-radius: 6px;
          border: none;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }

        .hc-tab.active {
          background: rgba(220,38,38,0.18);
          color: #f87171;
          border: 1px solid rgba(220,38,38,0.3);
        }

        .hc-tab.inactive {
          background: transparent;
          color: rgba(255,255,255,0.35);
        }
        .hc-tab.inactive:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.65);
        }

        /* KPI row */
        .hc-kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative;
          z-index: 1;
        }

        .hc-kpi {
          padding: 12px 16px;
          background: #080c14;
        }

        .hc-kpi-label {
          font-size: 9px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin-bottom: 5px;
        }

        .hc-kpi-value {
          font-family: 'Bebas Neue', cursive;
          font-size: 26px;
          letter-spacing: 1px;
          line-height: 1;
          color: #f1f5f9;
        }

        .hc-kpi-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          margin-top: 2px;
          font-family: 'DM Mono', monospace;
        }

        .hc-body {
          padding: 18px 20px 20px;
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="hc-root" ref={rootRef}>

        {/* Header */}
        <div className="hc-header">
          <div>
            <div className="hc-title">{title}</div>
            <div className="hc-subtitle">Last 30 days · Auto-refreshed</div>
          </div>
          <div className="hc-tabs">
            {[
              { key: "zones", label: "Zones" },
              { key: "time",  label: "24H" },
            ].map(t => (
              <button
                key={t.key}
                className={`hc-tab ${view === t.key ? "active" : "inactive"}`}
                onClick={() => setView(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div className="hc-kpis">
          <div className="hc-kpi">
            <div className="hc-kpi-label">Total Incidents</div>
            <div className="hc-kpi-value">
              {inView ? <Counter value={totalAccidents} /> : 0}
            </div>
            <div className="hc-kpi-sub">past 30 days</div>
          </div>
          <div className="hc-kpi">
            <div className="hc-kpi-label">Peak Hour</div>
            <div className="hc-kpi-value" style={{ fontSize: 18, paddingTop: 4 }}>
              {peakLabel}
            </div>
            <div className="hc-kpi-sub">{hourly[peakHour]} incidents</div>
          </div>
          <div className="hc-kpi">
            <div className="hc-kpi-label">Trending ↑</div>
            <div className="hc-kpi-value" style={{ color: trending > 0 ? "#f87171" : "#4ade80" }}>
              {inView ? <Counter value={trending} /> : 0}
            </div>
            <div className="hc-kpi-sub">zones rising</div>
          </div>
        </div>

        {/* Chart body */}
        <div className="hc-body">
          {view === "zones"
            ? <ZoneChart zones={zones} onZoneClick={onZoneClick} />
            : <TimeRadialChart hourly={hourly} />
          }
        </div>
      </div>
    </>
  );
}
