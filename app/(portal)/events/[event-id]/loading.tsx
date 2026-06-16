import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function EventDetailLoading() {
  return (
    <div className="page-container animate-fade-slide-up">
      {/* Back nav skeleton */}
      <div style={{ marginBottom: "24px" }}>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
          disabled
        >
          All events
        </Button>
      </div>

      {/* Event header skeleton */}
      <Card padding="lg" style={{ marginBottom: "24px" }}>
        <header>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
            <div className="skeleton" style={{ width: "80px", height: "24px", borderRadius: "var(--radius-full)" }} />
            <div className="skeleton" style={{ width: "120px", height: "18px", borderRadius: "var(--radius-sm)" }} />
          </div>
          <div className="skeleton" style={{ width: "70%", height: "36px", borderRadius: "var(--radius-md)", marginBottom: "12px", marginTop: "4px" }} />
          <div className="skeleton" style={{ width: "90%", height: "18px", borderRadius: "var(--radius-sm)", marginBottom: "8px" }} />
          <div className="skeleton" style={{ width: "60%", height: "18px", borderRadius: "var(--radius-sm)" }} />
        </header>
      </Card>

      {/* Stats row skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Responses Stat Skeleton */}
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div className="skeleton" style={{ width: "80px", height: "14px", borderRadius: "var(--radius-sm)" }} />
            <span className="material-symbols-outlined" style={{ color: "var(--color-outline)" }}>
              groups
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <div className="skeleton" style={{ width: "64px", height: "56px", borderRadius: "var(--radius-md)" }} />
            <div className="skeleton" style={{ width: "40px", height: "14px", borderRadius: "var(--radius-sm)" }} />
          </div>
        </Card>

        {/* Questions Stat Skeleton */}
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div className="skeleton" style={{ width: "80px", height: "14px", borderRadius: "var(--radius-sm)" }} />
            <span className="material-symbols-outlined" style={{ color: "var(--color-outline)" }}>
              help_center
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <div className="skeleton" style={{ width: "64px", height: "56px", borderRadius: "var(--radius-md)" }} />
            <div className="skeleton" style={{ width: "40px", height: "14px", borderRadius: "var(--radius-sm)" }} />
          </div>
        </Card>
      </div>

      {/* Quick actions skeleton */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center", marginBottom: "24px" }}>
        <Button
          variant="primary"
          leftIcon={<span className="material-symbols-outlined text-lg">edit_document</span>}
          disabled
        >
          Questionnaire builder
        </Button>
        <Button
          variant="secondary-light"
          leftIcon={<span className="material-symbols-outlined text-lg">table_chart</span>}
          disabled
        >
          View responses
        </Button>
      </div>

      {/* Participant link card skeleton */}
      <Card padding="lg">
        <div style={{ marginBottom: "20px" }}>
          <div className="skeleton" style={{ width: "160px", height: "24px", borderRadius: "var(--radius-md)", marginBottom: "8px" }} />
          <div className="skeleton" style={{ width: "80%", height: "16px", borderRadius: "var(--radius-sm)" }} />
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <div className="skeleton" style={{ width: "100%", height: "46px", borderRadius: "var(--radius-md)" }} />
          </div>
          <Button variant="secondary" disabled>
            Copy link
          </Button>
        </div>
      </Card>
    </div>
  );
}
