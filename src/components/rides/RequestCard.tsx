import { type ReactNode } from "react";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { Card, Chip } from "../ui";
import type { RideRequest } from "../../lib/api";

const statusTone: Record<RideRequest["status"], "accent" | "primary" | "neutral"> = {
  open: "accent",
  fulfilled: "primary",
  cancelled: "neutral",
};

interface RequestCardProps {
  request: RideRequest;
  footer?: ReactNode;
}

export default function RequestCard({ request, footer }: RequestCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Chip tone={statusTone[request.status]}>{request.status}</Chip>
        <Chip tone="neutral" icon={<Clock3 size={11} />}>
          {new Date(request.desiredTime).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
        </Chip>
      </div>

      <div className="flex items-center gap-1.5 font-display font-bold text-text text-[15px]">
        <span className="truncate">{request.origin}</span>
        <ArrowRight size={14} className="text-text-muted shrink-0" />
        <span className="truncate">{request.destination}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Users size={12} />
        {request.seatsNeeded} seat{request.seatsNeeded === 1 ? "" : "s"} needed · started by {request.initiatorName} ·{" "}
        {request.university}
      </div>

      <div className="flex flex-col gap-1">
        {request.participants.map((p) => (
          <div key={p.id} className="text-xs text-text-muted bg-slate-50 rounded-xl px-3 py-1.5">
            <span className="font-semibold text-text">{p.riderName}</span>: {p.pickupPoint} → {p.dropoffPoint}
          </div>
        ))}
      </div>

      {footer}
    </Card>
  );
}
