"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface HistoryPoint {
  date: string;
  score: number;
}

export function ScoreHistory({ data }: { data: HistoryPoint[] }) {
  if (data.length < 2) return null;

  return (
    <section className="animate-fade-up" style={{ animationDelay: "300ms" }}>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted mb-4">
        Score History
      </h3>
      <div className="rounded-xl bg-bg-card border border-white/[0.06] p-4">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tick={{ fill: "#6B7280", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#6B7280", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#12121E",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#00E5A0"
              strokeWidth={2}
              dot={{ fill: "#00E5A0", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
