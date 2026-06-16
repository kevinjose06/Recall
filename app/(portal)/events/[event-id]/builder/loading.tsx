import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function BuilderLoading() {
  return (
    <div className="page-container pb-32 animate-fade-slide-up">
      {/* Back to event button skeleton */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
          disabled
        >
          Back to event
        </Button>
      </div>

      {/* Header section skeleton */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="skeleton" style={{ width: "240px", height: "32px", borderRadius: "var(--radius-md)", marginBottom: "8px" }} />
          <div className="skeleton" style={{ width: "320px", height: "16px", borderRadius: "var(--radius-sm)" }} />
        </div>
        
        {/* Save button skeleton */}
        <div className="flex gap-3">
          <Button variant="primary" disabled>
            Save changes
          </Button>
        </div>
      </div>

      {/* Main Builder Area Skeleton */}
      <div className="flex flex-col gap-6">
        {/* Skeleton Questions */}
        {[1, 2].map((i) => (
          <Card key={i} padding="lg">
            {/* Question Drag Handle & Type Skeleton */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-outline)]">drag_indicator</span>
                <div className="skeleton" style={{ width: "120px", height: "20px", borderRadius: "var(--radius-sm)" }} />
              </div>
              <div className="skeleton" style={{ width: "140px", height: "40px", borderRadius: "var(--radius-md)" }} />
            </div>

            {/* Question Input Skeleton */}
            <div className="mb-6">
              <div className="skeleton" style={{ width: "100%", height: "46px", borderRadius: "var(--radius-md)" }} />
            </div>

            {/* Options Skeleton (if MCQ/Single Choice) */}
            <div className="flex flex-col gap-3 ml-4 border-l-2 border-white/5 pl-4">
              {[1, 2, 3].map((opt) => (
                <div key={opt} className="flex items-center gap-3">
                  <div className="skeleton" style={{ width: "16px", height: "16px", borderRadius: "var(--radius-full)" }} />
                  <div className="skeleton" style={{ width: "180px", height: "40px", borderRadius: "var(--radius-md)" }} />
                </div>
              ))}
              <div className="mt-2">
                <Button variant="ghost" size="sm" disabled leftIcon={<span className="material-symbols-outlined text-sm">add</span>}>
                  Add option
                </Button>
              </div>
            </div>
            
            {/* Action Bar Skeleton */}
            <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-white/5">
              <div className="skeleton" style={{ width: "40px", height: "24px", borderRadius: "var(--radius-full)" }} />
              <div className="w-px h-6 bg-white/10" />
              <Button variant="ghost" size="sm" disabled>
                <span className="material-symbols-outlined text-[var(--color-outline)]">delete</span>
              </Button>
            </div>
          </Card>
        ))}

        {/* Add Question Button Skeleton */}
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="lg" disabled leftIcon={<span className="material-symbols-outlined">add</span>}>
            Add Question
          </Button>
        </div>
      </div>
    </div>
  );
}
