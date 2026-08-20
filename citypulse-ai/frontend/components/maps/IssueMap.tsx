"use client";

import { useEffect, useRef } from "react";
import type { Issue } from "@/types";

interface IssueMapProps {
  issues: Partial<Issue>[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (issue: Partial<Issue>) => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
  P1:       "#ef4444",
  P2:       "#f97316",
  P3:       "#eab308",
  P4:       "#22c55e",
};

const STATUS_ICON: Record<string, string> = {
  resolved:    "✓",
  in_progress: "◐",
  assigned:    "⊙",
  open:        "!",
  ai_analyzed: "✦",
};

function loadLeafletCSS() {
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
}

export default function IssueMap({
  issues, height = "400px",
  center = [23.0225, 72.5714],
  zoom = 12,
  onMarkerClick,
}: IssueMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);
  const markerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    loadLeafletCSS();

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: false,
        }).setView(center, zoom);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
        }).addTo(mapInstance.current);

        L.control.attribution({ prefix: false })
          .addAttribution('© <a href="https://carto.com/">CARTO</a>')
          .addTo(mapInstance.current);
        L.control.zoom({ position: "bottomright" }).addTo(mapInstance.current);
      }

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const validIssues = issues.filter(i => {
        const lat = Number(i.latitude);
        const lng = Number(i.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });

      validIssues.forEach((issue) => {
        const lat   = Number(issue.latitude);
        const lng   = Number(issue.longitude);
        const priorityKey = String(issue.priority ?? "low");
        const color = PRIORITY_COLOR[priorityKey] ?? "#22c55e";
        const isPulse = priorityKey === "critical" || priorityKey === "P1";
        const statusIcon = STATUS_ICON[issue.status ?? ""] ?? "";

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:20px;height:20px;">
              ${isPulse ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;" class="live-ping"></div>` : ""}
              <div style="
                position:absolute;inset:0;
                width:20px;height:20px;border-radius:50%;
                background:${color};border:2.5px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,0.25);
                display:flex;align-items:center;justify-content:center;
                font-size:9px;color:white;font-weight:700;
              ">${statusIcon}</div>
            </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(mapInstance.current);
        marker.bindPopup(`
          <div style="min-width:200px;font-family:'Inter',sans-serif;padding:0;">
            <div style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};"></span>
                <span style="font-size:10px;color:#999;font-family:monospace;">${issue.issue_code ?? issue.id ?? ""}</span>
              </div>
              <strong style="font-size:13px;color:#111;display:block;line-height:1.3;">${issue.title ?? (issue.category ?? "Issue").replace(/_/g, " ")}</strong>
            </div>
            <div style="padding:8px 12px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <div style="font-size:11px;">
                <div style="color:#999;margin-bottom:1px;">Priority</div>
                <div style="font-weight:700;color:${color};">${(issue.priority ?? "").toUpperCase()}</div>
              </div>
              <div style="font-size:11px;">
                <div style="color:#999;margin-bottom:1px;">Risk Score</div>
                <div style="font-weight:700;color:#111;">${issue.risk_score ?? "—"}</div>
              </div>
              <div style="font-size:11px;">
                <div style="color:#999;margin-bottom:1px;">Ward</div>
                <div style="font-weight:600;color:#333;">${issue.ward ?? issue.ward_id ?? "—"}</div>
              </div>
              <div style="font-size:11px;">
                <div style="color:#999;margin-bottom:1px;">Status</div>
                <div style="font-weight:600;color:#333;text-transform:capitalize;">${(issue.status ?? "").replace(/_/g, " ")}</div>
              </div>
            </div>
          </div>
        `, { maxWidth: 240 });

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(issue));
        }
        markersRef.current.push(marker);
      });
    });

    return () => {};
  }, [issues]);

  // Update center/zoom if changed
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  return (
    <div ref={mapRef} style={{ height }} className="w-full z-0" />
  );
}
