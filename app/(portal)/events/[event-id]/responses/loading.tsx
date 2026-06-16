import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ResponsesLoading() {
  return (
    <div className="page-container animate-fade-slide-up">
      {/* Header Context Skeleton */}
      <div style={{ marginBottom: "24px" }}>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
          disabled
        >
          <div className="skeleton" style={{ width: "100px", height: "14px", borderRadius: "var(--radius-sm)" }} />
        </Button>
      </div>
      
      <Card padding="lg" style={{ marginBottom: "24px" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="skeleton" style={{ width: "180px", height: "32px", borderRadius: "var(--radius-md)", marginBottom: "8px" }} />
            <div className="skeleton" style={{ width: "240px", height: "16px", borderRadius: "var(--radius-sm)" }} />
          </div>
          <div className="text-left md:text-right">
            <div className="skeleton" style={{ width: "64px", height: "56px", borderRadius: "var(--radius-md)", marginBottom: "4px" }} />
            <div className="skeleton" style={{ width: "100px", height: "12px", borderRadius: "var(--radius-sm)" }} />
          </div>
        </div>
      </Card>

      {/* Per-question analytics bento grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Single Choice Donut Skeleton */}
        <section className="skeleton-glass-panel p-6 lg:col-span-5 flex flex-col gap-6 relative group overflow-hidden">
          <header>
            <div className="skeleton" style={{ width: "120px", height: "16px", borderRadius: "var(--radius-sm)", marginBottom: "8px" }} />
            <div className="skeleton" style={{ width: "80%", height: "24px", borderRadius: "var(--radius-md)" }} />
          </header>
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center flex-1">
            <div className="skeleton" style={{ width: "160px", height: "160px", borderRadius: "50%", flexShrink: 0 }} />
            <div className="flex flex-col gap-4 w-full md:w-auto flex-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="skeleton" style={{ width: "60%", height: "14px", borderRadius: "var(--radius-sm)" }} />
                  <div className="skeleton" style={{ width: "32px", height: "14px", borderRadius: "var(--radius-sm)" }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Multiple Choice Bar Skeleton */}
        <section className="skeleton-glass-panel p-6 lg:col-span-7 flex flex-col gap-6 relative group overflow-hidden">
          <header>
            <div className="skeleton" style={{ width: "140px", height: "16px", borderRadius: "var(--radius-sm)", marginBottom: "8px" }} />
            <div className="skeleton" style={{ width: "80%", height: "24px", borderRadius: "var(--radius-md)" }} />
          </header>
          <div className="flex flex-col gap-6 justify-center flex-1 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <div className="skeleton" style={{ width: "40%", height: "14px", borderRadius: "var(--radius-sm)" }} />
                  <div className="skeleton" style={{ width: "32px", height: "14px", borderRadius: "var(--radius-sm)" }} />
                </div>
                <div className="skeleton" style={{ width: i === 1 ? "80%" : i === 2 ? "45%" : "20%", height: "12px", borderRadius: "var(--radius-full)" }} />
              </div>
            ))}
          </div>
        </section>

        {/* Scrollable List Skeleton */}
        <section className="skeleton-glass-panel p-6 lg:col-span-12 flex flex-col gap-6 relative group h-[400px]">
          <header className="flex-shrink-0">
            <div className="skeleton" style={{ width: "100px", height: "16px", borderRadius: "var(--radius-sm)", marginBottom: "8px" }} />
            <div className="skeleton" style={{ width: "60%", height: "24px", borderRadius: "var(--radius-md)" }} />
          </header>
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--color-bg-lowest)] border border-white/5 p-4 rounded-lg flex flex-col gap-2">
                <div className="skeleton" style={{ width: "90%", height: "14px", borderRadius: "var(--radius-sm)" }} />
                <div className="skeleton" style={{ width: i % 2 === 0 ? "70%" : "40%", height: "14px", borderRadius: "var(--radius-sm)" }} />
                <div className="skeleton" style={{ width: "80px", height: "10px", borderRadius: "var(--radius-sm)", marginTop: "4px" }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
