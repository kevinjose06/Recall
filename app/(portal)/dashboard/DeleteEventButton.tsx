"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { deleteEventAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDeleting(true);
    try {
      await deleteEventAction(eventId);
      setShowConfirm(false); // Only close if successful, or it will unmount anyway
    } catch (err) {
      console.error("Failed to delete event:", err);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        disabled={isDeleting}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--color-error)",
          cursor: isDeleting ? "not-allowed" : "pointer",
          padding: "8px",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color var(--transition-fast), opacity var(--transition-fast)",
          opacity: isDeleting ? 0.5 : 1,
        }}
        aria-label="Delete event"
        title="Delete event"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>

      {showConfirm && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onClick={handleCancel}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card padding="lg" style={{ 
              maxWidth: "420px", 
              width: "100%", 
              borderColor: "rgba(255, 180, 171, 0.2)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 180, 171, 0.05)"
            }}>
              
              {/* Premium Icon Header */}
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, rgba(147, 0, 10, 0.2) 0%, rgba(255, 180, 171, 0.05) 100%)",
                border: "1px solid rgba(255, 180, 171, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                color: "var(--color-error)",
                boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>

              <h3 style={{ 
                marginTop: 0, 
                color: "var(--color-on-surface)", 
                fontSize: "1.25rem", 
                fontWeight: 600,
                letterSpacing: "-0.01em",
                marginBottom: "8px" 
              }}>
                Delete this event?
              </h3>
              
              <p style={{ 
                color: "var(--color-text-secondary)", 
                marginBottom: "28px", 
                fontSize: "0.9375rem",
                lineHeight: 1.5
              }}>
                This action cannot be undone. This will permanently delete the event and remove all associated participant responses.
              </p>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "20px" }}>
                <Button variant="ghost" onClick={handleCancel} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleConfirm} isLoading={isDeleting}>
                  Yes, delete event
                </Button>
              </div>
            </Card>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
