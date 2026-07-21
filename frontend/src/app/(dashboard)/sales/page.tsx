"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Search,
  Loader2,
  IndianRupee,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { salesApi, ticketsApi } from "@/lib/api";
import type { Sale, Ticket } from "@/types";
import { formatDateTime } from "@/lib/utils";

const PAYMENT_METHODS = ["cash", "upi", "card", "emi"];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    total_weight: "",
    making_charges: "",
    stone_weight: "",
    gst_amount: "",
    discount: "",
    final_amount: "",
    payment_method: "cash",
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);

  async function loadSales() {
    setLoading(true);
    try {
      const s = (await salesApi.list()) as Sale[];
      setSales(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  async function searchTicket() {
    if (!query.trim()) return;
    setError(null);
    setLooking(true);
    setTicket(null);
    try {
      const t = (await ticketsApi.get(query.trim())) as Ticket;
      if (t.status !== "ACTIVE") {
        setError(`Ticket is ${t.status}; cannot bill.`);
        setTicket(null);
        return;
      }
      setTicket(t);
    } catch (e: any) {
      setError(e.message || "Ticket not found");
    } finally {
      setLooking(false);
    }
  }

  function computeTotal() {
    const toNum = (v: string) => Number(v || 0);
    const subtotal = toNum(form.making_charges);
    const gst = toNum(form.gst_amount);
    const disc = toNum(form.discount);
    const total = Math.max(0, subtotal + gst - disc);
    setForm((f) => ({ ...f, final_amount: total.toFixed(2) }));
  }

  async function submitSale() {
    if (!ticket) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ticket_id: ticket.id,
        products: [],
        total_weight: Number(form.total_weight || 0),
        making_charges: Number(form.making_charges || 0),
        stone_weight: Number(form.stone_weight || 0),
        gst_amount: Number(form.gst_amount || 0),
        discount: Number(form.discount || 0),
        final_amount: Number(form.final_amount || 0),
        payment_method: form.payment_method,
      };
      const sale = (await salesApi.create(payload)) as Sale;
      setLastInvoice(sale.invoice_number);
      setTicket(null);
      setQuery("");
      setForm({
        total_weight: "",
        making_charges: "",
        stone_weight: "",
        gst_amount: "",
        discount: "",
        final_amount: "",
        payment_method: "cash",
      });
      loadSales();
    } catch (e: any) {
      setError(e.message || "Failed to create sale");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Sales & Billing</h1>
        <p className="text-sm text-ink-500 mt-1">
          Close a ticket and generate an invoice.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Billing form */}
        <div className="card p-6 xl:col-span-2">
          <h3 className="font-display text-lg mb-4">New Sale</h3>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-ink-500" />
              <input
                className="input pl-9"
                placeholder="Search by ticket number (e.g. JR-2026-01001)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTicket()}
              />
            </div>
            <button className="btn-primary" onClick={searchTicket} disabled={looking}>
              {looking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Find
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {lastInvoice && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Sale recorded! Invoice number:{" "}
              <span className="font-mono font-semibold">{lastInvoice}</span>
            </div>
          )}

          {ticket && (
            <div className="p-4 rounded-xl bg-gold-50 border border-gold-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-ink-900">
                    {ticket.customer?.name}
                  </div>
                  <div className="text-xs text-ink-500">
                    {ticket.ticket_number} · {ticket.customer?.phone} ·{" "}
                    <span className="capitalize">
                      {ticket.current_section.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Weight (g)</label>
              <input
                type="number"
                step="0.001"
                className="input"
                value={form.total_weight}
                onChange={(e) =>
                  setForm({ ...form, total_weight: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Stone Weight (carats)</label>
              <input
                type="number"
                step="0.001"
                className="input"
                value={form.stone_weight}
                onChange={(e) =>
                  setForm({ ...form, stone_weight: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Making Charges (₹)</label>
              <input
                type="number"
                className="input"
                value={form.making_charges}
                onChange={(e) =>
                  setForm({ ...form, making_charges: e.target.value })
                }
                onBlur={computeTotal}
              />
            </div>
            <div>
              <label className="label">GST Amount (₹)</label>
              <input
                type="number"
                className="input"
                value={form.gst_amount}
                onChange={(e) => setForm({ ...form, gst_amount: e.target.value })}
                onBlur={computeTotal}
              />
            </div>
            <div>
              <label className="label">Discount (₹)</label>
              <input
                type="number"
                className="input"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                onBlur={computeTotal}
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={form.payment_method}
                onChange={(e) =>
                  setForm({ ...form, payment_method: e.target.value })
                }
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Final Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-ink-500" />
                <input
                  type="number"
                  className="input pl-9 font-semibold text-lg"
                  value={form.final_amount}
                  onChange={(e) =>
                    setForm({ ...form, final_amount: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button
              className="btn-primary"
              disabled={!ticket || submitting}
              onClick={submitSale}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Complete Sale & Close Ticket
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent sales */}
        <div className="card p-6">
          <h3 className="font-display text-lg mb-4">Recent Sales</h3>
          {loading ? (
            <div className="text-ink-500 text-sm">Loading…</div>
          ) : sales.length === 0 ? (
            <div className="text-ink-500 text-sm text-center py-8">
              No sales recorded yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {sales.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  className="p-3 rounded-lg border border-ink-100 hover:border-gold-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gold-700 font-semibold">
                      {s.invoice_number}
                    </span>
                    <span className="text-ink-900 font-bold flex items-center">
                      <IndianRupee className="w-3 h-3" />
                      {Number(s.final_amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-ink-500 mt-1 capitalize">
                    {s.payment_method} · {formatDateTime(s.created_at)}
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
