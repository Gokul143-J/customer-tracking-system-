"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList, RefreshCw, Loader2, Ticket as TicketIcon, Clock,
  MapPin, Eye, FileText, ArrowRight, XCircle, CheckCircle2,
  Crown, Award,
} from "lucide-react";
import { ticketsApi, sectionTimeApi } from "@/lib/supabase/database";
import { formatDateTime, formatDuration, prettySection, statusColor } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const TABS = [
  { key: undefined, label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CLOSED", label: "Closed" },
];

export default function MyTicketsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  async function load() {
    setLoading(true);
    try {
      let res = await ticketsApi.list(tab);
      // Bug #4 fix: Section managers only see tickets in their section
      if (user?.role === "section_manager") {
        res = res.filter((t: any) => t.target_section === user.assigned_section || t.current_section === user.assigned_section);
      }
      setTickets(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab, user]);

  async function openTicket(t: any) {
    setSelected(t);
    setMovements([]);
    setLoadingMov(true);
    setMessage(null);
    try {
      const m = await ticketsApi.movements(t.id);
      setMovements(m);
    } finally {
      setLoadingMov(false);
    }
  }

  async function closeTicket(ticket: any) {
    // Feature #1: Reason selector
    const reason = prompt(`Closing ticket for ${ticket.customer?.name}.\n\nReason for leaving?\n1 = Browse only\n2 = Found elsewhere\n3 = Changed mind\n4 = Other`);
    if (reason === null) return;
    const reasonText = reason === "1" ? "Browse only" : reason === "2" ? "Found elsewhere" : reason === "3" ? "Changed mind" : reason === "4" ? "Other" : reason;
    try {
      const now = new Date();
      const timeLogs = await sectionTimeApi.byTicket(ticket.id);
      const openLog = timeLogs.find((l: any) => !l.exit_time);
      if (openLog) {
        const duration = Math.floor((now.getTime() - new Date(openLog.entry_time).getTime()) / 1000);
        await sectionTimeApi.update(openLog.id, { exit_time: now.toISOString(), duration_seconds: duration });
      }
      await ticketsApi.update(ticket.id, {
        status: "CLOSED",
        closed_at: now.toISOString(),
        updated_at: now.toISOString(),
        ...(reasonText ? { notes: `Left shop: ${reasonText}` } : {}),
      });
      setMessageType("success");
      setMessage(`✅ Ticket closed. ${ticket.customer?.name} has left the shop.`);
      setSelected(null);
      load();
    } catch (err: any) {
      setMessageType("error");
      setMessage("Failed to close ticket");
    }
  }

  // Calculate total visit duration for a ticket
  function getTotalDuration(ticket: any): string | null {
    if (!ticket.closed_at) return null;
    const entry = new Date(ticket.created_at).getTime();
    const exit = new Date(ticket.closed_at).getTime();
    return formatDuration(Math.floor((exit - entry) / 1000));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            {user?.role === "section_manager" ? `${prettySection(user.assigned_section || "gold")} Tickets` : "All Tickets"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === "section_manager"
              ? `Tickets assigned to ${prettySection(user.assigned_section || "gold")} section`
              : "All customer tickets and their journey through the showroom"}
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 w-fit">
        {TABS.map((t) => (
          <button key={t.label} onClick={() => setTab(t.key)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${messageType === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {messageType === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />} {message}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-4">Ticket</th>
                <th className="text-left px-6 py-4">Customer</th>
                <th className="text-left px-6 py-4">Phone</th>
                <th className="text-left px-6 py-4">Section</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Created</th>
                <th className="text-right px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No tickets found</td></tr>
              ) : (
                tickets.map((t) => {
                  const isVIP = t.customer?.visit_count > 2;
                  const totalDuration = getTotalDuration(t);
                  return (
                    <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => openTicket(t)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TicketIcon className="w-4 h-4 text-indigo-500" />
                          <span className="font-mono font-bold text-indigo-700">{t.ticket_number}</span>
                          {isVIP && <Crown className="w-4 h-4 text-amber-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          {t.customer?.name || "—"}
                          {isVIP && <Award className="w-3 h-3 text-amber-500" />}
                        </div>
                        {t.customer?.visit_count > 1 && (
                          <div className="text-xs text-gray-500 mt-0.5">{t.customer.visit_count} visits</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{t.customer?.phone || "—"}</td>
                      <td className="px-6 py-4 capitalize text-gray-600">{prettySection(t.current_section)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(t.status)}`}>
                          {t.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-500 text-xs">{formatDateTime(t.created_at)}</div>
                        {totalDuration && <div className="text-xs text-indigo-600 font-medium mt-0.5">⏱ {totalDuration}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"><Eye className="w-4 h-4 inline" /> View</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="rounded-2xl bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-indigo-600 text-sm font-bold">{selected.ticket_number}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {selected.customer?.name}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                    <span>{selected.customer?.phone}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(selected.status)}`}>{selected.status}</span>
                    {selected.customer?.visit_count > 2 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Crown className="w-3 h-3" /> VIP · {selected.customer.visit_count} visits
                      </span>
                    )}
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Current Section</div>
                  <div className="font-semibold text-gray-900 capitalize mt-0.5">{prettySection(selected.current_section)}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{formatDateTime(selected.created_at)}</div>
                </div>
                {selected.notes && (
                  <div className="col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-xs text-amber-700 mb-1">Notes</div>
                    <div className="text-sm text-amber-900 font-medium">{selected.notes}</div>
                  </div>
                )}
              </div>

              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" /> Journey Timeline
              </h4>
              {loadingMov ? (
                <div className="text-sm text-gray-400 py-6 text-center">Loading movements…</div>
              ) : movements.length === 0 ? (
                <div className="text-sm text-gray-400 py-6 text-center">No movements recorded</div>
              ) : (
                <ol className="relative border-l-2 border-indigo-200 ml-3 space-y-5 py-1">
                  {movements.map((m) => (
                    <li key={m.id} className="ml-5">
                      <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                      <div className="text-sm font-bold text-gray-900">
                        {prettySection(m.from_section)} <ArrowRight className="w-3 h-3 inline text-indigo-500" />{" "}
                        <span className="text-indigo-700">{prettySection(m.to_section)}</span>
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

              {selected.status === "ACTIVE" && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">Reception action: mark customer as leaving the shop</p>
                  <button onClick={() => closeTicket(selected)} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-400 hover:to-red-500 transition flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Close Ticket — Customer Left Shop
                  </button>
                </div>
              )}

              {message && (
                <div className={`mt-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${messageType === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {messageType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
