import { useState } from "react";
import clsx from "clsx";
import { MapPin } from "lucide-react";
import PickupMapPicker, { type LatLng } from "./PickupMapPicker";
import { Input } from "../ui";
import type { PickupSuggestion } from "../../lib/api";

export interface PointValue {
  label: string;
  location: LatLng | null;
}

export const emptyPoint: PointValue = { label: "", location: null };

interface PointFieldProps {
  title: string;
  value: PointValue;
  onChange: (v: PointValue) => void;
  suggestions?: PickupSuggestion[];
}

function PointField({ title, value, onChange, suggestions }: PointFieldProps) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <Input
          label={title}
          placeholder="e.g. Mirpur 10 main road"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          icon={<MapPin size={16} />}
        />
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className={clsx(
            "h-[52px] px-4 rounded-2xl text-xs font-semibold whitespace-nowrap border shrink-0",
            value.location ? "bg-primary-light border-primary text-primary-dark" : "bg-white border-border text-text-muted",
          )}
        >
          {value.location ? "Pinned" : "Map"}
        </button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.pickupPoint}
              type="button"
              onClick={() =>
                onChange({
                  label: s.pickupPoint,
                  location: s.lat !== null && s.lng !== null ? { lat: s.lat, lng: s.lng } : null,
                })
              }
              className="bg-primary-light text-primary-dark rounded-full px-2.5 py-1 text-[11px] font-semibold"
            >
              📍 {s.pickupPoint} ({s.count}×)
            </button>
          ))}
        </div>
      )}
      {showMap && <PickupMapPicker value={value.location} onChange={(loc) => onChange({ ...value, location: loc })} />}
    </div>
  );
}

interface Props {
  pickup: PointValue;
  onPickupChange: (v: PointValue) => void;
  dropoff: PointValue;
  onDropoffChange: (v: PointValue) => void;
  pickupSuggestions?: PickupSuggestion[];
}

export default function PickupDropoffPicker({ pickup, onPickupChange, dropoff, onDropoffChange, pickupSuggestions }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <PointField title="Pickup point" value={pickup} onChange={onPickupChange} suggestions={pickupSuggestions} />
      <PointField title="Drop-off point" value={dropoff} onChange={onDropoffChange} />
    </div>
  );
}
