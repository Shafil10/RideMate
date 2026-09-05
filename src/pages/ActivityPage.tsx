import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Users } from "lucide-react";
import { fetchRideHistory, fetchRides, fetchMyOfferedRides, type RideHistoryEntry, type Ride, type DriverRide } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardSkeleton, Chip, EmptyState } from "../components/ui";
import RatingPrompt from "../components/rides/RatingPrompt";
import RideCard from "../components/rides/RideCard";
import FareBreakdown from "../components/rides/FareBreakdown";
import PassengersSheet from "../components/rides/PassengersSheet";
import ChatSheet from "../components/rides/ChatSheet";
import EmptyActivityIllustration from "../components/illustrations/EmptyActivityIllustration";

export default function ActivityPage() {
  const { user, token } = useAuth();
  const isDriverMode = user?.defaultRole === "driver";

  const [history, setHistory] = useState<RideHistoryEntry[]>([]);
  const [passengerRides, setPassengerRides] = useState<Ride[]>([]);
  const [driverRides, setDriverRides] = useState<DriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [passengersRide, setPassengersRide] = useState<DriverRide | null>(null);
  const [chatWith, setChatWith] = useState<{ rideId: string; otherUserId: string; otherUserName: string } | null>(null);

  function load() {
    if (!token) return;
    setLoading(true);
    // RatingPrompt always needs history (it's the only endpoint carrying
    // alreadyRated); the ride lists themselves come from whichever source
    // actually has full booking/phone detail for the active role.
    Promise.all([
      fetchRideHistory(token)
        .then((data) => setHistory(data.history))
        .catch(() => setHistory([])),
      isDriverMode
        ? fetchMyOfferedRides(token)
            .then((data) => setDriverRides(data.rides))
            .catch(() => setDriverRides([]))
        : fetchRides(token)
            .then((data) => setPassengerRides(data.rides))
            .catch(() => setPassengerRides([])),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isDriverMode]);

  if (!token) return null;

  const now = Date.now();
  const upcomingPassengerRides = passengerRides.filter((r) => r.myBooking && new Date(r.departureTime).getTime() > now);
  const completedPassengerRides = passengerRides
    .filter((r) => r.myBooking && new Date(r.departureTime).getTime() <= now)
    .sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());
  const upcomingDriverRides = driverRides.filter((r) => new Date(r.departureTime).getTime() > now);
  const completedDriverRides = driverRides.filter((r) => new Date(r.departureTime).getTime() <= now);

  const isEmpty = isDriverMode
    ? upcomingDriverRides.length === 0 && completedDriverRides.length === 0
    : upcomingPassengerRides.length === 0 && completedPassengerRides.length === 0;

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28 flex flex-col gap-7">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-text">Activity</h1>
        <p className="text-text-muted text-sm mt-1">
          {isDriverMode ? "Rides you've offered, upcoming and completed." : "Rides you've joined, upcoming and completed."}
        </p>
      </div>

      <RatingPrompt history={history} token={token} onRated={load} />

      {loading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : isEmpty ? (
        <EmptyState
          illustration={<EmptyActivityIllustration />}
          title="No rides yet"
          subtitle={isDriverMode ? "Rides you offer will show up here." : "Rides you join will show up here."}
        />
      ) : isDriverMode ? (
        <>
          <ActivitySection title="Upcoming rides" emptyText="No upcoming rides.">
            {upcomingDriverRides.map((ride) => (
              <DriverActivityCard key={ride.id} ride={ride} onOpenPassengers={() => setPassengersRide(ride)} />
            ))}
          </ActivitySection>
          <ActivitySection title="Completed rides" emptyText="No completed rides yet.">
            {completedDriverRides.map((ride) => (
              <DriverActivityCard key={ride.id} ride={ride} onOpenPassengers={() => setPassengersRide(ride)} />
            ))}
          </ActivitySection>
        </>
      ) : (
        <>
          <ActivitySection title="Upcoming rides" emptyText="No upcoming rides.">
            {upcomingPassengerRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onMessage={() => setChatWith({ rideId: ride.id, otherUserId: ride.driverId, otherUserName: ride.driverName })}
              />
            ))}
          </ActivitySection>
          <ActivitySection title="Completed rides" emptyText="No completed rides yet.">
            {completedPassengerRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onMessage={() => setChatWith({ rideId: ride.id, otherUserId: ride.driverId, otherUserName: ride.driverName })}
              />
            ))}
          </ActivitySection>
        </>
      )}

      <PassengersSheet
        open={!!passengersRide}
        onClose={() => setPassengersRide(null)}
        bookings={passengersRide?.bookings ?? []}
        onMessage={(booking) => {
          if (!passengersRide) return;
          setChatWith({ rideId: passengersRide.id, otherUserId: booking.riderId, otherUserName: booking.riderName });
          setPassengersRide(null);
        }}
      />

      {chatWith && (
        <ChatSheet
          open={!!chatWith}
          onClose={() => setChatWith(null)}
          rideId={chatWith.rideId}
          otherUserId={chatWith.otherUserId}
          otherUserName={chatWith.otherUserName}
        />
      )}
    </div>
  );
}

function ActivitySection({ title, emptyText, children }: { title: string; emptyText: string; children: ReactNode[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold text-text">{title}</h2>
      {children.length > 0 ? (
        <div className="flex flex-col gap-3">{children}</div>
      ) : (
        <p className="text-sm text-text-muted">{emptyText}</p>
      )}
    </div>
  );
}

function DriverActivityCard({ ride, onOpenPassengers }: { ride: DriverRide; onOpenPassengers: () => void }) {
  const isPast = new Date(ride.departureTime).getTime() <= Date.now();
  return (
    <Card className="flex flex-col gap-3">
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

      <div className="flex items-center gap-1.5">
        <Chip tone="neutral">
          {new Date(ride.departureTime).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
        </Chip>
        <button type="button" onClick={onOpenPassengers} disabled={ride.bookings.length === 0} className="disabled:cursor-default">
          <Chip tone={ride.bookings.length > 0 ? "primary" : "neutral"} icon={<Users size={11} />}>
            {ride.seatsTaken}/{ride.seatsTotal} seats{ride.bookings.length > 0 ? " · view" : ""}
          </Chip>
        </button>
      </div>

      {ride.bookings.length > 0 ? (
        <FareBreakdown bookings={ride.bookings} />
      ) : (
        <p className="text-xs text-text-muted border-t border-border/60 pt-3">No passengers booked.</p>
      )}
    </Card>
  );
}
