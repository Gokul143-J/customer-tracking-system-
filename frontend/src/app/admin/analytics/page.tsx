"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart3, RefreshCw, Users, ShoppingBag, IndianRupee, Clock,
  Target, Calendar,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { dashboardApi, salesApi, ticketsApi, movementsApi } from "@/lib/supabase/database";
import { prettySection, formatDateTime } from "@/lib/utils";

const COLORS = ["#D4AF37", "#6366f1", "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4"];

const PERIODS = [
  { key: "day", label: "Today", icon: Calendar },
  { key: "week", label: "This Week", icon: Calendar },
  { key: "month", label: "This Month", icon: Calendar },
  { key: "year", label: "This Year", icon: Calendar },
];

function getDateRange(period: string) {
  const now = new Date();
  const start = new Date(now);
  if (period === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return { start: start.toISOString(), end: now.toISOString() };
}

function buildRevenueChart(sales: any[], period: string) {
  const now = new Date();
  const range = getDateRange(period);
  const filtered = sales.filter((s) => s.created_at >= range.start && s.created_at <= range.end);

  if (period === "day") {
    // Hourly buckets (0-23)
    const buckets: { time: string; revenue: number }[] = [];
    for (let h = 0; h < 24; h += 2) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      const rev = filtered
        .filter((s) => {
          const d = new Date(s.created_at);
          return d.getHours() >= h && d.getHours() < h + 2;
        })
        .reduce((sum, s) => sum + Number(s.final_amount || 0), 0);
      buckets.push({ time: label, revenue: rev });
    }
    return buckets;
  } else if (period === "week") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, i) => {
      const rev = filtered.filter((s) => {
        const d = new Date(s.created_at);
        const dow = d.getDay();
        const adj = dow === 0 ? 6 : dow - 1;
        return adj === i;
      }).reduce((sum, s) => sum + Number(s.final_amount || 0), 0);
      return { day, revenue: rev };
    });
  } else if (period === "month") {
    const buckets: { day: string; revenue: number }[] = [];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d += Math.ceil(daysInMonth / 15)) {
      const rev = filtered.filter((s) => {
        const dt = new Date(s.created_at);
        return dt.getDate() >= d && dt.getDate() < d + Math.ceil(daysInMonth / 15);
      }).reduce((sum, s) => sum + Number(s.final_amount || 0), 0);
      buckets.push({ day: `Day ${d}`, revenue: rev });
    }
    return buckets;
  } else {
    // Year: monthly buckets
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m, i) => {
      const rev = filtered.filter((s) => new Date(s.created_at).getMonth() === i)
        .reduce((sum, s) => sum + Number(s.final_amount || 0), 0);
      return { month: m, revenue: rev };
    });
  }
}

