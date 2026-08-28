import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  createRide,
  fetchMyOfferedRides,
  fetchNearbyRideRequests,
  fulfillRideRequest,
  type DriverRide,
  type Ride,
  type RideRequest,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { haversineKm, estimateFairFare, isRushHour } from "../../lib/geo";
import { Button, Card, CardSkeleton, Chip, EmptyState, Input, useToast } from "../../components/ui";
import AddressAutocomplete from "../../components/rides/AddressAutocomplete";
import PickupMapPicker, { type LatLng } from "../../components/rides/PickupMapPicker";
import RequestCard from "../../components/rides/RequestCard";
import NoRequestsIllustration from "../../components/illustrations/NoRequestsIllustration";

const emptyForm = {
  type: "student-driver" as Ride["type"],
  origin: "",
  destination: "",
  departureTime: "",
  seatsTotal: 3,
  farePerSeat: 50,
};

export default function DriverHome() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [originLocation, setOriginLocation] = useState<LatLng | null>(null);
  const [destLocation, setDestLocation] = useState<LatLng | null>(null);
  const [showOriginMap, setShowOriginMap] = useState(false);
  const [showDestMap, setShowDestMap] = useState(false);
  const [fareManuallySet, setFareManuallySet] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [upcomingRides, setUpcomingRides] = useState<DriverRide[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | DriverRide | null>(null);
  const [nearbyRequests, setNearbyRequests] = useState<RideRequest[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const suggestedFare = useMemo(() => {
    if (!originLocation || !destLocation) return null;
    const distanceKm = haversineKm(originLocation.lat, originLocation.lng, destLocation.lat, destLocation.lng);
    const departure = form.departureTime ? new Date(form.departureTime) : undefined;
    const tripFare = estimateFairFare(distanceKm, departure);
    const perSeat = form.type === "student-driver" ? Math.round(tripFare / Math.max(1, form.seatsTotal)) : tripFare;
    return { distanceKm, tripFare, fare: perSeat, isRush: departure ? isRushHour(departure) : false };
  }, [originLocation, destLocation, form.type, form.seatsTotal, form.departureTime]);

  useEffect(() => {
    if (suggestedFare && !fareManuallySet) {
      setForm((f) => ({ ...f, farePerSeat: suggestedFare.fare }));
    }
  }, [suggestedFare, fareManuallySet]);

  function loadUpcomingRides() {
    if (!token) return;
    fetchMyOfferedRides(token)
      .then((data) =>
        setUpcomingRides(
          data.rides.filter((r) => new Date(r.departureTime) > new Date() && r.seatsTaken < r.seatsTotal),
        ),
      )
      .catch(() => setUpcomingRides([]));
  }

  useEffect(() => {
    loadUpcomingRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !selectedRide || !user) {
      setNearbyRequests([]);
      return;
    }
    if (selectedRide.originLat === null || selectedRide.originLng === null || selectedRide.destLat === null || selectedRide.destLng === null) {
      setNearbyRequests([]);
      return;
    }
    setLoadingNearby(true);
    fetchNearbyRideRequests(
      {
        originLat: selectedRide.originLat,
        originLng: selectedRide.originLng,
        destLat: selectedRide.destLat,
        destLng: selectedRide.destLng,
        university: user.university,
      },
      token,
    )
      .then((data) => setNearbyRequests(data.requests))
      .catch(() => setNearbyRequests([]))
      .finally(() => setLoadingNearby(false));
  }, [token, selectedRide, user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !token) return;
    setSubmitting(true);
    try {
      const { ride } = await createRide(
        {
          ...form,
          university: user.university,
          originLat: originLocation?.lat ?? null,
          originLng: originLocation?.lng ?? null,
          destLat: destLocation?.lat ?? null,
          destLng: destLocation?.lng ?? null,
        },
        token,
      );
      showToast("Ride offer created!");
      setForm(emptyForm);
      setOriginLocation(null);
      setDestLocation(null);
      setShowOriginMap(false);
      setShowDestMap(false);
      setFareManuallySet(false);
      setSelectedRide(ride);
      loadUpcomingRides();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create ride.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFulfill(request: RideRequest) {
    if (!token || !selectedRide) return;
    setFulfillingId(request.id);
    try {
      await fulfillRideRequest(request.id, { rideId: selectedRide.id }, token);
      showToast(`Added ${request.seatsNeeded} passenger${request.seatsNeeded === 1 ? "" : "s"} to your ride!`);
      setNearbyRequests((prev) => prev.filter((r) => r.id !== request.id));
      loadUpcomingRides();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to fulfill request.", "error");
    } finally {
      setFulfillingId(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28 flex flex-col gap-7">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-text">Hey {user?.name.split(" ")[0]} 👋</h1>
        <p className="text-text-muted text-sm mt-1">Offer a ride, or fulfill a nearby request.</p>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-text">Offer a ride</h2>
        {user?.vehicleMake && (
          <div className="text-xs text-driver-dark bg-driver-light rounded-2xl px-4 py-2.5 -mt-1">
            🚗 Registered vehicle: {[user.vehicleColor, user.vehicleMake, user.vehicleModel].filter(Boolean).join(" ")}
            {user.vehiclePlate && <> · {user.vehiclePlate}</>}
            {user.vehicleSeats && <> · {user.vehicleSeats} seats</>} — this is what passengers will see on your rides.
          </div>
        )}
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Ride["type"] })}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3.5 text-[15px] text-text"
          >
            <option value="student-driver">Student Driver Ride</option>
            <option value="shared-taxi">Shared Taxi Ride</option>
          </select>

          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <AddressAutocomplete
                placeholder="Origin — start typing an address"
                value={form.origin}
                onChange={(text) => setForm({ ...form, origin: text })}
                onSelectLocation={(loc) => {
                  setForm({ ...form, origin: loc.label });
                  setOriginLocation({ lat: loc.lat, lng: loc.lng });
                }}
                style={inputStyle}
                required
              />
              <button type="button" onClick={() => setShowOriginMap((v) => !v)} className={pinClass(!!originLocation)}>
                {originLocation ? "Pinned" : "Map"}
              </button>
            </div>
            {showOriginMap && <PickupMapPicker value={originLocation} onChange={setOriginLocation} />}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <AddressAutocomplete
                placeholder="Destination — start typing an address"
                value={form.destination}
                onChange={(text) => setForm({ ...form, destination: text })}
                onSelectLocation={(loc) => {
                  setForm({ ...form, destination: loc.label });
                  setDestLocation({ lat: loc.lat, lng: loc.lng });
                }}
                style={inputStyle}
                required
              />
              <button type="button" onClick={() => setShowDestMap((v) => !v)} className={pinClass(!!destLocation)}>
                {destLocation ? "Pinned" : "Map"}
              </button>
            </div>
            {showDestMap && <PickupMapPicker value={destLocation} onChange={setDestLocation} />}
          </div>

          <Input
            type="datetime-local"
            label="Departure time"
            value={form.departureTime}
            onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
            required
          />

          <Input
            type="number"
            min={1}
            label="Seats total"
            value={form.seatsTotal}
            onChange={(e) => setForm({ ...form, seatsTotal: Number(e.target.value) })}
          />

          <div className="flex flex-col gap-1.5">
            <Input
              type="number"
              min={0}
              label="Fare per seat (BDT)"
              value={form.farePerSeat}
              onChange={(e) => {
                setFareManuallySet(true);
                setForm({ ...form, farePerSeat: Number(e.target.value) });
              }}
            />
            {suggestedFare ? (
              <span className="text-xs text-text-muted">
                {form.type === "student-driver" ? (
                  <>
                    Suggested: ৳{suggestedFare.tripFare} total for {suggestedFare.distanceKm.toFixed(1)} km, split across{" "}
                    {form.seatsTotal} seat{form.seatsTotal === 1 ? "" : "s"} → ৳{suggestedFare.fare}/seat
                  </>
                ) : (
                  <>
                    Suggested: ৳{suggestedFare.fare} for {suggestedFare.distanceKm.toFixed(1)} km
                  </>
                )}
                {suggestedFare.isRush && <span className="text-accent font-bold"> · includes +30% rush-hour pricing</span>}
              </span>
            ) : (
              <span className="text-xs text-accent font-semibold">
                📍 Pin both Origin and Destination on the map to auto-calculate a fair fare and enable route-matching.
              </span>
            )}
          </div>

          <Button type="submit" variant="driver" fullWidth loading={submitting}>
            Create ride offer
          </Button>
        </form>
      </Card>

      {upcomingRides.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-text">Your upcoming rides</h2>
          <div className="flex flex-col gap-2">
            {upcomingRides.map((ride) => (
              <button
                key={ride.id}
                type="button"
                onClick={() => setSelectedRide(ride)}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors ${
                  selectedRide?.id === ride.id ? "border-driver bg-driver-light" : "border-border/60 bg-card"
                }`}
              >
                <div className="text-sm font-bold text-text">
                  {ride.origin} → {ride.destination}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {new Date(ride.departureTime).toLocaleString()} · {ride.seatsTotal - ride.seatsTaken} seats open
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRide && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-text">Matching ride requests</h2>
            <p className="text-text-muted text-xs">
              Students within ~200m of {selectedRide.origin} → {selectedRide.destination}
            </p>
          </div>
          {loadingNearby ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : nearbyRequests.length === 0 ? (
            <EmptyState
              illustration={<NoRequestsIllustration />}
              title="No matching requests yet"
              subtitle="Check back later, or pick another one of your rides."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {nearbyRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  footer={
                    <Button
                      variant="driver"
                      size="sm"
                      icon={<Users size={14} />}
                      onClick={() => handleFulfill(r)}
                      loading={fulfillingId === r.id}
                    >
                      Fulfill ({r.seatsNeeded} seat{r.seatsNeeded === 1 ? "" : "s"})
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedRide && upcomingRides.length === 0 && (
        <Chip tone="driver">Create a ride above to start matching nearby requests</Chip>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid var(--border)",
  fontSize: 15,
};

function pinClass(active: boolean): string {
  return `h-[52px] px-4 rounded-2xl text-xs font-semibold whitespace-nowrap border shrink-0 ${
    active ? "bg-driver-light border-driver text-driver-dark" : "bg-white border-border text-text-muted"
  }`;
}
