import { type ReactNode } from "react";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { Card, Chip } from "../ui";
import type { RideRequest } from "../../lib/api";
import { haversineKm, estimateFairFare } from "../../lib/geo";

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
  const joined = request.participants.length;
  const spotsLeft = Math.max(0, request.maxParticipants - joined);

  const fare = (() => {
    if (request.originLat === null || request.originLng === null || request.destLat === null || request.destLng === null) {
      return null;
    }
    const distanceKm = haversineKm(request.originLat, request.originLng, request.destLat, request.destLng);
    const total = estimateFairFare(distanceKm, new Date(request.desiredTime));
    const perPerson = Math.round(total / Math.max(1, joined));
    return { total, perPerson };
  })();

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
        {joined} joined so far
        {request.status === "open" && (spotsLeft > 0 ? <> · up to {spotsLeft} more can join</> : <> · pool full</>)} · started by{" "}
        {request.initiatorName} · {request.university}
      </div>

      {fare && (
        <div className="text-xs text-primary-dark bg-primary-light/60 rounded-xl px-3 py-1.5 font-medium">
          Approx ৳{fare.total} total for the trip · ~৳{fare.perPerson}/person split {joined} way{joined === 1 ? "" : "s"} right now
          {spotsLeft > 0 && " — cheaper per person as more join"}
        </div>
      )}

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
