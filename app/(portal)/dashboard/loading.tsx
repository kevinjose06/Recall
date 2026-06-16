import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardLoading() {
  // Mock 3 skeleton cards
  const skeletonCards = [1, 2, 3];

  return (
    <div className="page-container animate-fade-slide-up">
      {/* Page header skeleton */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="skeleton" style={{ width: "120px", height: "32px", marginBottom: "8px", borderRadius: "var(--radius-md)" }} />
          <div className="skeleton" style={{ width: "80px", height: "18px", borderRadius: "var(--radius-sm)" }} />
        </div>
        <Button leftIcon={<PlusIcon />} disabled>
          New event
        </Button>
      </div>

      {/* Events list skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {skeletonCards.map((i) => (
          <Card key={i} interactive padding="md">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {/* Left: info */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Event Type Badge Skeleton */}
                <div className="skeleton" style={{ width: "90px", height: "24px", borderRadius: "var(--radius-full)", marginBottom: "4px" }} />
                
                {/* Title Skeleton */}
                <div className="skeleton" style={{ width: "60%", height: "22px", borderRadius: "var(--radius-sm)", marginBottom: "4px" }} />
                
                {/* Description Skeletons */}
                <div className="skeleton" style={{ width: "80%", height: "16px", borderRadius: "var(--radius-sm)" }} />
                <div className="skeleton" style={{ width: "50%", height: "16px", borderRadius: "var(--radius-sm)", marginBottom: "4px" }} />
                
                {/* Meta details Skeleton (Dates & Responses) */}
                <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                  <div className="skeleton" style={{ width: "120px", height: "16px", borderRadius: "var(--radius-sm)" }} />
                  <div className="skeleton" style={{ width: "80px", height: "16px", borderRadius: "var(--radius-sm)" }} />
                </div>
              </div>

              {/* Chevron Skeleton */}
              <div
                style={{
                  flexShrink: 0,
                  paddingTop: "2px",
                }}
              >
                <div className="skeleton" style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)" }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
