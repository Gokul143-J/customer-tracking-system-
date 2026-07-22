"use client";

import { useEffect, useState } from "react";
import {
  MapPin, RefreshCw, Loader2, Clock, ArrowRight, Search, Eye, Filter,
} from "lucide-react";
import { ticketsApi, sectionsApi } from "@/lib/supabase/database";
import { formatDuration, prettySection, statusColor } from "@/lib/utils";
import type { Ticket, Movement } from "@/types";

export default function TrackCustomersPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        ticketsApi.list(filter || undefined),
        sectionsApi.list(),
      ]);
      setTickets(t);
      setSections(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [filter]);

  async function openDetail(ticket: any) {
    setSelected(ticket);
    setLoadingMov(true);
    try {
      const m = await ticketsApi.movements(ticket.id);
      setMovements(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMov(false);
    }
  }

  const filtered = tickets.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.customer?.name?.toLowerCase().includes(q) ||
      t.customer?.phone?.includes(q) ||
      t.ticket_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Track Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time customer tracking across showroom sections</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100">
          {["ACTIVE", "COMPLETED", "CLOSED", ""].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === s
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
            placeholder="Search name, phone, ticket…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-4">Ticket</th>
                <th className="text-left px-6 py-4">Customer</th>
                <th className="text-left px-6 py-4">Phone</th>
                <th className="text-left px-6 py-4">Current Section</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Entry Time</th>
                <th className="text-right px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading data…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">No tickets found</td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-amber-50/30 transition-colors cursor-pointer" onClick={() => openDetail(t)}>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-amber-700">{t.ticket_number}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{t.customer?.name || "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{t.customer?.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium capitalize">
                        <MapPin className="w-3 h-3" /> {prettySection(t.current_section)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                        t.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {t.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDateTime(t.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-amber-600 hover:text-amber-700 font-medium text-xs">
                        <Eye className="w-4 h-4 inline" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="rounded-2xl bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-amber-600 text-sm font-bold">{selected.ticket_number}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {selected.customer?.name}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                    <span>{selected.customer?.phone}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      selected.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>{selected.status}</span>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>

            <div className="p-6">
              {/* Journey Info */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Current Section</div>
                  <div className="font-semibold text-gray-900 capitalize mt-0.5">{prettySection(selected.current_section)}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Entry Time</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{formatDateTime(selected.created_at)}</div>
                </div>
                {selected.interested_products?.length > 0 && (
                  <div className="col-span-2 p-3 rounded-xl bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1.5">Interested In</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.interested_products.map((p: string) => (
                        <span key={p} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium capitalize">{p.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Journey Timeline
              </h4>
              {loadingMov ? (
                <div className="text-sm text-gray-400 py-6 text-center">Loading movements…</div>
              ) : movements.length === 0 ? (
                <div className="text-sm text-gray-400 py-6 text-center">No movements recorded yet</div>
              ) : (
                <ol className="relative border-l-2 border-amber-200 ml-3 space-y-5 py-1">
                  {movements.map((m) => (
                    <li key={m.id} className="ml-5">
                      <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm" />
                      <div className="text-sm font-bold text-gray-900">
                        {prettySection(m.from_section)} <ArrowRight className="w-3 h-3 inline text-amber-500" />{" "}
                        <span className="text-amber-700">{prettySection(m.to_section)}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex gap-3 mt-1">
                        <span>{formatDateTime(m.created_at)}</span>
                        <span>•</span>
                        <span>Stayed: {formatDuration(m.time_spent_seconds)}</span>
                      </div>
                      {m.reason && (
                        <div className="text-xs text-gray-600 mt-1 italic bg-gray-50 px-2 py-1 rounded">{m.reason}</div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
