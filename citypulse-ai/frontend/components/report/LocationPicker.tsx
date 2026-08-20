"use client";

import { useEffect, useState } from "react";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface LocationPickerProps {
  onLocationSelected: (lat: number, lng: number, ward?: string) => void;
  defaultLat?: number;
  defaultLng?: number;
}

// Ahmedabad ward bounding boxes for auto-detection
const WARD_BOUNDS = [
  { id: "w01", name: "Sector 7 - Chandkheda", minLat: 23.09, maxLat: 23.13, minLng: 72.57, maxLng: 72.60 },
  { id: "w02", name: "Maninagar",              minLat: 22.98, maxLat: 23.01, minLng: 72.60, maxLng: 72.64 },
  { id: "w03", name: "Satellite",              minLat: 23.02, maxLat: 23.05, minLng: 72.49, maxLng: 72.53 },
  { id: "w04", name: "Navrangpura",            minLat: 23.03, maxLat: 23.05, minLng: 72.54, maxLng: 72.57 },
  { id: "w05", name: "Gota",                   minLat: 23.11, maxLat: 23.13, minLng: 72.54, maxLng: 72.57 },
  { id: "w06", name: "Bopal",                  minLat: 23.02, maxLat: 23.05, minLng: 72.45, maxLng: 72.49 },
  { id: "w07", name: "Vatva GIDC",             minLat: 22.95, maxLat: 22.97, minLng: 72.63, maxLng: 72.67 },
  { id: "w08", name: "Vastral",                minLat: 23.01, maxLat: 23.04, minLng: 72.65, maxLng: 72.68 },
  { id: "w09", name: "Nikol",                  minLat: 23.03, maxLat: 23.06, minLng: 72.62, maxLng: 72.65 },
  { id: "w10", name: "Naranpura",              minLat: 23.06, maxLat: 23.08, minLng: 72.55, maxLng: 72.58 },
];

function detectWard(lat: number, lng: number): string {
  const ward = WARD_BOUNDS.find(
    (w) => lat >= w.minLat && lat <= w.maxLat && lng >= w.minLng && lng <= w.maxLng
  );
  return ward?.id ?? "w01";
}

export default function LocationPicker({ onLocationSelected, defaultLat, defaultLng }: LocationPickerProps) {
  const [lat, setLat]         = useState<string>(defaultLat?.toString() ?? "");
  const [lng, setLng]         = useState<string>(defaultLng?.toString() ?? "");
  const [detecting, setDetecting] = useState(false);
  const [ward, setWard]       = useState<string>("");

  useEffect(() => {
    if (defaultLat && defaultLng) {
      const w = detectWard(defaultLat, defaultLng);
      setWard(w);
    }
  }, [defaultLat, defaultLng]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        const detectedWard = detectWard(latitude, longitude);
        setWard(detectedWard);
        onLocationSelected(latitude, longitude, detectedWard);
        setDetecting(false);
        toast.success("Location detected!");
      },
      (err) => {
        setDetecting(false);
        toast.error("Could not detect location. Enter manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManual = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Enter valid latitude and longitude.");
      return;
    }
    const detectedWard = detectWard(latNum, lngNum);
    setWard(detectedWard);
    onLocationSelected(latNum, lngNum, detectedWard);
    toast.success("Location set.");
  };

  const wardLabel = WARD_BOUNDS.find((w) => w.id === ward)?.name ?? "";

  return (
    <div className="space-y-3">
      {/* Auto-detect button */}
      <button
        type="button"
        onClick={detectLocation}
        disabled={detecting}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-300 hover:border-green-400 hover:bg-green-50 rounded-xl py-3 text-sm font-medium text-green-700 transition-all"
      >
        {detecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Crosshair className="w-4 h-4" />
        )}
        {detecting ? "Detecting location…" : "Use My Current Location"}
      </button>

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-gray-100" />
        <span className="px-2 text-xs text-gray-400">or enter manually</span>
        <div className="flex-1 border-t border-gray-100" />
      </div>

      {/* Manual inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="23.0760"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="72.5650"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleManual}
        className="w-full py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
      >
        Set Location
      </button>

      {/* Ward display */}
      {ward && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Detected ward: <strong>{wardLabel}</strong></span>
        </div>
      )}
    </div>
  );
}
