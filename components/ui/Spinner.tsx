export function Spinner({
  size = 20,
  color = "var(--color-accent)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      role="img"
      aria-label="Loading"
      style={{ animation: "recall-spin 0.75s linear infinite" }}
    >
      <style>{`@keyframes recall-spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="10"
        cy="10"
        r="7.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="35"
        strokeDashoffset="12"
        opacity="0.3"
      />
      <path
        d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "240px",
      }}
    >
      <Spinner size={28} />
    </div>
  );
}
