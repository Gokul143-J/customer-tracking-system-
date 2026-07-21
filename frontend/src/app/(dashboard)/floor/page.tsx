"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  ArrowRight,
  Loader2,
  RefreshCw,
  Clock,
  Users,
} from "lucide-react";
import { movementsApi, sectionsApi, ticketsApi } from "@/lib/api";
import { formatDuration, prettySection, statusColor } from "@/lib/utils";
import type { ShowroomSection, Ticket } from "@/types";

export default function FloorPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sections, setSections] = useState<ShowroomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Ticket | null>(null);
  const [toSection, setToSection] = useState("");
  const [reason, setReason] = useState("");
  const [moving, setMoving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [t, s] = await Promise.all([
        ticketsApi.list("ACTIVE"),
        sectionsApi.list().catch(() => [] as ShowroomSection[]),
      ]);
      setTickets(t as Ticket[]);
      setSections(s as ShowroomSection[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const grouped = sections.length
    ? sections.map((sec) => ({
        section: sec,
        list: tickets.filter((t) => t.current_section === sec.name),
      }))
    : // fallback if sections endpoint returns nothing
      Array.from(new Set(tickets.map((t) => t.current_section))).map((s) => ({
        section: { id: s, name: s, display_name: prettySection(s), display_order: 0, is_active: true },
        list: tickets.filter((t) => t.current_section === s),
      }));

  async function moveCustomer() {
    if (!selected || !toSection) return;
    setMoving(true);
    setError(null);
    try {
      await movementsApi.create(selected.ticket_number, toSection, reason || undefined);
      setSelected(null);
      setToSection("");
      setReason("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMoving(false);
    }
  }

  const targetSections = sections.filter(
    (s) => !selected || s.name !== selected.current_section
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Floor Manager</h1>
          <p className="text-sm text-ink-500 mt-1">
            Track and transfer customers across sections.
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

      {loading && tickets.length === 0 ? (
        <div className="text-ink-500 py-20 text-center">Loading floor data…</div>
      ) : tickets.length === 0 ? (
        <div className="card p-10 text-center">
          <Users className="w-10 h-10 mx-auto text-ink-300 mb-3" />
          <div className="text-ink-700 font-semibold">No active customers</div>
          <div className="text-ink-500 text-sm mt-1">
            Generate a ticket from the Reception page to begin tracking.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grouped.map(({ section, list }) => (
            <div key={section.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold-500" />
                  <h3 className="font-display text-lg text-ink-900">
                    {section.display_name}
                  </h3>
                </div>
                <span className="badge bg-gold-100 text-gold-700">
                  {list.length}
                </span>
              </div>
              {list.length === 0 ? (
                <div className="text-ink-400 text-sm py-6 text-center">
                  No customers here
                </div>
              ) : (
                <ul className="space-y-2">
                  {list.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => {
                          setSelected(t);
                          setToSection("");
                          setReason("");
                        }}
                        className="w-full text-left p-3 rounded-xl border border-ink-100 hover:border-gold-400 hover:bg-gold-50/50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-ink-900 text-sm">
                              {t.customer?.name || "Customer"}
                            </div>
                            <div className="text-xs text-ink-500 mt-0.5">
                              {t.ticket_number} · {t.customer?.phone}
                            </div>
                          </div>
                          <span
                            className={`badge ${statusColor(t.status)} text-[10px]`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="card max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-ink-900 mb-1">
              Transfer Customer
            </h3>
            <p className="text-sm text-ink-500 mb-4">
              {selected.customer?.name}{" "}
              <span className="text-ink-400">({selected.ticket_number})</span>
            </p>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-50 mb-4">
              <div className="flex-1">
                <div className="text-xs text-ink-500">Current</div>
                <div className="font-semibold capitalize">
                  {prettySection(selected.current_section)}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gold-500" />
              <div className="flex-1">
                <label className="text-xs text-ink-500">To</label>
                <select
                  className="input mt-0.5 py-1.5"
                  value={toSection}
                  onChange={(e) => setToSection(e.target.value)}
                >
                  <option value="">Select section</option>
                  {targetSections.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="label">Reason (optional)</label>
            <input
              className="input mb-4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer wants to see diamond collection"
            />

            <div className="flex gap-2 justify-end">
              <button
                className="btn-outline"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={!toSection || moving}
                onClick={moveCustomer}
              >
                {moving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Transferring…
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" /> Record Movement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
