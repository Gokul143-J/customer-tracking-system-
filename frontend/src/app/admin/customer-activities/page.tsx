"use client";

import { useEffect, useState } from "react";
import {
  Activity, RefreshCw, Loader2, Clock, ArrowRight, MapPin,
  Ticket as TicketIcon, User, Calendar, Filter,
} from "lucide-react";
import { ticketsApi, movementsApi } from "@/lib/supabase/database";
import { formatDateTime, prettySection, formatDuration } from "@/lib/utils";

export default function CustomerActivitiesPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "movements" | "tickets">("all");

  async function load() {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([
        movementsApi.list(),
        ticketsApi.list(),
      ]);
      setMovements(m);
      setTickets(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  // Combine activities into a single timeline
  const activities = [
    ...tickets.map((t) => ({
      type: "ticket" as const,
      id: t.id,
      time: t.created_at,
      title: `New ticket generated for ${t.customer?.name || "Customer"}`,
      detail: `Ticket: ${t.ticket_number} · Section: ${prettySection(t.current_section)}`,
      status: t.status,
    })),
    ...movements.map((m) => ({
      type: "movement" as const,
      id: m.id,
      time: m.created_at,
      title: `${m.customers?.name || "Customer"} moved to ${prettySection(m.to_section)}`,
      detail: `From ${prettySection(m.from_section)} → ${prettySection(m.to_section)} · Stayed: ${formatDuration(m.time_spent_seconds)}`,
      status: null,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Customer Activities</h1>
          <p className="text-sm text-gray-500 mt-1">Complete activity log of all customer movements and actions</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
              <div className="text-xs text-gray-500">Total Tickets</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{movements.length}</div>
              <div className="text-xs text-gray-500">Total Movements</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
              <div className="text-xs text-gray-500">Total Activities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 w-fit">
        {[
          { key: "all", label: "All Activities" },
          { key: "tickets", label: "Tickets" },
          { key: "movements", label: "Movements" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.key ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading activities…
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <div className="font-semibold text-gray-600">No activities yet</div>
            <div className="text-sm mt-1">Activities will appear here as customers visit</div>
          </div>
        ) : (
          <div className="space-y-1">
            {activities
              .filter((a) => filter === "all" || (filter === "tickets" && a.type === "ticket") || (filter === "movements" && a.type === "movement"))
              .map((a) => (
                <div key={`${a.type}-${a.id}`} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.type === "ticket" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                  }`}>
                    {a.type === "ticket" ? <TicketIcon className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{a.detail}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400">{formatDateTime(a.time)}</div>
                    {a.status && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        a.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                      }`}>{a.status}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
