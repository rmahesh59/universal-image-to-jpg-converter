import type { CSSProperties } from "react";

export type CelebrationKind = "start" | "success" | "duplicate";

export interface CelebrationEvent {
  id: string;
  kind: CelebrationKind;
  title: string;
  message: string;
}

interface EventCelebrationProps {
  events: CelebrationEvent[];
  onDismiss: (id: string) => void;
}

const burstPieces = Array.from({ length: 14 }, (_, index) => index);

export function EventCelebration({ events, onDismiss }: EventCelebrationProps) {
  if (events.length === 0) return null;

  return (
    <div className="celebration-layer" aria-live="polite" aria-atomic="true">
      {events.map((event) => (
        <div key={event.id} className={`celebration-toast celebration-${event.kind}`}>
          <div className="celebration-burst" aria-hidden="true">
            {burstPieces.map((piece) => (
              <span
                key={piece}
                className="burst-piece"
                style={{ "--piece-index": piece } as CSSProperties}
              />
            ))}
          </div>
          <div className="celebration-copy">
            <div className="celebration-tag">
              {event.kind === "start"
                ? "Job Started"
                : event.kind === "success"
                  ? "Completed"
                  : "Duplicate Alert"}
            </div>
            <h3>{event.title}</h3>
            <p>{event.message}</p>
          </div>
          <button
            type="button"
            className="celebration-close"
            onClick={() => onDismiss(event.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
