"use client";

import { useEffect, useState } from "react";
import {
  Search, RefreshCw, Loader2, Phone, MapPin, Award, Eye, Clock,
  ArrowRight, ChevronLeft, ChevronRight, User, Timer, Crown,
} from "lucide-react";
import { customersApi, ticketsApi, sectionTimeApi } from "@/lib/supabase/database";
import { formatDateTime, prettySection, formatDuration } from "@/lib/utils";

export default function CustomerDetailsPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [customerTickets, setCustomerTickets] = useState<any[]>([]);
  const [sectionTimeLogs, setSectionTimeLogs] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await customersApi.list(query || undefined);
      setCustomers(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function openCustomer(c: any) {
    setSelected(c);
    setLoadingTickets(true);
    try {
      // Get all tickets for this customer
      const allTickets = await ticketsApi.list();
      const cTickets = allTickets.filter((t: any) => t.customer_id === c.id);
      setCustomerTickets(cTickets);

      // Get section time logs
      const timeLogs = await sectionTimeApi.byCustomer(c.id);
      setSectionTimeLogs(timeLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTickets(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Customer Details</h1>
          <p className="text-sm text-gray-500 mt-1">Complete customer database with visit history and section tracking</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
            placeholder="Search by name or phone number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading customers…
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white border border-gray-100 p-12 text-center">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <div className="text-gray-700 font-semibold">No customers found</div>
            <div className="text-gray-500 text-sm mt-1">Customers will appear here once tickets are generated</div>
          </div>
        ) : (
          customers.map((c) => {
            const isVIP = c.visit_count > 2;
            return (
            <div key={c.id} className={`group rounded-2xl bg-white border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${isVIP ? "border-amber-300 hover:border-amber-400" : "border-gray-100 hover:border-amber-200"}`} onClick={() => openCustomer(c)}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg relative ${isVIP ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30" : "bg-gradient-to-br from-gray-400 to-gray-600 shadow-gray-500/20"}`}>
                  {c.name?.charAt(0).toUpperCase()}
                  {isVIP && <Crown className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 bg-white rounded-full p-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate flex items-center gap-1">
                    {c.name}
                    {isVIP && <Award className="w-3 h-3 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <Phone className="w-3 h-3" /> {c.phone}
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isVIP ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                  <Award className="w-3 h-3" /> {c.visit_count || 0} visits
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {c.city && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="w-3 h-3" /> <span className="text-gray-700">{c.city}</span>
                  </div>
                )}
                {c.gender && (
                  <div className="text-gray-500">Gender: <span className="text-gray-700">{c.gender}</span></div>
                )}
                {c.age && (
                  <div className="text-gray-500">Age: <span className="text-gray-700">{c.age}</span></div>
                )}
                <div className="col-span-2 flex items-center gap-1.5 text-gray-500 mt-1">
                  <Clock className="w-3 h-3" /> Last visit: <span className="text-gray-700">{formatDateTime(c.last_visit || c.created_at)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">First visit: {formatDateTime(c.first_visit || c.created_at)}</span>
                <span className="text-xs text-amber-600 font-medium group-hover:translate-x-0.5 transition-transform">View Details →</span>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="rounded-2xl bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    {selected.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selected.phone}</span>
                      {selected.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selected.city}</span>}
                    </div>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" onClick={() => setSelected(null)}>✕</button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="p-3 rounded-xl bg-white border border-gray-100 text-center">
                  <div className="text-2xl font-bold text-amber-600">{selected.visit_count || 0}</div>
                  <div className="text-xs text-gray-500">Total Visits</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-100 text-center">
                  <div className="text-sm font-bold text-gray-900">{formatDateTime(selected.first_visit || selected.created_at)}</div>
                  <div className="text-xs text-gray-500">First Visit</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-100 text-center">
                  <div className="text-sm font-bold text-gray-900">{formatDateTime(selected.last_visit || selected.created_at)}</div>
                  <div className="text-xs text-gray-500">Last Visit</div>
                </div>
              </div>
            </div>

            {/* Section Time Tracking */}
            <div className="p-6 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-500" /> Time Spent in Each Section
              </h4>
              {loadingTickets ? (
                <div className="text-sm text-gray-400 text-center py-4">Loading time data...</div>
              ) : sectionTimeLogs.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                  No section time data yet. Time is tracked when customers move between sections.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Aggregate time per section */}
                  {(() => {
                    const sectionMap: Record<string, number> = {};
                    sectionTimeLogs.forEach((log: any) => {
                      const sec = log.section || 'unknown';
                      sectionMap[sec] = (sectionMap[sec] || 0) + (log.duration_seconds || 0);
                    });
                    return Object.entries(sectionMap).map(([section, totalSeconds]) => (
                      <div key={section} className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                        <div className="text-xs text-gray-500 capitalize mb-1">{prettySection(section)}</div>
                        <div className="text-lg font-bold text-indigo-700">{formatDuration(totalSeconds as number)}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {sectionTimeLogs.filter((l: any) => l.section === section).length} visit(s)
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
              {/* Total time */}
              {sectionTimeLogs.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-800">Total Time Tracked</span>
                  <span className="text-lg font-bold text-amber-700">
                    {formatDuration(sectionTimeLogs.reduce((sum: number, log: any) => sum + (log.duration_seconds || 0), 0))}
                  </span>
                </div>
              )}
            </div>

            {/* Visit History */}
            <div className="p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Visit History & Sections
              </h4>
              {loadingTickets ? (
                <div className="text-sm text-gray-400 text-center py-6">Loading visit history…</div>
              ) : customerTickets.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-6">No ticket history found</div>
              ) : (
                <div className="space-y-3">
                  {customerTickets.map((t: any) => (
                    <div key={t.id} className="p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-amber-700 text-sm">{t.ticket_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                          t.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{t.status}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDateTime(t.created_at)}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <MapPin className="w-3 h-3" /> {prettySection(t.current_section)}
                        </span>
                      </div>
                      {t.interested_products?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {t.interested_products.map((p: string) => (
                            <span key={p} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs capitalize">{p.replace(/_/g, " ")}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
