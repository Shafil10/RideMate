import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "./PickupMapPicker";

const originIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#dc2626;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:rotate(-45deg);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];

function FitToPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

interface Props {
  origin: LatLng | null;
  destination: LatLng | null;
  height?: number;
}

// A read-only route preview — not a picker. Shows the origin/destination pins the
// passenger just entered and highlights the straight-line route between them (the
// same line matchToRoute tests candidates against), Google-Maps-style: a dark
// casing line with a white line on top.
export default function RouteMapPreview({ origin, destination, height = 180 }: Props) {
  const points: [number, number][] = [];
  if (origin) points.push([origin.lat, origin.lng]);
  if (destination) points.push([destination.lat, destination.lng]);

  if (points.length === 0) return null;

  return (
    // position+z-index pinned explicitly so this never outranks an address
    // dropdown above it — Leaflet's tiles use CSS transforms, which create their
    // own stacking context that would otherwise paint over later-DOM siblings.
    <div style={{ position: "relative", zIndex: 0, height, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
      <MapContainer
        center={points[0] ?? DHAKA_CENTER}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {origin && destination && (
          <>
            <Polyline positions={[[origin.lat, origin.lng], [destination.lat, destination.lng]]} pathOptions={{ color: "#0f172a", weight: 7, opacity: 0.9 }} />
            <Polyline positions={[[origin.lat, origin.lng], [destination.lat, destination.lng]]} pathOptions={{ color: "#ffffff", weight: 3.5, opacity: 1 }} />
          </>
        )}
        {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
        <FitToPoints points={points} />
      </MapContainer>
    </div>
  );
}
