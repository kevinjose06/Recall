"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 9V6a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="1.25" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/static-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      setError("Incorrect email or password. Please check with your tech lead.");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo + title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            marginBottom: "36px",
          }}
        >
          <img
            src="/csa-logo.png?v=2"
            alt="CSA logo"
            width={120}
            height={120}
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />

          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#f5f5eb",
              letterSpacing: "-0.02em",
            }}
          >
            Sign in to Recall
          </h1>
        </div>

        {/* Form card — light cream */}
        <div
          style={{
            backgroundColor: "rgba(245, 245, 235, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(8, 72, 110, 0.22)",
            borderRadius: "var(--radius-xl)",
            padding: "32px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(8, 72, 110, 0.15)",
            // Local color overrides for readability on the light mint card
            color: "#08486e",
            ["--color-text-primary" as any]: "#08486e",
            ["--color-text-secondary" as any]: "rgba(8, 72, 110, 0.85)",
            ["--color-text-muted" as any]: "rgba(8, 72, 110, 0.65)",
            ["--color-border" as any]: "rgba(8, 72, 110, 0.18)",
            ["--color-button-bg" as any]: "#000000",
            ["--color-button-text" as any]: "#f5f5eb",
          }}
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <Input
              label="Association email"
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="csa@ritkerala.ac.in"
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              disabled={isLoading}
            />

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-error-subtle)",
                  border: "1px solid var(--color-error-border)",
                  color: "var(--color-error)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              style={{ width: "100%", marginTop: "4px" }}
              leftIcon={!isLoading ? <LockIcon /> : undefined}
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
