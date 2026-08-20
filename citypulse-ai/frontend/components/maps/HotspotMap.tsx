"use client";

import { useEffect, useRef } from "react";
import type { Hotspot } from "@/types";

interface HotspotMapProps {
  hotspots: Hotspot[];
  height?: string;
  center?: [number, number];
  zoom?: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
};

const TREND_EMOJI: Record<string, string> = {
  rising:    "📈",
  declining: "📉",
  stable:    "➡️",
  critical:  "🔥",
};

function loadLeafletCSS() {
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
}

// Inject pulse keyframe once into document head
function injectPulseKeyframe() {
  if (document.getElementById("hotspot-pulse-style")) return;
  const style = document.createElement("style");
  style.id = "hotspot-pulse-style";
  style.textContent = `
    @keyframes hotspot-pulse {
      0%   { transform: scale(1);   opacity: 0.9; }
      60%  { transform: scale(1.5); opacity: 0.4; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    .hs-pulse-ring {
      animation: hotspot-pulse 2s cubic-bezier(0,0,0.2,1) infinite;
      position: absolute; inset: 0; border-radius: 50%;
    }
  `;
  document.head.appendChild(style);
}

export default function HotspotMap({
  hotspots, height = "500px",
  center = [23.0225, 72.5714], zoom = 12,
}: HotspotMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const layersRef   = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    loadLeafletCSS();
    injectPulseKeyframe();

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: false,
        }).setView(center, zoom);

        // CARTO light tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 })
          .addTo(mapInstance.current);
        L.control.attribution({ prefix: false })
          .addAttribution('© <a href="https://carto.com/">CARTO</a>')
          .addTo(mapInstance.current);
        L.control.zoom({ position: "bottomright" }).addTo(mapInstance.current);
      }

      // Clear old layers
      layersRef.current.forEach(l => l.remove());
      layersRef.current = [];

      hotspots.forEach((hs) => {
        const lat    = Number(hs.latitude);
        const lng    = Number(hs.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const color  = SEVERITY_COLOR[hs.severity] ?? "#eab308";
        const radius = Number(hs.radius_meters) || 250;
        const trend  = TREND_EMOJI[hs.trend ?? "stable"] ?? "➡️";

        // Outer pulsing zone circle
        const zone = L.circle([lat, lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "6 4",
        }).addTo(mapInstance.current);

        // Inner solid fill circle
        const inner = L.circle([lat, lng], {
          radius: radius * 0.3,
          color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 0,
        }).addTo(mapInstance.current);

        // Center pulse marker
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:24px;height:24px;">
              <div class="hs-pulse-ring" style="background:${color};"></div>
              <div style="
                position:absolute;inset:0;width:24px;height:24px;border-radius:50%;
                background:${color};border:3px solid white;
                box-shadow:0 2px 12px ${color}88;
                display:flex;align-items:center;justify-content:center;
              "></div>
            </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(mapInstance.current);
        marker.bindPopup(`
          <div style="min-width:220px;font-family:'Inter',sans-serif;padding:0;">
            <div style="background:${color}18;padding:10px 12px;border-bottom:1px solid ${color}30;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;"></span>
                <span style="font-size:11px;color:#999;text-transform:uppercase;font-weight:600;">${hs.severity} severity</span>
              </div>
              <strong style="font-size:14px;color:#111;">${hs.name ?? `Hotspot · ${hs.ward}`}</strong>
            </div>
            <div style="padding:10px 12px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <div style="background:#f9fafb;border-radius:8px;padding:8px;text-align:center;">
                  <div style="font-size:18px;font-weight:700;color:#111;">${hs.issue_count}</div>
                  <div style="font-size:10px;color:#999;">Issues</div>
                </div>
                <div style="background:#f9fafb;border-radius:8px;padding:8px;text-align:center;">
                  <div style="font-size:18px;font-weight:700;color:${color};">${hs.avg_risk_score}</div>
                  <div style="font-size:10px;color:#999;">Avg Risk</div>
                </div>
              </div>
              <div style="font-size:11px;color:#666;margin-bottom:6px;">
                ${trend} Trend: <strong>${hs.trend ?? "stable"}</strong>
                &nbsp;·&nbsp; ${(hs.dominant_category ?? "").replace(/_/g," ")}
              </div>
              ${hs.prediction ? `<div style="font-size:11px;color:#555;background:#f0fdf4;border-radius:6px;padding:6px 8px;border-left:3px solid ${color};">${hs.prediction}</div>` : ""}
            </div>
          </div>
        `, { maxWidth: 260 });

        layersRef.current.push(zone, inner, marker);
      });
    });
  }, [hotspots, center, zoom]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  return <div ref={mapRef} style={{ height }} className="w-full z-0" />;
}
