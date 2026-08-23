import { Heart, ArrowRight, Users, Clock3 } from "lucide-react";
import { Avatar, Button, Card, Chip, StarRating } from "../ui";
import type { Ride } from "../../lib/api";

interface RideCardProps {
  ride: Ride;
  onJoin?: () => void;
  onCancel?: () => void;
  onToggleFavorite?: () => void;
  busy?: boolean;
  favBusy?: boolean;
  requireLogin?: boolean;
}

export default function RideCard({ ride, onJoin, onCancel, onToggleFavorite, busy, favBusy, requireLogin }: RideCardProps) {
  const full = ride.seatsTaken >= ride.seatsTotal;
  const seatsLeft = ride.seatsTotal - ride.seatsTaken;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={ride.driverName} size="sm" />
          <div>
            <div className="text-sm font-bold text-text">{ride.driverName}</div>
            {ride.driverRating ? (
              <StarRating value={ride.driverRating.average} count={ride.driverRating.count} showValue size={12} />
            ) : (
              <span className="text-xs text-text-muted">New driver</span>
            )}
          </div>
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={favBusy}
            aria-label={ride.isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="text-accent"
          >
            <Heart size={20} className={ride.isFavorited ? "fill-accent" : "fill-transparent"} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 font-display font-bold text-text text-[15px]">
        <span className="truncate">{ride.origin}</span>
        <ArrowRight size={14} className="text-text-muted shrink-0" />
        <span className="truncate">{ride.destination}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone={ride.type === "shared-taxi" ? "accent" : "primary"}>
          {ride.type === "shared-taxi" ? "Shared taxi" : "Student driver"}
        </Chip>
        <Chip tone="neutral" icon={<Clock3 size={11} />}>
          {new Date(ride.departureTime).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
        </Chip>
        <Chip tone="neutral" icon={<Users size={11} />}>
          {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
        </Chip>
      </div>

      {ride.myBooking && (
        <div className="bg-primary-light/60 rounded-2xl px-3 py-2 text-xs text-primary-dark font-semibold">
          Your pickup: {ride.myBooking.pickupPoint}
          {ride.myBooking.dropoffPoint && <> → {ride.myBooking.dropoffPoint}</>}
          {typeof ride.myBooking.fare === "number" && <> · ৳{ride.myBooking.fare}</>}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-lg font-extrabold text-text">৳{ride.farePerSeat}<span className="text-xs font-medium text-text-muted">/seat</span></span>
        {ride.myBooking ? (
          onCancel && (
            <Button variant="danger" size="sm" onClick={onCancel} loading={busy}>
              Cancel
            </Button>
          )
        ) : (
          onJoin && (
            <Button variant="primary" size="sm" onClick={onJoin} disabled={full} loading={busy}>
              {full ? "Full" : requireLogin ? "Log in to join" : "Join"}
            </Button>
          )
        )}
      </div>
    </Card>
  );
}
