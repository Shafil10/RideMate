import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Geolocation } from "@capacitor/geolocation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#16a34a;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:rotate(-45deg);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];

export interface LatLng {
  lat: number;
  lng: number;
}

function ClickHandler({ onPick }: { onPick: (loc: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterOnChange({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1]]);
  return null;
}

interface Props {
  value: LatLng | null;
  onChange: (loc: LatLng) => void;
}

export default function PickupMapPicker({ value, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  async function useMyLocation() {
    setLocating(true);
    setLocateError(null);
    try {
      // Uses native GPS when running as a packaged app (Capacitor), and
      // transparently falls back to the browser Geolocation API on the web.
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
      onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setLocateError("Couldn't get your location — tap the map instead.");
    } finally {
      setLocating(false);
    }
  }

  const center: [number, number] = value ? [value.lat, value.lng] : DHAKA_CENTER;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: "#555" }}>
          {value ? `Pin set at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : "Tap the map to drop a pin, or use your location"}
        </span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          aria-label="Use my current location"
          style={{
            background: "#eef2f0",
            border: "1px solid #d1d5db",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: locating ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {locating ? "Locating..." : "📍 Use my location"}
        </button>
      </div>
      {locateError && <div style={{ color: "#991b1b", fontSize: 12, marginBottom: 6 }}>{locateError}</div>}
      <div style={{ height: 240, borderRadius: 12, overflow: "hidden", border: "1px solid #d1d5db" }}>
        <MapContainer center={center} zoom={value ? 15 : 12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <RecenterOnChange center={value ? [value.lat, value.lng] : null} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>
      </div>
    </div>
  );
}
