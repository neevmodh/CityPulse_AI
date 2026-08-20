"use client";

import { useEffect, useRef } from "react";

interface HeatCell {
  latitude: number;
  longitude: number;
  intensity: number;
  value: number;
  issue_count?: number;
  avg_risk_score?: number;
}

interface HeatMapProps {
  cells: HeatCell[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  kind?: "risk" | "complaints";
}

function loadLeafletCSS() {
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
}

const GRADIENT_RISK       = { 0.1: "#2563eb", 0.3: "#22c55e", 0.55: "#eab308", 0.75: "#f97316", 1.0: "#dc2626" };
const GRADIENT_COMPLAINTS = { 0.1: "#7c3aed", 0.35: "#2563eb", 0.6: "#0ea5e9", 0.8: "#f97316", 1.0: "#dc2626" };

export default function HeatMap({
  cells, height = "420px",
  center = [23.0225, 72.5714], zoom = 12,
  kind = "risk",
}: HeatMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const legendRef    = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    loadLeafletCSS();
    let cancelled = false;

    Promise.all([import("leaflet"), import("leaflet.heat")]).then(([leafletModule]) => {
      if (cancelled || !mapRef.current) return;
      const L = leafletModule.default ?? leafletModule;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(center, zoom);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 })
          .addTo(mapInstance.current);
        L.control.attribution({ prefix: false })
          .addAttribution('© <a href="https://carto.com/">CARTO</a>')
          .addTo(mapInstance.current);
        L.control.zoom({ position: "bottomright" }).addTo(mapInstance.current);
      }

      if (heatLayerRef.current) {
        heatLayerRef.current.remove();
        heatLayerRef.current = null;
      }

      if (cells.length === 0) return;

      const points = cells
        .filter(c => !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude)))
        .map(c => [Number(c.latitude), Number(c.longitude), Math.max(0.05, Math.min(1, c.intensity))]);

      const gradient = kind === "complaints" ? GRADIENT_COMPLAINTS : GRADIENT_RISK;

      heatLayerRef.current = (L as any).heatLayer(points, {
        radius:   30,
        blur:     22,
        maxZoom:  16,
        max:      1,
        gradient,
      }).addTo(mapInstance.current);
    });

    return () => { cancelled = true; };
  }, [cells, kind]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  return (
    <div style={{ position: "relative", height }}>
      <div ref={mapRef} style={{ height }} className="w-full z-0" />

      {/* Legend overlay */}
      <div style={{
        position: "absolute", bottom: 24, left: 12, zIndex: 500,
        background: "rgba(0,0,0,0.72)", borderRadius: 10, padding: "8px 12px",
        backdropFilter: "blur(8px)",
      }}>
        <p style={{ fontSize: 10, color: "#aaa", marginBottom: 5, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
          {kind === "risk" ? "Risk Score" : "Complaint Density"}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="heatmap-legend" style={{
            width: 110, height: 8, borderRadius: 4,
            background: kind === "complaints"
              ? "linear-gradient(90deg, #7c3aed, #2563eb, #0ea5e9, #f97316, #dc2626)"
              : "linear-gradient(90deg, #2563eb, #22c55e, #eab308, #f97316, #dc2626)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 9, color: "#888" }}>Low</span>
          <span style={{ fontSize: 9, color: "#888" }}>High</span>
        </div>
        <p style={{ fontSize: 9, color: "#666", marginTop: 4 }}>{cells.length} grid cells · {cells.reduce((s, c) => s + (c.issue_count ?? 1), 0)} issues</p>
      </div>
    </div>
  );
}
