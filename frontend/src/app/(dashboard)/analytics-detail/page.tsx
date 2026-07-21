"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  RefreshCw,
  Users,
  ShoppingBag,
  IndianRupee,
  Clock,
} from "lucide-react";
import { analyticsApi, salesApi } from "@/lib/api";
import MetricCard from "@/components/MetricCard";
import { prettySection } from "@/lib/utils";

const COLORS = ["#D4AF37", "#B7922C", "#FBBF24", "#92701E", "#FCD34D", "#6B5115", "#45320B", "#F59E0B"];

export default function AnalyticsDetail() {
  const [dash, setDash] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        analyticsApi.dashboard(),
        salesApi.list().catch(() => []),
      ]);
      setDash(d);
      setSales(s as any[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const occupancyData =
    dash?.occupancy?.map((o: any) => ({
      name: prettySection(o.section),
      value: o.count,
    })) || [];

  // Last 7 days sales aggregation (very simple: group by day from created_at)
  const today = new Date();
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { date: d, total: 0, label: d.toLocaleDateString([], { weekday: "short" }) };
  });
  sales.forEach((s) => {
    const d = new Date(s.created_at);
    last7.forEach((b) => {
      if (d.toDateString() === b.date.toDateString()) {
        b.total += Number(s.final_amount || 0);
      }
    });
  });
  const chartData = last7.map((b) => ({ day: b.label, revenue: b.total }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Analytics</h1>
          <p className="text-sm text-ink-500 mt-1">
            Footfall, conversions, section performance, revenue.
          </p>
        </div>
        <button onClick={load} className="btn-outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Footfall Today"
          value={dash?.metrics?.[0]?.value || "0"}
          trend={dash?.metrics?.[0]?.trend}
          is_positive={dash?.metrics?.[0]?.is_positive}
          icon={<Users className="w-5 h-5" />}
          accent="bg-gold-500"
        />
        <MetricCard
          label="In-Store Now"
          value={dash?.metrics?.[1]?.value || "0"}
          trend="Live"
          is_positive
          icon={<Clock className="w-5 h-5" />}
          accent="bg-emerald-500"
        />
        <MetricCard
          label="Revenue Today"
          value={dash?.metrics?.[2]?.value || "₹0"}
          icon={<IndianRupee className="w-5 h-5" />}
          accent="bg-indigo-500"
        />
        <MetricCard
          label="Conversion"
          value={dash?.metrics?.[3]?.value || "0%"}
          trend={dash?.metrics?.[3]?.trend}
          icon={<ShoppingBag className="w-5 h-5" />}
          accent="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold-500" /> Revenue (Last 7 days)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                formatter={(v: any) => [
                  `₹${Number(v).toLocaleString("en-IN")}`,
                  "Revenue",
                ]}
              />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-500" /> Section Occupancy
          </h3>
          {occupancyData.length === 0 ? (
            <div className="text-sm text-ink-500 text-center py-12">
              No active customers right now.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(e: any) => e.name}
                >
                  {occupancyData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
