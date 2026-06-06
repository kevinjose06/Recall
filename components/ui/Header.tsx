"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import * as React from "react";

export function Header() {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/static-logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 24px 12px",
        backgroundColor: "transparent",
        position: "relative",
        zIndex: 100,
      }}
    >
      {/* Brand & Logo (Top Left Corner) */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "16px" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            textDecoration: "none",
          }}
        >
          <img
            src="/csa-logo.png?v=2"
            alt="CSA logo"
            width={56}
            height={56}
            style={{ objectFit: "contain", flexShrink: 0, filter: "brightness(0) invert(1)" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#f5f5eb",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Recall
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "rgba(245, 245, 235, 0.6)",
                lineHeight: 1,
                marginTop: "2px",
              }}
            >
              CSA · RIT Kottayam
            </span>
          </div>
        </Link>
      </div>

      {/* Action Area */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="slide-fill-btn hover-black-fill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            border: "1px solid transparent",
            backgroundColor: "#ffffff",
            color: signingOut ? "rgba(8, 72, 110, 0.48)" : "#08486e",
            fontSize: "0.9375rem",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            cursor: signingOut ? "not-allowed" : "pointer",
            transition: "border-color var(--transition-fast), color var(--transition-fast)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M13 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M9 14l4-4-4-4M2 10h11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
