import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  cancelRideRequest,
  fetchMyRideRequests,
  fetchRideRequests,
  joinRideRequest,
  type RideRequest,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button, BottomSheet, CardSkeleton, EmptyState, useToast } from "../../components/ui";
import RequestCard from "../../components/rides/RequestCard";
import RequestRideForm from "../../components/rides/RequestRideForm";
import PickupDropoffPicker, { emptyPoint, type PointValue } from "../../components/rides/PickupDropoffPicker";
import NoRequestsIllustration from "../../components/illustrations/NoRequestsIllustration";

export default function MyRequests() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [mine, setMine] = useState<RideRequest[]>([]);
  const [open, setOpen] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [joiningRequest, setJoiningRequest] = useState<RideRequest | null>(null);
  const [pickup, setPickup] = useState<PointValue>(emptyPoint);
  const [dropoff, setDropoff] = useState<PointValue>(emptyPoint);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    if (!token || !user) return;
    setLoading(true);
    Promise.all([fetchMyRideRequests(token), fetchRideRequests(user.university)])
      .then(([mineData, openData]) => {
        setMine(mineData.requests);
        const myIds = new Set(mineData.requests.map((r) => r.id));
        setOpen(openData.requests.filter((r) => !myIds.has(r.id)));
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load requests.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function openJoinSheet(request: RideRequest) {
    setPickup(emptyPoint);
    setDropoff(emptyPoint);
    setJoiningRequest(request);
  }

  async function handleConfirmJoin() {
    if (!token || !joiningRequest || !pickup.label.trim() || !dropoff.label.trim()) {
      showToast("Enter both a pickup and drop-off point.", "error");
      return;
    }
    setBusyId(joiningRequest.id);
    try {
      await joinRideRequest(
        joiningRequest.id,
        {
          pickupPoint: pickup.label.trim(),
          pickupLat: pickup.location?.lat ?? null,
          pickupLng: pickup.location?.lng ?? null,
          dropoffPoint: dropoff.label.trim(),
          dropoffLat: dropoff.location?.lat ?? null,
          dropoffLng: dropoff.location?.lng ?? null,
        },
        token,
      );
      setJoiningRequest(null);
      showToast("You've joined the request!");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to join request.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id: string) {
    if (!token) return;
    setBusyId(id);
    try {
      await cancelRideRequest(id, token);
      showToast("Request updated.");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to cancel.", "error");
    } finally {
      setBusyId(null);
    }
  }

  function handleCreated() {
    setShowCreateSheet(false);
    showToast("Request posted — drivers on your route will see it.");
    load();
  }

  if (!token) return null;

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28 flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-text">Your requests</h1>
          <p className="text-text-muted text-sm mt-1">Track requests you've posted or pooled onto.</p>
        </div>
        <Button size="sm" icon={<PlusCircle size={16} />} onClick={() => setShowCreateSheet(true)}>
          New
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : mine.length === 0 ? (
        <EmptyState
          illustration={<NoRequestsIllustration />}
          title="No requests yet"
          subtitle="Post a request when nobody's offering a ride at your time — other students can join, and drivers can pick it up."
          action={<Button onClick={() => setShowCreateSheet(true)}>Request a ride</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {mine.map((r) => {
            const isInitiator = r.initiatorId === user?.id;
            return (
              <RequestCard
                key={r.id}
                request={r}
                footer={
                  r.status === "open" ? (
                    <Button variant="outline" size="sm" onClick={() => handleCancel(r.id)} loading={busyId === r.id}>
                      {isInitiator ? "Cancel request" : "Leave request"}
                    </Button>
                  ) : r.status === "fulfilled" ? (
                    <span className="text-xs font-semibold text-primary-dark">A driver picked this up 🎉</span>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}

      {open.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-text">Pool with other students</h2>
            <p className="text-text-muted text-xs">Open requests on your campus you could join</p>
          </div>
          <div className="flex flex-col gap-3">
            {open.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                footer={
                  <Button size="sm" onClick={() => openJoinSheet(r)}>
                    Join
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      <BottomSheet open={!!joiningRequest} onClose={() => setJoiningRequest(null)} title="Join this request">
        {joiningRequest && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-text-muted">
              {joiningRequest.origin} → {joiningRequest.destination}
            </div>
            <PickupDropoffPicker pickup={pickup} onPickupChange={setPickup} dropoff={dropoff} onDropoffChange={setDropoff} />
            <Button fullWidth onClick={handleConfirmJoin} loading={busyId === joiningRequest.id}>
              Confirm
            </Button>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="Request a ride">
        <RequestRideForm onCreated={handleCreated} onCancel={() => setShowCreateSheet(false)} />
      </BottomSheet>
    </div>
  );
}
