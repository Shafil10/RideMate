import { Phone } from "lucide-react";
import type { RideBooking } from "../../lib/api";

interface FareBreakdownProps {
  bookings: RideBooking[];
}

export default function FareBreakdown({ bookings }: FareBreakdownProps) {
  const total = bookings.reduce((sum, b) => sum + b.fare, 0);

  return (
    <div className="flex flex-col gap-2 border-t border-border/60 pt-3 mt-1">
      {bookings.map((b) => (
        <div key={b.id} className="flex items-center justify-between text-xs gap-3">
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-text-muted truncate">
              <span className="font-semibold text-text">{b.riderName}</span>: {b.pickupPoint}
              {b.dropoffPoint && <> → {b.dropoffPoint}</>}
            </span>
            {b.riderPhone && (
              <a href={`tel:${b.riderPhone}`} className="flex items-center gap-1 text-primary-dark underline underline-offset-2 w-fit">
                <Phone size={10} /> {b.riderPhone}
              </a>
            )}
          </div>
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
