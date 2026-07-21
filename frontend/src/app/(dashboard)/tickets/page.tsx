"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  RefreshCw,
  Loader2,
  Ticket as TicketIcon,
  Clock,
  Tag,
} from "lucide-react";
import { ticketsApi } from "@/lib/api";
import type { Ticket, Movement } from "@/types";
import {
  formatDateTime,
  formatDuration,
  prettySection,
  statusColor,
} from "@/lib/utils";

const TABS = [
  { key: undefined, label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CLOSED", label: "Closed" },
];

export default function TicketsPage() {
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = (await ticketsApi.list(tab)) as Ticket[];
      setTickets(res);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [tab]);

  async function openTicket(t: Ticket) {
    setSelected(t);
    setMovements([]);
    setLoadingMov(true);
    try {
      const m = (await ticketsApi.movements(t.id)) as Movement[];
      setMovements(m);
    } finally {
      setLoadingMov(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Tickets</h1>
          <p className="text-sm text-ink-500 mt-1">
            All customer tickets and their journey.
          </p>
        </div>
        <button onClick={load} className="btn-outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t.key
                ? "bg-gold-500 text-white"
                : "bg-white border border-ink-200 text-ink-700 hover:border-gold-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Ticket</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Current Section</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Created</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-ink-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading…
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-ink-500">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gold-50/40 transition cursor-pointer"
                    onClick={() => openTicket(t)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <TicketIcon className="w-4 h-4 text-gold-500" />
                        <span className="font-mono font-semibold">
                          {t.ticket_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-ink-900">
                      {t.customer?.name}
                    </td>
                    <td className="px-5 py-3 text-ink-700">
                      {t.customer?.phone}
                    </td>
                    <td className="px-5 py-3 capitalize text-ink-700">
                      {prettySection(t.current_section)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${statusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-500 text-xs">
                      {formatDateTime(t.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicket(t);
                        }}
                        className="btn-ghost text-gold-600"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="card max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-mono text-gold-600 text-sm">
                  {selected.ticket_number}
                </div>
                <h3 className="font-display text-2xl text-ink-900">
                  {selected.customer?.name}
                </h3>
                <div className="text-sm text-ink-500 mt-1">
                  {selected.customer?.phone} ·{" "}
                  <span className={`badge ${statusColor(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <Info
                icon={<Tag className="w-4 h-4" />}
                label="Current Section"
                value={prettySection(selected.current_section)}
              />
              <Info
                icon={<Clock className="w-4 h-4" />}
                label="Created"
                value={formatDateTime(selected.created_at)}
              />
              {selected.interested_products?.length > 0 && (
                <div className="col-span-2">
                  <div className="text-xs text-ink-500 mb-1">Interested In</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.interested_products.map((p) => (
                      <span
                        key={p}
                        className="badge bg-gold-100 text-gold-700 capitalize"
                      >
                        {p.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selected.notes && (
                <div className="col-span-2">
                  <div className="text-xs text-ink-500 mb-1">Notes</div>
                  <div className="text-sm text-ink-700">{selected.notes}</div>
                </div>
              )}
            </div>

            <h4 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold-500" /> Journey Timeline
            </h4>
            {loadingMov ? (
              <div className="text-sm text-ink-500">Loading movements…</div>
            ) : movements.length === 0 ? (
              <div className="text-sm text-ink-500">No movements recorded.</div>
            ) : (
              <ol className="relative border-l-2 border-gold-200 ml-3 space-y-4 py-1">
                {movements.map((m, i) => (
                  <li key={m.id} className="ml-5">
                    <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-gold-500 border-2 border-white" />
                    <div className="text-sm font-semibold text-ink-900">
                      {prettySection(m.from_section)} →{" "}
                      <span className="text-gold-700">
                        {prettySection(m.to_section)}
                      </span>
                    </div>
                    <div className="text-xs text-ink-500 flex gap-3 mt-0.5">
                      <span>{formatDateTime(m.created_at)}</span>
                      <span>·</span>
                      <span>
                        Stayed: {formatDuration(m.time_spent_seconds)}
                      </span>
                    </div>
                    {m.reason && (
                      <div className="text-xs text-ink-600 mt-1 italic">
                        "{m.reason}"
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-ink-50">
      <div className="text-xs text-ink-500 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold text-ink-900 mt-1 capitalize">
        {value}
      </div>
    </div>
  );
}
