import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Metric } from "@/lib/supabase";
import { Scale, Clock, Activity } from "lucide-react";

interface MetricTrendChartProps {
  metrics: Metric[];
  metricKey: string;
  title: string;
  unit: string;
  color: string;
}

export function MetricTrendChart({ metrics, metricKey, title, unit, color }: MetricTrendChartProps) {
  const chartData = metrics
    .filter((m) => m.key === metricKey && m.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10) // Últimos 10 registros
    .map((m) => ({
      date: m.date.slice(5), // MM-DD
      valor: m.value,
    }));

  if (chartData.length < 2) return null;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: `${color}20`, color }}>
            {metricKey === "weight" ? <Scale size={18} /> : <Clock size={18} />}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground font-medium">Evolução do histórico</p>
          </div>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-card p-2.5 shadow-xl border border-border text-xs">
                      <p className="font-bold text-foreground">{data.date}: <span style={{ color }}>{data.valor} {unit}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={3} dot={{ fill: color, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
