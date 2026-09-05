import { Mail, MessageCircle, Phone } from "lucide-react";
import { Avatar, BottomSheet, Button, Chip } from "../ui";
import type { RideBooking } from "../../lib/api";

interface PassengersSheetProps {
  open: boolean;
  onClose: () => void;
  bookings: RideBooking[];
  onMessage: (booking: RideBooking) => void;
}

export default function PassengersSheet({ open, onClose, bookings, onMessage }: PassengersSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={`${bookings.length} passenger${bookings.length === 1 ? "" : "s"}`}>
      <div className="flex flex-col gap-3">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-border/60 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={b.riderName} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-text truncate">{b.riderName}</div>
                <Chip tone="primary">{b.riderUniversity}</Chip>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <Mail size={13} className="shrink-0" />
                <span className="truncate">{b.riderEmail}</span>
              </div>
              {b.riderPhone && (
                <a href={`tel:${b.riderPhone}`} className="flex items-center gap-2 text-primary-dark underline underline-offset-2 w-fit">
                  <Phone size={13} className="shrink-0" /> {b.riderPhone}
                </a>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
              <span className="text-xs text-text-muted">
                {b.pickupPoint}
                {b.dropoffPoint && <> → {b.dropoffPoint}</>}
              </span>
              <span className="text-sm font-bold text-text shrink-0">৳{b.fare}</span>
            </div>

            <Button variant="outline" size="sm" icon={<MessageCircle size={14} />} onClick={() => onMessage(b)}>
              Message {b.riderName.split(" ")[0]}
            </Button>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
