"use client";
import { useEffect } from "react";

export default function EventViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    try {
      let sessionId = localStorage.getItem("vybz_session");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("vybz_session", sessionId);
      }
      fetch("/api/events/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          session_id: sessionId,
          referrer: document.referrer || null,
        }),
      }).catch(() => {});
    } catch {
      // fail silently — tracking should never break the page
    }
  }, [eventId]);

  return null;
}
