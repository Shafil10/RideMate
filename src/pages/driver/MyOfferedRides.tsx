import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { fetchMyOfferedRides, type DriverRide } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Card, CardSkeleton, Chip, EmptyState, useToast } from "../../components/ui";
import FareBreakdown from "../../components/rides/FareBreakdown";
import NoRidesIllustration from "../../components/illustrations/NoRidesIllustration";

export default function MyOfferedRides() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchMyOfferedRides(token)
      .then((data) => setRides(data.rides))
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load rides.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-text">My rides</h1>
        <p className="text-text-muted text-sm mt-1">Everything you've offered, with per-passenger fares.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : rides.length === 0 ? (
        <EmptyState
          illustration={<NoRidesIllustration />}
          title="No rides offered yet"
          subtitle="Create a ride from Home to see it show up here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rides.map((ride) => {
            const isPast = new Date(ride.departureTime) < new Date();
            return (
              <Card key={ride.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <Chip tone={ride.type === "shared-taxi" ? "accent" : "driver"}>
                    {ride.type === "shared-taxi" ? "Shared taxi" : "Student driver"}
                  </Chip>
                  {isPast && <Chip tone="neutral">Completed</Chip>}
                </div>

                <div className="flex items-center gap-1.5 font-display font-bold text-text text-[15px]">
                  <span className="truncate">{ride.origin}</span>
                  <ArrowRight size={14} className="text-text-muted shrink-0" />
                  <span className="truncate">{ride.destination}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip tone="neutral" icon={<Clock3 size={11} />}>
                    {new Date(ride.departureTime).toLocaleString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Chip>
                  <Chip tone="neutral" icon={<Users size={11} />}>
                    {ride.seatsTaken}/{ride.seatsTotal} seats
                  </Chip>
                </div>

                {ride.bookings.length > 0 ? (
                  <FareBreakdown bookings={ride.bookings} />
                ) : (
                  <p className="text-xs text-text-muted border-t border-border/60 pt-3">No passengers booked yet.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
