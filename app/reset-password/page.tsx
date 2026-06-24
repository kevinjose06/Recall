"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { sendPasswordReset } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const targetEmail = "csa@rit.ac.in";

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await sendPasswordReset(targetEmail);
      setSuccess(`A password reset link has been sent to ${targetEmail}. Please check the inbox and follow the instructions to set your new password.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send password reset email. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-container--narrow" style={{ paddingTop: "24px" }}>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => router.back()}
        leftIcon={<BackIcon />}
        style={{ marginBottom: "20px" }}
      >
        Back
      </Button>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "8px", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Reset Password
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSendResetEmail} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "14px", 
            borderRadius: "var(--radius-lg)", 
            backgroundColor: "rgba(255, 255, 255, 0.03)", 
            border: "1px solid rgba(255, 255, 255, 0.08)" 
          }}>
            <div style={{ color: "var(--color-outline)", display: "flex" }}>
              <EmailIcon />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Target Account
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {targetEmail}
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-error-subtle)",
                border: "1px solid var(--color-error-border)",
                color: "var(--color-error)",
                fontSize: "0.875rem",
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(0, 200, 83, 0.08)",
                border: "1px solid rgba(0, 200, 83, 0.2)",
                color: "#00e676",
                fontSize: "0.875rem",
                lineHeight: "1.6",
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", alignItems: "center" }}>
            {!success ? (
              <Button type="submit" isLoading={isLoading} style={{ width: "100%" }}>
                Send Password Reset Email
              </Button>
            ) : (
              <Button type="button" onClick={() => router.push("/login")} style={{ width: "100%" }}>
                Back to Sign In
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
