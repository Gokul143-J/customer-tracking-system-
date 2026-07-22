"use client";

import { useEffect, useState } from "react";
import {
  Users, Activity, IndianRupee, TrendingUp, TrendingDown, RefreshCw,
  Clock, MapPin, ShoppingBag, Eye, ArrowUpRight, ArrowDownRight,
  Calendar, Zap, Target, Gem, UserCheck,
} from "lucide-react";
import { dashboardApi } from "@/lib/supabase/database";
import { formatDateTime, formatTime, prettySection } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";

const CHART_COLORS = ["#D4AF37", "#6366f1", "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  async function load() {
    setLoading(true);
    try {
      const s = await dashboardApi.getStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    const c = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);

  const chartData = stats?.occupancy?.map((o: any) => ({
    name: prettySection(o.section),
    customers: o.count,
  })) || [];

  // Simulated weekly data for the area chart
  const weeklyData = [
    { day: "Mon", visitors: 45, sales: 12 },
    { day: "Tue", visitors: 52, sales: 18 },
    { day: "Wed", visitors: 38, sales: 9 },
    { day: "Thu", visitors: 61, sales: 22 },
    { day: "Fri", visitors: 75, sales: 31 },
    { day: "Sat", visitors: 92, sales: 45 },
    { day: "Sun", visitors: 68, sales: 28 },
  ];

  const metrics = [
    {
      label: "Total Customers",
      value: stats?.totalCustomers || 0,
      trend: "+12%",
      positive: true,
      icon: <Users className="w-5 h-5" />,
      gradient: "from-amber-400 to-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Active Tickets",
      value: stats?.activeTickets || 0,
      trend: "Live",
      positive: true,
      icon: <Activity className="w-5 h-5" />,
      gradient: "from-emerald-400 to-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Today's Visitors",
      value: stats?.todayTickets || 0,
      trend: "+8%",
      positive: true,
      icon: <UserCheck className="w-5 h-5" />,
      gradient: "from-indigo-400 to-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Revenue Today",
      value: `₹${(stats?.revenueToday || 0).toLocaleString("en-IN")}`,
      trend: "+15%",
      positive: true,
      icon: <IndianRupee className="w-5 h-5" />,
      gradient: "from-rose-400 to-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Welcome back, <span className="text-amber-600">Admin</span> 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening in your showroom today.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-300 hover:shadow-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, i) => (
          <div key={m.label} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.06] transition-opacity -translate-x-8 -translate-y-8" style={{ background: `var(--tw-gradient-stops)` }} />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">{m.label}</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{m.value}</div>
                <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${m.positive ? "text-emerald-600" : "text-red-600"}`}>
                  {m.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {m.trend} <span className="text-gray-400 font-normal">vs last week</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} text-white flex items-center justify-center shadow-lg`}>
                {m.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Traffic */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Weekly Overview</h3>
              <p className="text-xs text-gray-500 mt-0.5">Visitors & sales performance</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" /> Visitors
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-indigo-400" /> Sales
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Area type="monotone" dataKey="visitors" stroke="#D4AF37" strokeWidth={2.5} fill="url(#colorVisitors)" />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Section Occupancy Pie */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Section Occupancy</h3>
          <p className="text-xs text-gray-500 mb-4">Live customer distribution</p>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
              No active customers right now
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={chartData} dataKey="customers" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={3} label={(e: any) => `${e.name} (${e.customers})`} labelLine={false}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Activities</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{stats?.recentActivity?.length || 0} entries</span>
          </div>
          {!stats?.recentActivity?.length ? (
            <div className="text-center py-10 text-gray-400 text-sm">No recent activities</div>
          ) : (
            <ul className="space-y-3">
              {stats.recentActivity.slice(0, 8).map((a: any, i: number) => (
                <li key={a.id || i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.status === "ACTIVE" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {a.customer?.name || "Customer"}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-amber-600">{a.ticket_number}</span>
                      <span>•</span>
                      <span className="capitalize">{prettySection(a.current_section)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {a.status}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">{formatTime(a.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Stats / Live Clock */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#1a1520] to-[#0f0a1a] p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-wider text-amber-400/70 font-semibold">Live Clock</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">Live</span>
                </div>
              </div>
              <div className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {time.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
                <div>
                  <div className="text-2xl font-bold text-amber-400">{stats?.activeTickets || 0}</div>
                  <div className="text-xs text-gray-500">In Store</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{stats?.todayTickets || 0}</div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-400">{stats?.totalCustomers || 0}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Sections */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Top Sections</h3>
            {!chartData.length ? (
              <div className="text-center py-6 text-gray-400 text-sm">No data available</div>
            ) : (
              <div className="space-y-3">
                {chartData.slice(0, 5).map((item: any, i: number) => {
                  const maxVal = Math.max(...chartData.map((d: any) => d.customers), 1);
                  const pct = (item.customers / maxVal) * 100;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-gray-500 font-semibold">{item.customers}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
