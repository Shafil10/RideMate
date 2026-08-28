import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Navigation, MapPin, Search } from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";
import {
  cancelBooking,
  fetchFrequentPlaces,
  fetchJoinablePoolRequests,
  fetchNearbyRides,
  fetchPickupSuggestions,
  fetchRecommendedRides,
  fetchRecurringPatterns,
  fetchRides,
  joinRide,
  joinRideRequest,
  reverseGeocode,
  searchPlaces,
  toggleFavorite,
  type FrequentPlace,
  type PickupSuggestion,
  type RecurringPattern,
  type Ride,
  type RideRequest,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button, BottomSheet, CardSkeleton, EmptyState, Input, useToast } from "../../components/ui";
import RideCard from "../../components/rides/RideCard";
import RequestCard from "../../components/rides/RequestCard";
import RequestRideForm from "../../components/rides/RequestRideForm";
import AddressAutocomplete from "../../components/rides/AddressAutocomplete";
import RouteMapPreview from "../../components/rides/RouteMapPreview";
import PickupDropoffPicker, { emptyPoint, type PointValue } from "../../components/rides/PickupDropoffPicker";
import NoRidesIllustration from "../../components/illustrations/NoRidesIllustration";

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

function nextRoundedTime(): string {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Step = "search" | "results" | "pool";

export default function PassengerHome() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("search");

  const [origin, setOrigin] = useState<PointValue>(emptyPoint);
  const [destination, setDestination] = useState<PointValue>(emptyPoint);
  const [desiredTime, setDesiredTime] = useState(nextRoundedTime());
  const originTouched = useRef(false);
  const [locatingOrigin, setLocatingOrigin] = useState(false);

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Ride[]>([]);
  const [joinablePools, setJoinablePools] = useState<RideRequest[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [myUpcoming, setMyUpcoming] = useState<Ride[]>([]);
  const [recommendedRides, setRecommendedRides] = useState<Ride[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<PickupSuggestion[]>([]);
  const [frequentPlaces, setFrequentPlaces] = useState<FrequentPlace[]>([]);

  const [joiningRide, setJoiningRide] = useState<Ride | null>(null);
  const [pickup, setPickup] = useState<PointValue>(emptyPoint);
  const [dropoff, setDropoff] = useState<PointValue>(emptyPoint);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [favBusyId, setFavBusyId] = useState<string | null>(null);

  const [joiningPool, setJoiningPool] = useState<RideRequest | null>(null);
  const [poolPickup, setPoolPickup] = useState<PointValue>(emptyPoint);
  const [poolDropoff, setPoolDropoff] = useState<PointValue>(emptyPoint);
  const [poolBusyId, setPoolBusyId] = useState<string | null>(null);

  function loadUpcoming() {
    if (!token) {
      setMyUpcoming([]);
      return;
    }
    fetchRides(token)
      .then((data) => setMyUpcoming(data.rides.filter((r) => r.myBooking)))
      .catch(() => setMyUpcoming([]));
  }

  useEffect(() => {
    loadUpcoming();
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
  }, [token]);

  useEffect(() => {
    if (!token) {
      setRecurringPatterns([]);
      setPickupSuggestions([]);
      setFrequentPlaces([]);
      return;
    }
    fetchRecurringPatterns(token)
      .then((data) => setRecurringPatterns(data.patterns))
      .catch(() => setRecurringPatterns([]));
    fetchPickupSuggestions(token)
      .then((data) => setPickupSuggestions(data.suggestions))
      .catch(() => setPickupSuggestions([]));
    fetchFrequentPlaces(token)
      .then((data) => setFrequentPlaces(data.places))
      .catch(() => setFrequentPlaces([]));
  }, [token]);

  // Default the origin to the passenger's live location, like Uber/Pathao — a
  // manual pick (typing or tapping a suggestion) always wins, tracked via the
  // ref rather than state so a slow GPS/reverse-geocode response can't stomp on
  // a choice the user already made while it was in flight.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLocatingOrigin(true);
    Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
      .then(async (pos) => {
        if (cancelled || originTouched.current) return;
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        try {
          const { label: reverseLabel } = await reverseGeocode(lat, lng);
          if (reverseLabel) label = reverseLabel;
        } catch {
          // keep the coordinate fallback label
        }
        if (!cancelled && !originTouched.current) {
          setOrigin({ label, location: { lat, lng } });
        }
      })
      .catch(() => {
        // Geolocation denied/unavailable — leave origin blank for manual entry.
      })
      .finally(() => {
        if (!cancelled) setLocatingOrigin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function applyRecurringPattern(p: RecurringPattern) {
    const t = new Date();
    t.setHours(p.typicalHour, 0, 0, 0);
    if (t.getTime() < Date.now()) t.setDate(t.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const iso = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:00`;
    setDesiredTime(iso);

    // The pattern only carries text (grouped from past bookings, no stored
    // coordinates) — geocode both ends so the route can actually be searched
    // and drawn on the map, instead of just dropping unmatchable text into the fields.
    const [originGeo, destGeo] = await Promise.all([searchPlaces(p.origin), searchPlaces(p.destination)]);
    const originPoint: PointValue = originGeo.results[0]
      ? { label: originGeo.results[0].label, location: { lat: originGeo.results[0].lat, lng: originGeo.results[0].lng } }
      : { label: p.origin, location: null };
    const destPoint: PointValue = destGeo.results[0]
      ? { label: destGeo.results[0].label, location: { lat: destGeo.results[0].lat, lng: destGeo.results[0].lng } }
      : { label: p.destination, location: null };

    originTouched.current = true;
    setOrigin(originPoint);
    setDestination(destPoint);

    if (originPoint.location && destPoint.location) {
      runSearch(originPoint, destPoint, iso);
    } else {
      showToast("Couldn't automatically place that route — check the fields and search manually.", "error");
    }
  }

  async function runSearch(o: PointValue, d: PointValue, time: string) {
    if (!token || !o.location || !d.location) {
      showToast("Pick an origin and destination from the suggestions so we can match a route.", "error");
      return;
    }
    setSearching(true);
    setStep("results");
    try {
      const route = {
        originLat: o.location.lat,
        originLng: o.location.lng,
        destLat: d.location.lat,
        destLng: d.location.lng,
        university: user?.university,
      };
      const [ridesData, poolsData] = await Promise.all([
        fetchNearbyRides({ ...route, desiredTime: time ? new Date(time).toISOString() : undefined }, token),
        fetchJoinablePoolRequests(route, token),
      ]);
      setResults(ridesData.rides);
      setJoinablePools(poolsData.requests);
      if (ridesData.rides.length === 0 && poolsData.requests.length === 0) {
        setStep("pool");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Search failed.", "error");
      setStep("search");
    } finally {
      setSearching(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(origin, destination, desiredTime);
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
      runSearch(origin, destination, desiredTime);
      loadUpcoming();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to join ride.", "error");
    } finally {
      setBusyRideId(null);
    }
  }

  function openJoinPool(request: RideRequest) {
    setPoolPickup(emptyPoint);
    setPoolDropoff(emptyPoint);
    setJoiningPool(request);
  }

  async function handleConfirmJoinPool() {
    if (!token || !joiningPool || !poolPickup.label.trim() || !poolDropoff.label.trim()) {
      showToast("Enter both a pickup and drop-off point.", "error");
      return;
    }
    setPoolBusyId(joiningPool.id);
    try {
      await joinRideRequest(
        joiningPool.id,
        {
          pickupPoint: poolPickup.label.trim(),
          pickupLat: poolPickup.location?.lat ?? null,
          pickupLng: poolPickup.location?.lng ?? null,
          dropoffPoint: poolDropoff.label.trim(),
          dropoffLat: poolDropoff.location?.lat ?? null,
          dropoffLng: poolDropoff.location?.lng ?? null,
        },
        token,
      );
      setJoiningPool(null);
      showToast("You've joined the pool!");
      runSearch(origin, destination, desiredTime);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to join pool.", "error");
    } finally {
      setPoolBusyId(null);
    }
  }

  async function handleToggleFavorite(id: string) {
    if (!token) return;
    setFavBusyId(id);
    try {
      const { isFavorited } = await toggleFavorite(id, token);
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorited } : r)));
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
      loadUpcoming();
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, myBooking: null } : r)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to cancel booking.", "error");
    } finally {
      setBusyRideId(null);
    }
  }

  function handleRequestCreated(_request: RideRequest) {
    showToast("Request posted — up to 3 more students can pool onto it, or a driver can pick it up.");
    setStep("search");
    setDestination(emptyPoint);
    setDesiredTime(nextRoundedTime());
  }

  const visibleResults = useMemo(
    () => results.filter((r) => !favoritesOnly || r.isFavorited),
    [results, favoritesOnly],
  );

  const canSearch = !!origin.location && !!destination.location && !!desiredTime;
  const placeSuggestions = useMemo(
    () =>
      frequentPlaces
        .filter((p) => p.lat !== null && p.lng !== null)
        .map((p) => ({ label: p.label, lat: p.lat as number, lng: p.lng as number })),
    [frequentPlaces],
  );

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28 flex flex-col gap-6">
      {step === "search" && (
        <>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-text">Where to, {user?.name.split(" ")[0]}?</h1>
            <p className="text-text-muted text-sm mt-1">Enter your route and we'll find a ride on it.</p>
          </div>

          {myUpcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-sm font-bold text-text">Your upcoming ride</h2>
              {myUpcoming.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onCancel={() => handleCancelBooking(ride.id)}
                  busy={busyRideId === ride.id}
                />
              ))}
            </div>
          )}

          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 bg-card rounded-3xl border border-border/60 px-4 py-4">
            <div className="flex items-center gap-2.5">
              <Navigation size={16} className="text-primary shrink-0" />
              <AddressAutocomplete
                placeholder={locatingOrigin ? "Detecting your location…" : "Origin"}
                value={origin.label}
                onChange={(text) => {
                  originTouched.current = true;
                  setOrigin((o) => ({ ...o, label: text }));
                }}
                onSelectLocation={(loc) => {
                  originTouched.current = true;
                  setOrigin({ label: loc.label, location: { lat: loc.lat, lng: loc.lng } });
                }}
                quickSuggestions={placeSuggestions}
                style={inputStyle}
                required
              />
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} className="text-accent shrink-0" />
              <AddressAutocomplete
                placeholder="Destination"
                value={destination.label}
                onChange={(text) => setDestination((d) => ({ ...d, label: text }))}
                onSelectLocation={(loc) => setDestination({ label: loc.label, location: { lat: loc.lat, lng: loc.lng } })}
                quickSuggestions={placeSuggestions}
                style={inputStyle}
                required
              />
            </div>

            <RouteMapPreview origin={origin.location} destination={destination.location} />

            <Input
              label="When"
              type="datetime-local"
              value={desiredTime}
              onChange={(e) => setDesiredTime(e.target.value)}
              required
            />
            <Button type="submit" fullWidth icon={<Search size={18} />} disabled={!canSearch} loading={searching}>
              Find rides
            </Button>
          </form>

          {recurringPatterns.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-bold text-text">Your regular commutes</h2>
              {recurringPatterns.map((p) => (
                <button
                  key={`${p.origin}|${p.destination}`}
                  type="button"
                  onClick={() => applyRecurringPattern(p)}
                  className="text-left bg-driver-light rounded-2xl px-4 py-3 text-xs text-driver-dark font-medium"
                >
                  🔁 <strong>{p.origin} → {p.destination}</strong> around <strong>{formatHour(p.typicalHour)}</strong> — tap to search
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {step === "results" && (
        <>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep("search")} className="text-text-muted">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold text-text truncate">
                {origin.label} → {destination.label}
              </div>
              <div className="text-xs text-text-muted">
                {desiredTime ? new Date(desiredTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : ""}
              </div>
            </div>
          </div>

          <RouteMapPreview origin={origin.location} destination={destination.location} height={140} />

          {token && recommendedRides.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-sm font-bold text-text">Recommended for you</h2>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5">
                {recommendedRides.map((ride) => (
                  <div key={ride.id} className="min-w-[260px] shrink-0">
                    <RideCard ride={ride} onJoin={() => openJoin(ride)} busy={busyRideId === ride.id} requireLogin={!user} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-text">Matching rides</h2>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
              ★ Favorites
            </label>
          </div>

          {searching ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : visibleResults.length === 0 && joinablePools.length === 0 ? (
            <EmptyState
              illustration={<NoRidesIllustration />}
              title="No rides match this route"
              subtitle="No one's offering this route at your time yet, and no other student has a pool going your way."
              action={<Button onClick={() => setStep("pool")}>Post a pool request</Button>}
            />
          ) : (
            <>
              {visibleResults.length > 0 && (
                <div className="flex flex-col gap-3">
                  {visibleResults.map((ride) => (
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
              )}

              {joinablePools.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="font-display text-sm font-bold text-text">Students pooling this route</h2>
                    <p className="text-text-muted text-xs">
                      No car needed to start one of these — join, and a 4-seater gets booked for however many joined
                      by the time (no need to wait for a full car)
                    </p>
                  </div>
                  {joinablePools.map((r) => (
                    <RequestCard
                      key={r.id}
                      request={r}
                      footer={
                        <Button size="sm" onClick={() => openJoinPool(r)} loading={poolBusyId === r.id}>
                          Join pool
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep("pool")}
                className="text-center text-primary font-semibold text-sm py-3 rounded-2xl border-2 border-dashed border-primary/40"
              >
                None of these work? Start your own pool request
              </button>
            </>
          )}
        </>
      )}

      {step === "pool" && (
        <>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep(results.length > 0 || joinablePools.length > 0 ? "results" : "search")} className="text-text-muted">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-xl font-extrabold text-text">Request a pool ride</h1>
          </div>
          <RequestRideForm
            initial={{ origin, destination, desiredTime }}
            onCreated={handleRequestCreated}
            onCancel={() => setStep(results.length > 0 || joinablePools.length > 0 ? "results" : "search")}
          />
        </>
      )}

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

      <BottomSheet open={!!joiningPool} onClose={() => setJoiningPool(null)} title="Join this pool">
        {joiningPool && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-text-muted">
              {joiningPool.origin} → {joiningPool.destination}
            </div>
            <PickupDropoffPicker
              pickup={poolPickup}
              onPickupChange={setPoolPickup}
              dropoff={poolDropoff}
              onDropoffChange={setPoolDropoff}
              pickupSuggestions={pickupSuggestions}
            />
            <Button fullWidth onClick={handleConfirmJoinPool} loading={poolBusyId === joiningPool.id}>
              Confirm
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  fontSize: 15,
};
