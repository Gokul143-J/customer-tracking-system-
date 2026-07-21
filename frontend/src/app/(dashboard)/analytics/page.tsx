"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Activity,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  Clock,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { analyticsApi } from "@/lib/api";
import type { AnalyticsDashboard as Dash } from "@/types";
import { formatTime, prettySection } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await analyticsApi.dashboard();
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const iconMap: Record<number, React.ReactNode> = {
    0: <Users className="w-5 h-5" />,
    1: <Activity className="w-5 h-5" />,
    2: <IndianRupee className="w-5 h-5" />,
    3: <TrendingUp className="w-5 h-5" />,
  };
  const accents = [
    "bg-gold-500",
    "bg-emerald-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Live Dashboard</h1>
          <p className="text-sm text-ink-500 mt-1">
            Real-time showroom overview
          </p>
        </div>
        <button onClick={load} className="btn-outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="card p-4 text-red-600 bg-red-50 border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.metrics ?? []).map((m, i) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            trend={m.trend}
            is_positive={m.is_positive}
            icon={iconMap[i]}
            accent={accents[i]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-900 mb-4">
            Section Occupancy
          </h3>
          {!data || loading ? (
            <div className="text-ink-500 text-sm py-8 text-center">
              Loading…
            </div>
          ) : data.occupancy.length === 0 ? (
            <div className="text-ink-500 text-sm py-8 text-center">
              No active customers right now.
            </div>
          ) : (
            <div className="space-y-3">
              {data.occupancy.map((o) => {
                const max = Math.max(...data.occupancy.map((x) => x.count), 1);
                const pct = (o.count / max) * 100;
                return (
                  <div key={o.section}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-ink-700 font-medium">
                        {prettySection(o.section)}
                      </span>
                      <span className="text-ink-500">{o.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full bg-gold-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-900 mb-4">
            Recent Activity
          </h3>
          {!data || loading ? (
            <div className="text-ink-500 text-sm py-8 text-center">
              Loading…
            </div>
          ) : data.recent_activity.length === 0 ? (
            <div className="text-ink-500 text-sm py-8 text-center">
              No recent activity.
            </div>
          ) : (
            <ul className="space-y-3">
              {data.recent_activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-ink-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900">
                      {a.customer_name}{" "}
                      <span className="text-ink-500 font-normal">
                        — {a.action}
                      </span>
                    </div>
                    <div className="text-xs text-ink-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{a.ticket_number}</span>
                      <span>•</span>
                      <span>{formatTime(a.timestamp)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
