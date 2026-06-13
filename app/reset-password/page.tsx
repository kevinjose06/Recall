"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { reAuthAndChangePassword } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await reAuthAndChangePassword(currentPassword, newPassword);
      setSuccess("Password successfully changed! Distribute the new password to members via college email.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to change password. Make sure you are logged in.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-container--narrow" style={{ paddingTop: "0px" }}>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => router.back()}
        leftIcon={<BackIcon />}
        style={{ marginBottom: "12px" }}
      >
        Back
      </Button>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Change Association Password
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          This will change the shared password for the `csa@ritkerala.ac.in` account. You must enter the current password to authorize this change.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={isLoading || !!success}
          />

          <div style={{ height: "1px", background: "var(--color-outline)", opacity: 0.2, margin: "8px 0" }} />

          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading || !!success}
          />

          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading || !!success}
          />

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
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="alert"
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(0, 200, 83, 0.1)",
                border: "1px solid rgba(0, 200, 83, 0.3)",
                color: "#00e676",
                fontSize: "0.875rem",
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
            {!success && (
              <Button type="submit" isLoading={isLoading}>
                Change password
              </Button>
            )}
            {success && (
              <Button type="button" onClick={() => router.push("/dashboard")}>
                Return to dashboard
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
