"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Search, Loader2, IndianRupee, CheckCircle2,
  FileText, RefreshCw,
} from "lucide-react";
import { salesApi, ticketsApi } from "@/lib/supabase/database";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const PAYMENT_METHODS = ["cash", "upi", "card", "emi"];

export default function SalesBillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    total_weight: "", making_charges: "", stone_weight: "",
    gst_amount: "", discount: "", final_amount: "", payment_method: "cash",
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);

  // Guard: redirect receptionists away
  useEffect(() => {
    if (user && user.role === "receptionist") {
      router.replace("/employee/ticket-generation");
    }
  }, [user, router]);

  async function loadSales() {
    setLoading(true);
    try {
      const s = await salesApi.list();
      setSales(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSales(); }, []);

  async function searchTicket() {
    if (!query.trim()) return;
    setError(null);
    setLooking(true);
    setTicket(null);
    try {
      const all = await ticketsApi.list("ACTIVE");
      const t = all.find((tk: any) =>
        tk.ticket_number?.toLowerCase() === query.trim().toLowerCase() ||
        tk.id === query.trim()
      );
      if (!t) { setError("Active ticket not found"); setLooking(false); return; }
      if (t.status !== "ACTIVE") {
        setError(`Ticket is ${t.status}; cannot bill.`);
        setLooking(false);
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
      const invoiceNum = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const payload = {
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        salesperson_id: user?.id || "",
        products: [],
        total_weight: Number(form.total_weight || 0),
        making_charges: Number(form.making_charges || 0),
        stone_weight: Number(form.stone_weight || 0),
        gst_amount: Number(form.gst_amount || 0),
        discount: Number(form.discount || 0),
        final_amount: Number(form.final_amount || 0),
        invoice_number: invoiceNum,
        payment_method: form.payment_method,
        status: "completed",
      };
      await salesApi.create(payload);
      // Close ticket
      await ticketsApi.close(ticket.id, "COMPLETED");
      setLastInvoice(invoiceNum);
      setTicket(null);
      setQuery("");
      setForm({ total_weight: "", making_charges: "", stone_weight: "", gst_amount: "", discount: "", final_amount: "", payment_method: "cash" });
      loadSales();
    } catch (e: any) {
      setError(e.message || "Failed to create sale");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Sales & Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Process sales and close tickets</p>
        </div>
        <button onClick={loadSales} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Billing Form */}
        <div className="xl:col-span-2 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>New Sale</h3>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="Enter ticket number…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTicket()}
              />
            </div>
            <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 flex items-center gap-2" onClick={searchTicket} disabled={looking}>
              {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Find
            </button>
          </div>

          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

          {lastInvoice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Sale recorded! Invoice: <span className="font-mono font-bold">{lastInvoice}</span>
            </div>
          )}

          {ticket && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-white border border-indigo-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{ticket.customer?.name || "Customer"}</div>
                  <div className="text-xs text-gray-500">{ticket.ticket_number} · {ticket.customer?.phone} · <span className="capitalize">{ticket.current_section?.replace(/_/g, " ")}</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Weight (g)</label>
              <input type="number" step="0.001" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.total_weight} onChange={(e) => setForm({ ...form, total_weight: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Stone Weight (carats)</label>
              <input type="number" step="0.001" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.stone_weight} onChange={(e) => setForm({ ...form, stone_weight: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Making Charges (₹)</label>
              <input type="number" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.making_charges} onChange={(e) => setForm({ ...form, making_charges: e.target.value })} onBlur={computeTotal} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">GST Amount (₹)</label>
              <input type="number" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.gst_amount} onChange={(e) => setForm({ ...form, gst_amount: e.target.value })} onBlur={computeTotal} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Discount (₹)</label>
              <input type="number" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} onBlur={computeTotal} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Payment Method</label>
              <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Final Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input type="number" className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-lg font-bold focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.final_amount} onChange={(e) => setForm({ ...form, final_amount: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2" disabled={!ticket || submitting} onClick={submitSale}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><ShoppingBag className="w-4 h-4" /> Complete Sale & Close Ticket</>}
            </button>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Sales</h3>
          {loading ? (
            <div className="text-gray-400 text-sm">Loading…</div>
          ) : sales.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">No sales recorded yet</div>
          ) : (
            <ul className="space-y-3">
              {sales.slice(0, 10).map((s) => (
                <li key={s.id} className="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700">{s.invoice_number}</span>
                    <span className="font-bold text-gray-900 flex items-center"><IndianRupee className="w-3 h-3" />{Number(s.final_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{s.payment_method} · {formatDateTime(s.created_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
