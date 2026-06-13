"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
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
        padding: "24px 20px 0",
        backgroundColor: "transparent",
      }}
    >

      {/* Brand */}
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <img
          src="/csa-logo.png?v=2"
          alt="CSA logo"
          width={36}
          height={36}
          style={{
            objectFit: "contain",
            filter: "brightness(0) invert(1)",
            opacity: 1,
          }}
        />
        <span
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#e5e2e1",
            letterSpacing: "-0.02em",
          }}
        >
          Recall
        </span>
      </Link>


      {/* Sign out */}
      <Button
        type="button"
        variant="primary"
        onClick={handleSignOut}
        disabled={signingOut}
        isLoading={signingOut}
        leftIcon={
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
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
        }
      >
        Sign out
      </Button>
    </header>
  );
}



