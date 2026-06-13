"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type {
  SingleChoiceAnalytics,
  MCQAnalytics,
  ShortTextAnalytics,
  Question,
} from "@/lib/types";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

// ─── Pie chart ────────────────────────────────────────────────

export function SingleChoiceChart({
  data,
  question,
}: {
  data: SingleChoiceAnalytics[];
  question: Question;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            paddingAngle={2}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                stroke="var(--color-bg-surface)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value} response${value !== 1 ? "s" : ""} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "rgba(17, 17, 17, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              color: "#e5e2e1",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.8125rem", color: "#c1c6d7" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p
        style={{
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "var(--color-outline)",
          marginTop: "8px",
        }}
      >
        {total} total response{total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Bar chart ─────────────────────────────────────────────────

export function MCQChart({
  data,
  question,
}: {
  data: MCQAnalytics[];
  question: Question;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-outline)",
          marginBottom: "12px",
          fontStyle: "italic",
        }}
      >
        Option selections — one respondent may select multiple options.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="rgba(255, 255, 255, 0.06)"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#8b90a0" }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="option"
            width={120}
            tick={{ fontSize: 12, fill: "#c1c6d7" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) =>
              v.length > 16 ? v.slice(0, 14) + "…" : v
            }
          />
          <Tooltip
            formatter={(value: number) => [
              `${value} selection${value !== 1 ? "s" : ""}`,
              "Count",
            ]}
            contentStyle={{
              backgroundColor: "rgba(17, 17, 17, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              color: "#e5e2e1",
            }}
          />
          <Bar
            dataKey="count"
            fill="var(--color-chart-1)"
            radius={[0, 4, 4, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Text list ─────────────────────────────────────────────────

export function ShortTextList({
  data,
  question,
}: {
  data: ShortTextAnalytics[];
  question: Question;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxHeight: "400px",
        overflowY: "auto",
        paddingRight: "4px",
      }}
    >
      {data.length === 0 ? (
        <p style={{ color: "var(--color-outline)", fontSize: "0.9rem", textAlign: "center", padding: "24px 0" }}>
          No responses yet.
        </p>
      ) : (
        data.map((item, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              backgroundColor: "rgba(174, 198, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                color: "#e5e2e1",
                marginBottom: "6px",
                lineHeight: 1.6,
              }}
            >
              {item.text}
            </p>
            <time
              dateTime={item.submitted_at}
              style={{
                fontSize: "0.75rem",
                color: "var(--color-outline)",
              }}
            >
              {new Date(item.submitted_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        ))
      )}
    </div>
  );
}
