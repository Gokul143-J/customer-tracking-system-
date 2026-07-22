"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, RefreshCw, Users, ShoppingBag, IndianRupee, Clock,
  TrendingUp, Target, Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
} from "recharts";
import { dashboardApi, salesApi, ticketsApi } from "@/lib/supabase/database";
import { prettySection, formatDateTime } from "@/lib/utils";

const COLORS = ["#D4AF37", "#6366f1", "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4"];

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [d, s, t] = await Promise.all([
        dashboardApi.getStats(),
        salesApi.list().catch(() => []),
        ticketsApi.list().catch(() => []),
      ]);
      setStats(d);
      setSales(s);
      setTickets(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 25000);
    return () => clearInterval(t);
  }, []);

  const occupancyData = stats?.occupancy?.map((o: any) => ({
    name: prettySection(o.section),
    value: o.count,
  })) || [];

  const weeklyRevenue = [
    { day: "Mon", revenue: 45000 },
    { day: "Tue", revenue: 62000 },
    { day: "Wed", revenue: 38000 },
    { day: "Thu", revenue: 81000 },
    { day: "Fri", revenue: 95000 },
    { day: "Sat", revenue: 120000 },
    { day: "Sun", revenue: 72000 },
  ];

  const totalRevenue = sales.reduce((s, x) => s + Number(x.final_amount || 0), 0);
  const completedTickets = tickets.filter((t) => t.status === "COMPLETED").length;
  const conversionRate = tickets.length > 0 ? ((completedTickets / tickets.length) * 100).toFixed(1) : "0";

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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Footfall", value: stats?.totalCustomers || 0, icon: <Users className="w-5 h-5" />, color: "from-amber-400 to-amber-600" },
          { label: "Active Now", value: stats?.activeTickets || 0, icon: <Clock className="w-5 h-5" />, color: "from-emerald-400 to-emerald-600" },
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: <IndianRupee className="w-5 h-5" />, color: "from-indigo-400 to-indigo-600" },
          { label: "Conversion Rate", value: `${conversionRate}%`, icon: <Target className="w-5 h-5" />, color: "from-rose-400 to-rose-600" },
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
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Revenue Trend (Weekly)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyRevenue}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Section Distribution</h3>
          {occupancyData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No active customers</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={occupancyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}>
                  {occupancyData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Transactions</h3>
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
              {sales.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No sales data yet</td></tr>
              ) : (
                sales.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{s.invoice_number}</td>
                    <td className="px-4 py-3 font-semibold">₹{Number(s.final_amount).toLocaleString("en-IN")}</td>
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
