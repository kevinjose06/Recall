"use client";

import * as React from "react";
import { CopyButton } from "@/components/ui/CopyButton";

interface ParticipantLinkShareProps {
  eventId: string;
}

export function ParticipantLinkShare({ eventId }: ParticipantLinkShareProps) {
  const [origin, setOrigin] = React.useState("https://csa-feedback.vercel.app");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullUrl = `${origin}/respond/${eventId}`;

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "stretch", width: "100%" }}>
      <div style={{ flex: 1, minWidth: "240px" }}>
        <input
          id="participant-link"
          className="input-glow"
          style={{
            width: "100%",
            backgroundColor: "var(--color-surface-container-lowest)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "var(--color-on-surface)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.875rem",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            outline: "none",
            transition: "border-color var(--transition-base)",
          }}
          readOnly
          type="text"
          value={fullUrl}
        />
      </div>
      <CopyButton text={fullUrl} label="Copy link" />
    </div>
  );
}
