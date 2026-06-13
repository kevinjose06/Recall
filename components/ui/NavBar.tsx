"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import * as React from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    matchPrefix: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/events/new",
    label: "New Event",
    matchPrefix: "/events/new",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function NavBar() {
  const pathname = usePathname();
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
    <nav
      aria-label="Member portal navigation"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "0",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <Image
            src="/csa-logo.png"
            alt="CSA logo"
            width={28}
            height={28}
            style={{ objectFit: "contain", height: "auto", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#e5e2e1",
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Recall
          </span>
        </Link>
        <p
          style={{
            fontSize: "0.6875rem",
            fontFamily: "var(--font-label)",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#8b90a0",
            marginTop: "4px",
            paddingLeft: "38px",
          }}
        >
          CSA · RIT Kottayam
        </p>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "12px 12px 0", overflowY: "auto" }}>
        <ul
          role="list"
          style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPrefix
              ? pathname.startsWith(item.matchPrefix)
              : pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.9375rem",
                    fontWeight: isActive ? 600 : 500,
                    /* primary token for active, on-surface-variant for inactive */
                    color: isActive ? "#aec6ff" : "#c1c6d7",
                    backgroundColor: isActive
                      ? "rgba(174, 198, 255, 0.10)"
                      : "transparent",
                    textDecoration: "none",
                    transition:
                      "background-color var(--transition-fast), color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.color = "#e5e2e1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#c1c6d7";
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sign out */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "var(--radius-full)",
            border: "none",
            backgroundColor: "transparent",
            color: signingOut ? "#8b90a0" : "#c1c6d7",
            fontSize: "0.9375rem",
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
            cursor: signingOut ? "not-allowed" : "pointer",
            transition:
              "background-color var(--transition-fast), color var(--transition-fast)",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            if (!signingOut) {
              e.currentTarget.style.backgroundColor = "rgba(255, 180, 171, 0.10)";
              e.currentTarget.style.color = "#ffb4ab";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = signingOut ? "#8b90a0" : "#c1c6d7";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
    </nav>
  );
}
