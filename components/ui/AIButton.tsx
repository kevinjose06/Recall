"use client";

import * as React from "react";

interface AIButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: string; // material symbol name
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

export function AIButton({
  onClick,
  disabled = false,
  children,
  icon = "auto_awesome",
  size = "md",
  style,
}: AIButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const [iconAnimating, setIconAnimating] = React.useState(false);

  const padding =
    size === "sm" ? "9px 18px" : size === "lg" ? "13px 30px" : "11px 24px";
  const fontSize = size === "sm" ? "0.875rem" : size === "lg" ? "1rem" : "0.9375rem";
  const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 19;

  function handleMouseEnter() {
    if (disabled) return;
    setHovered(true);
    setIconAnimating(true);
    setTimeout(() => setIconAnimating(false), 600);
  }

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes _aibtn_border {
          0%   { background-position: 0% 50%;   }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%;   }
        }
        @keyframes _aibtn_shimmer {
          0%   { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%)  skewX(-18deg); }
        }
        @keyframes _aibtn_icon_pop {
          0%   { transform: scale(1)    rotate(0deg);  }
          30%  { transform: scale(1.35) rotate(-15deg);}
          60%  { transform: scale(1.35) rotate(15deg); }
          100% { transform: scale(1)    rotate(0deg);  }
        }
      `}</style>

      {/* Animated border ring */}
      <div
        style={{
          display: "inline-flex",
          borderRadius: 9999,
          padding: "1.5px",
          backgroundImage: disabled
            ? "none"
            : "linear-gradient(135deg, #a855f7, #ec4899, #6366f1, #a855f7)",
          backgroundColor: disabled ? "rgba(255,255,255,0.06)" : "transparent",
          backgroundSize: "250% 250%",
          backgroundRepeat: "no-repeat",
          animation: disabled ? "none" : "_aibtn_border 3.5s linear infinite",
          boxShadow: "none",
          transform: active
            ? "scale(0.97)"
            : hovered
            ? "translateY(-1.5px) scale(1.01)"
            : "none",
          transition: "transform 0.18s ease",
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
      >
        {/* Dark glass inner button */}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => { setHovered(false); }}
          onMouseDown={() => setActive(true)}
          onMouseUp={() => setActive(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: hovered ? "#1a1025" : "#0e0e12",
            color: hovered ? "#ffffff" : "#e9d5ff",
            fontWeight: 600,
            fontSize,
            fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
            padding,
            borderRadius: 9999,
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            position: "relative",
            overflow: "hidden",
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
            transition: "background-color 0.22s ease, color 0.22s ease",
            outline: "none",
          }}
        >
          {/* Shimmer sweep */}
          {hovered && !disabled && (
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "45%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
                animation: "_aibtn_shimmer 0.55s ease forwards",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Icon */}
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: iconSize,
              color: hovered ? "#f3e8ff" : "#c084fc",
              display: "inline-flex",
              flexShrink: 0,
              transition: "color 0.22s ease",
              animation: iconAnimating ? "_aibtn_icon_pop 0.55s ease" : "none",
            }}
          >
            {icon}
          </span>

          {children}
        </button>
      </div>
    </>
  );
}
