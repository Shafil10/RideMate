import type { RideBooking } from "../../lib/api";

interface FareBreakdownProps {
  bookings: RideBooking[];
}

export default function FareBreakdown({ bookings }: FareBreakdownProps) {
  const total = bookings.reduce((sum, b) => sum + b.fare, 0);

  return (
    <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 mt-1">
      {bookings.map((b) => (
        <div key={b.id} className="flex items-center justify-between text-xs gap-3">
          <span className="text-text-muted truncate">
            {b.riderName}: {b.pickupPoint}
            {b.dropoffPoint && <> → {b.dropoffPoint}</>}
          </span>
          <span className="font-semibold text-text shrink-0">৳{b.fare}</span>
        </div>
      ))}
      <div className="flex items-center justify-between text-sm font-bold text-text pt-1">
        <span>Total</span>
        <span>৳{total}</span>
      </div>
    </div>
  );
}
