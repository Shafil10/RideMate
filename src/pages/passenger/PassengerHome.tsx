import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import {
  cancelBooking,
  fetchPickupSuggestions,
  fetchRecommendedRides,
  fetchRecurringPatterns,
  fetchRides,
  joinRide,
  toggleFavorite,
  type PickupSuggestion,
  type RecurringPattern,
  type Ride,
  type RideRequest,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button, BottomSheet, CardSkeleton, EmptyState, useToast } from "../../components/ui";
import RideCard from "../../components/rides/RideCard";
import RequestRideForm from "../../components/rides/RequestRideForm";
import PickupDropoffPicker, { emptyPoint, type PointValue } from "../../components/rides/PickupDropoffPicker";
import NoRidesIllustration from "../../components/illustrations/NoRidesIllustration";

function timeOfDayMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function timeStringToMinutes(t: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

export default function PassengerHome() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedRides, setRecommendedRides] = useState<Ride[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<PickupSuggestion[]>([]);

  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [joiningRide, setJoiningRide] = useState<Ride | null>(null);
  const [pickup, setPickup] = useState<PointValue>(emptyPoint);
  const [dropoff, setDropoff] = useState<PointValue>(emptyPoint);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [favBusyId, setFavBusyId] = useState<string | null>(null);
  const [showRequestSheet, setShowRequestSheet] = useState(false);

  function loadRides() {
    setLoading(true);
    fetchRides(token)
      .then((data) => setRides(data.rides))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) {
      setRecommendedRides([]);
      return;
    }
    fetchRecommendedRides(token)
      .then((data) => setRecommendedRides(data.rides))
      .catch(() => setRecommendedRides([]));
  }, [token, rides]);

  useEffect(() => {
    if (!token) {
      setRecurringPatterns([]);
      setPickupSuggestions([]);
      return;
    }
    fetchRecurringPatterns(token)
      .then((data) => setRecurringPatterns(data.patterns))
      .catch(() => setRecurringPatterns([]));
    fetchPickupSuggestions(token)
      .then((data) => setPickupSuggestions(data.suggestions))
      .catch(() => setPickupSuggestions([]));
  }, [token]);

  function applyRecurringPattern(p: RecurringPattern) {
    setTimeFrom("");
    setTimeTo("");
    showToast(`Showing rides around ${formatHour(p.typicalHour)} for ${p.origin} → ${p.destination}`);
  }

  function openJoin(ride: Ride) {
    setPickup(emptyPoint);
    setDropoff(emptyPoint);
    setJoiningRide(ride);
  }

  async function handleConfirmJoin() {
    if (!token || !joiningRide || !pickup.label.trim()) {
      showToast("Enter a pickup point on the ride's route.", "error");
      return;
    }
    setBusyRideId(joiningRide.id);
    try {
      await joinRide(
        joiningRide.id,
        {
          pickupPoint: pickup.label.trim(),
          pickupLat: pickup.location?.lat ?? null,
          pickupLng: pickup.location?.lng ?? null,
          dropoffPoint: dropoff.label.trim() || null,
          dropoffLat: dropoff.location?.lat ?? null,
          dropoffLng: dropoff.location?.lng ?? null,
        },
        token,
      );
      setJoiningRide(null);
      showToast("Seat reserved. See you at the pickup point!");
      loadRides();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to join ride.", "error");
    } finally {
      setBusyRideId(null);
    }
  }

  async function handleToggleFavorite(id: string) {
    if (!token) return;
    setFavBusyId(id);
    try {
      const { isFavorited } = await toggleFavorite(id, token);
      setRides((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorited } : r)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update favorite.", "error");
    } finally {
      setFavBusyId(null);
    }
  }

  async function handleCancelBooking(id: string) {
    if (!token) return;
    setBusyRideId(id);
    try {
      const { cancellationFee } = await cancelBooking(id, token);
      showToast(`Booking cancelled. Compensation fee: ৳${cancellationFee}.`);
      loadRides();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to cancel booking.", "error");
    } finally {
      setBusyRideId(null);
    }
  }

  function handleRequestCreated(_request: RideRequest) {
    setShowRequestSheet(false);
    showToast("Request posted — drivers on your route will see it.");
  }

  const visibleRides = useMemo(() => {
    const fromMin = timeStringToMinutes(timeFrom);
    const toMin = timeStringToMinutes(timeTo);
    return rides.filter((ride) => {
      if (favoritesOnly && !ride.isFavorited) return false;
      if (fromMin === null && toMin === null) return true;
      const rideMin = timeOfDayMinutes(ride.departureTime);
      if (fromMin !== null && toMin !== null) {
        return fromMin <= toMin ? rideMin >= fromMin && rideMin <= toMin : rideMin >= fromMin || rideMin <= toMin;
      }
      if (fromMin !== null) return rideMin >= fromMin;
      return rideMin <= (toMin as number);
    });
  }, [rides, timeFrom, timeTo, favoritesOnly]);

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28 flex flex-col gap-7">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-text">Hey {user?.name.split(" ")[0]} 👋</h1>
        <p className="text-text-muted text-sm mt-1">Find a ride on your route, or request one yourself.</p>
      </div>

      {recurringPatterns.length > 0 && (
        <div className="flex flex-col gap-2">
          {recurringPatterns.map((p) => (
            <button
              key={`${p.origin}|${p.destination}`}
              type="button"
              onClick={() => applyRecurringPattern(p)}
              className="text-left bg-driver-light rounded-2xl px-4 py-3 text-xs text-driver-dark font-medium"
            >
              🔁 You've ridden <strong>{p.origin} → {p.destination}</strong> around <strong>{formatHour(p.typicalHour)}</strong>{" "}
              {p.count} times — looks like a regular commute.
            </button>
          ))}
        </div>
      )}

      {token && recommendedRides.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-text">Recommended for you</h2>
            <p className="text-text-muted text-xs">Matched to routes you've ridden before</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5">
            {recommendedRides.map((ride) => (
              <div key={ride.id} className="min-w-[260px] shrink-0">
                <RideCard ride={ride} onJoin={() => openJoin(ride)} busy={busyRideId === ride.id} requireLogin={!user} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 bg-card rounded-3xl border border-border/60 px-4 py-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
          After
          <input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} className="rounded-xl border border-border px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
          Before
          <input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} className="rounded-xl border border-border px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted mb-1.5">
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          ★ Favorites
        </label>
        {(timeFrom || timeTo) && (
          <button
            type="button"
            onClick={() => {
              setTimeFrom("");
              setTimeTo("");
            }}
            className="text-xs font-semibold text-primary mb-1.5"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-text">Available rides</h2>
        {loading ? (
          <div className="flex flex-col gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : visibleRides.length === 0 ? (
          <EmptyState
            illustration={<NoRidesIllustration />}
            title="No rides match right now"
            subtitle="No one's offering this route at your time yet — post a request and other students (or a driver) can pick it up."
            action={
              <Button icon={<PlusCircle size={18} />} onClick={() => setShowRequestSheet(true)}>
                Request a ride
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {visibleRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onJoin={() => openJoin(ride)}
                  onCancel={() => handleCancelBooking(ride.id)}
                  onToggleFavorite={() => handleToggleFavorite(ride.id)}
                  busy={busyRideId === ride.id}
                  favBusy={favBusyId === ride.id}
                  requireLogin={!user}
                />
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setShowRequestSheet(true)}
              className="flex items-center justify-center gap-2 text-primary font-semibold text-sm py-3 rounded-2xl border-2 border-dashed border-primary/40"
            >
              <PlusCircle size={16} /> Can't find your ride? Request one
            </motion.button>
          </>
        )}
      </div>

      <BottomSheet open={!!joiningRide} onClose={() => setJoiningRide(null)} title="Confirm your seat">
        {joiningRide && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-text-muted">
              {joiningRide.origin} → {joiningRide.destination}
            </div>
            <PickupDropoffPicker
              pickup={pickup}
              onPickupChange={setPickup}
              dropoff={dropoff}
              onDropoffChange={setDropoff}
              pickupSuggestions={pickupSuggestions}
            />
            <p className="text-xs text-text-muted">
              Adding a drop-off point lets us calculate a fair fare for just your segment of the route.
            </p>
            <Button fullWidth onClick={handleConfirmJoin} loading={busyRideId === joiningRide.id}>
              Confirm seat
            </Button>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={showRequestSheet} onClose={() => setShowRequestSheet(false)} title="Request a ride">
        <RequestRideForm onCreated={handleRequestCreated} onCancel={() => setShowRequestSheet(false)} />
      </BottomSheet>
    </div>
  );
}
