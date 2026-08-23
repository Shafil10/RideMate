import { useState } from "react";
import { Button, Input } from "../ui";
import AddressAutocomplete from "./AddressAutocomplete";
import PickupDropoffPicker, { emptyPoint, type PointValue } from "./PickupDropoffPicker";
import { createRideRequest, type RideRequest } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface Props {
  onCreated: (request: RideRequest) => void;
  onCancel: () => void;
}

export default function RequestRideForm({ onCreated, onCancel }: Props) {
  const { user, token } = useAuth();
  const [origin, setOrigin] = useState<PointValue>(emptyPoint);
  const [destination, setDestination] = useState<PointValue>(emptyPoint);
  const [desiredTime, setDesiredTime] = useState("");
  const [pickup, setPickup] = useState<PointValue>(emptyPoint);
  const [dropoff, setDropoff] = useState<PointValue>(emptyPoint);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !user) return;
    if (!origin.label.trim() || !destination.label.trim() || !desiredTime || !pickup.label.trim() || !dropoff.label.trim()) {
      setError("Fill in origin, destination, time, and your pickup/drop-off points.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { request } = await createRideRequest(
        {
          origin: origin.label,
          originLat: origin.location?.lat ?? null,
          originLng: origin.location?.lng ?? null,
          destination: destination.label,
          destLat: destination.location?.lat ?? null,
          destLng: destination.location?.lng ?? null,
          university: user.university,
          desiredTime,
          pickupPoint: pickup.label,
          pickupLat: pickup.location?.lat ?? null,
          pickupLng: pickup.location?.lng ?? null,
          dropoffPoint: dropoff.label,
          dropoffLat: dropoff.location?.lat ?? null,
          dropoffLng: dropoff.location?.lng ?? null,
        },
        token,
      );
      onCreated(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-text-muted -mt-1">
        No one's offering your route right now? Post a request — other students can pool onto it, and a
        student-driver can pick it up.
      </p>

      {error && <div className="bg-danger-light text-danger rounded-2xl px-4 py-3 text-sm font-medium">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">Origin</span>
        <AddressAutocomplete
          placeholder="Start typing an address"
          value={origin.label}
          onChange={(text) => setOrigin((o) => ({ ...o, label: text }))}
          onSelectLocation={(loc) => setOrigin({ label: loc.label, location: { lat: loc.lat, lng: loc.lng } })}
          style={inputStyle}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">Destination</span>
        <AddressAutocomplete
          placeholder="Start typing an address"
          value={destination.label}
          onChange={(text) => setDestination((d) => ({ ...d, label: text }))}
          onSelectLocation={(loc) => setDestination({ label: loc.label, location: { lat: loc.lat, lng: loc.lng } })}
          style={inputStyle}
          required
        />
      </div>

      <Input
        label="Your convenient time"
        type="datetime-local"
        value={desiredTime}
        onChange={(e) => setDesiredTime(e.target.value)}
        required
      />

      <PickupDropoffPicker pickup={pickup} onPickupChange={setPickup} dropoff={dropoff} onDropoffChange={setDropoff} />

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" fullWidth loading={submitting}>
          Post request
        </Button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid var(--border)",
  fontSize: 15,
};