export default function AdminAnalytics() {
  const [sales, setSales] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

  async function load() {
    setLoading(true);
    try {
      const [d, s, t, m] = await Promise.all([
        dashboardApi.getStats(),
        salesApi.list().catch(() => []),
        ticketsApi.list().catch(() => []),
        movementsApi.list().catch(() => []),
      ]);
      setStats(d);
      setSales(s);
      setTickets(t);
      setMovements(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const range = useMemo(() => getDateRange(period), [period]);

  const filteredSales = useMemo(
    () => sales.filter((s) => s.created_at >= range.start && s.created_at <= range.end),
    [sales, range]
  );
  const filteredTickets = useMemo(
    () => tickets.filter((t) => t.created_at >= range.start && t.created_at <= range.end),
    [tickets, range]
  );
  const filteredMovements = useMemo(
    () => movements.filter((m) => m.created_at >= range.start && m.created_at <= range.end),
    [movements, range]
  );

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.final_amount || 0), 0);
  const completedTickets = filteredTickets.filter((t) => t.status === "COMPLETED").length;
  const conversionRate = filteredTickets.length > 0
    ? ((completedTickets / filteredTickets.length) * 100).toFixed(1)
    : "0";

  // Per-section conversion
  const SECTIONS = ["gold", "silver", "diamond", "platinum"];
  const sectionConversion = useMemo(() => {
    return SECTIONS.map((sec) => {
      const visitedTicketIds = new Set(
        filteredMovements
          .filter((m: any) => m.to_section === sec || m.from_section === sec)
          .map((m: any) => m.ticket_id)
      );
      const visitedCount = visitedTicketIds.size;
      const completedCount = filteredTickets
        .filter((t) => t.status === "COMPLETED" && visitedTicketIds.has(t.id))
        .length;
      const rate = visitedCount > 0 ? ((completedCount / visitedCount) * 100).toFixed(1) : "0";
      return { section: sec, rate: parseFloat(rate), visited: visitedCount, completed: completedCount };
    });
  }, [filteredMovements, filteredTickets]);

  const revenueChart = useMemo(() => buildRevenueChart(filteredSales, period), [filteredSales, period]);
  const revenueChartKey = period === "day" ? "time" : period === "year" ? "month" : "day";

  // Per-section revenue
  const sectionRevenue = useMemo(() => {
    return SECTIONS.map((sec) => {
      const sectionTicketIds = new Set(
        filteredMovements
          .filter((m: any) => m.to_section === sec || m.from_section === sec)
          .map((m: any) => m.ticket_id)
      );
      const rev = filteredSales
        .filter((s) => s.ticket_id && sectionTicketIds.has(s.ticket_id))
        .reduce((sum, s) => sum + Number(s.final_amount || 0), 0);
      return { name: prettySection(sec), value: rev };
    }).filter((s) => s.value > 0);
  }, [filteredSales, filteredMovements]);

  const occupancyData = stats?.occupancy?.map((o: any) => ({
    name: prettySection(o.section),
    value: o.count,
  })) || [];

  const periodLabels: Record<string, string> = {
    day: "Today's",
    week: "This Week's",
    month: "This Month's",
    year: "This Year's",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive insights into showroom performance</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 w-fit">
        {PERIODS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                period === p.key
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" /> {p.label}
            </button>
          );
        })}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: `${periodLabels[period]} Footfall`, value: filteredTickets.length, icon: <Users className="w-5 h-5" />, color: "from-amber-400 to-amber-600" },
          { label: "Active Now", value: stats?.activeTickets || 0, icon: <Clock className="w-5 h-5" />, color: "from-emerald-400 to-emerald-600" },
          { label: `${periodLabels[period]} Revenue`, value: `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, icon: <IndianRupee className="w-5 h-5" />, color: "from-indigo-400 to-indigo-600" },
          { label: `${periodLabels[period]} Conversion`, value: `${conversionRate}%`, icon: <Target className="w-5 h-5" />, color: "from-rose-400 to-rose-600" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center`}>{m.icon}</div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Revenue Trend ({period === "day" ? "Hourly" : period === "week" ? "Daily" : period === "month" ? "Daily" : "Monthly"})
          </h3>
          {revenueChart.every((d) => d.revenue === 0) ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No revenue data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey={revenueChartKey} stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {period === "day" ? "Current" : `${periodLabels[period]}`} Section Distribution
          </h3>
          {(occupancyData.length === 0 && sectionRevenue.length === 0) ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sectionRevenue.length > 0 ? sectionRevenue : occupancyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={3}
                  label={(e: any) => `${e.name}: ${period === "day" || sectionRevenue.length > 0 ? "₹" + Number(e.value).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : e.value}`}
                >
                  {(sectionRevenue.length > 0 ? sectionRevenue : occupancyData).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => {
                    if (typeof v === "number" && v >= 1000) return [`₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, "Revenue"];
                    return [v, "Customers"];
                  }}
                  contentStyle={{ borderRadius: 12 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-Section Conversion Rates */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          {periodLabels[period]} Section Conversion Rates
        </h3>
        <p className="text-sm text-gray-500 mb-5">Sales conversion for each section (customers who bought vs. visited)</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {sectionConversion.map((item, i) => {
            const color = ["#D4AF37", "#C0C0C0", "#6366f1", "#E5E4E2"][i % 4];
            const colorDark = ["#B8952A", "#A0A0A0", "#4F46E5", "#C7C6C4"][i % 4];
            return (
              <div key={item.section} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="font-semibold text-gray-900 capitalize">{prettySection(item.section)}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.visited} visited</span>
                </div>
                <div className="text-3xl font-bold mb-2" style={{ color: colorDark }}>
                  {item.rate}%
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.rate}%`, background: color }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">{item.completed} purchased</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          {periodLabels[period]} Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No sales data for this period</td></tr>
              ) : (
                filteredSales.slice(0, 20).map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{s.invoice_number}</td>
                    <td className="px-4 py-3 font-semibold">₹{Number(s.final_amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{s.payment_method}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(s.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
