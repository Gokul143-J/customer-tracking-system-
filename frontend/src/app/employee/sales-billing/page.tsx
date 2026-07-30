"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Search, Loader2, IndianRupee, CheckCircle2, FileText, RefreshCw, XCircle, AlertTriangle,
} from "lucide-react";
import { salesApi, ticketsApi, sectionTimeApi, auditLogsApi, movementsApi } from "@/lib/supabase/database";
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
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

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
      // Filter by section for section managers (use salesperson_id since ticket
      // gets moved to reception after billing, making current_section unreliable)
      if (user?.role === "section_manager") {
        const filtered = s.filter((sale: any) => sale.salesperson_id === user.id);
        setSales(filtered);
      } else {
        setSales(s);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { loadSales(); }, []);

  async function searchTicket() {
    if (!query.trim()) return;
    setError(null); setMessage(null); setLooking(true); setTicket(null);
    try {
      const all = await ticketsApi.list("ACTIVE");
      const t = all.find((tk: any) =>
        tk.ticket_number?.toLowerCase() === query.trim().toLowerCase() || tk.id === query.trim()
      );
      if (!t) { setError("Active ticket not found"); setLooking(false); return; }
      if (t.status !== "ACTIVE") { setError(`Ticket is ${t.status}; cannot bill.`); setLooking(false); return; }
      // Validate ticket is currently in section manager's section
      if (user?.role === "section_manager" && user.assigned_section) {
        if (t.current_section !== user.assigned_section) {
          setError(`Customer is currently in ${t.current_section || "idle"}, not your section (${user.assigned_section})`);
          setLooking(false);
          return;
        }
      }
      setTicket(t);
    } catch (e: any) { setError(e.message || "Ticket not found"); } finally { setLooking(false); }
  }

  function computeTotal() {
    const toNum = (v: string) => Number(v || 0);
    const total = Math.max(0, toNum(form.making_charges) + toNum(form.gst_amount) - toNum(form.discount));
    setForm((f) => ({ ...f, final_amount: total.toFixed(2) }));
  }

  async function submitSale() {
    if (!ticket) return;
    // Validation
    if (!form.final_amount || Number(form.final_amount) <= 0) {
      setError("Final amount must be greater than 0");
      return;
    }
    setError(null); setSubmitting(true);
    try {
      const now = new Date();
      const invoiceNum = `INV-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;

      // 1. Create sale record
      await salesApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        salesperson_id: user?.id || "",
        total_weight: Number(form.total_weight || 0),
        making_charges: Number(form.making_charges || 0),
        stone_weight: Number(form.stone_weight || 0),
        gst_amount: Number(form.gst_amount || 0),
        discount: Number(form.discount || 0),
        final_amount: Number(form.final_amount || 0),
        invoice_number: invoiceNum,
        payment_method: form.payment_method,
        status: "completed",
      });

      // 2. Close open section time log for current section
      try {
        const currentSection = ticket.current_section;
        if (currentSection) {
          const logs = await sectionTimeApi.byTicket(ticket.id);
          const openLog = logs.find((l: any) => l.section === currentSection && !l.exit_time);
          if (openLog) {
            const duration = Math.max(0, Math.floor((now.getTime() - new Date(openLog.entry_time).getTime()) / 1000));
            await sectionTimeApi.update(openLog.id, { exit_time: now.toISOString(), duration_seconds: duration });
          }
        }
      } catch (e) { console.warn("Failed to close time log:", e); }

      // 3. After billing, send customer back to reception (ticket stays ACTIVE)
      //    Only receptionist can do final checkout/close
      await movementsApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        from_section: ticket.current_section,
        to_section: "reception",
        reason: `Sale completed by ${user?.full_name || "employee"}`,
        time_spent_seconds: 0,
      });

      await ticketsApi.update(ticket.id, {
        current_section: "reception",
        notes: `Sale completed (${invoiceNum}) at ${ticket.current_section}. Waiting reception checkout.`,
        updated_at: now.toISOString(),
      });

      // 4. Write audit log
      try {
        await auditLogsApi.create({
          action: "SALE_COMPLETED",
          entity_type: "sale",
          entity_id: ticket.id,
          new_values: {
            ticket_number: ticket.ticket_number,
            customer: ticket.customer?.name,
            final_amount: form.final_amount,
            payment_method: form.payment_method,
            invoice_number: invoiceNum,
            by: user?.full_name,
          },
          performed_by: user?.id,
        });
      } catch (e) { console.warn("Audit log failed:", e); }

      setLastInvoice(invoiceNum);
      setMessageType("success");
      setMessage(`✅ Sale completed! Invoice ${invoiceNum}. Customer returned to reception for final checkout.`);
      setTicket(null); setQuery("");
      setForm({ total_weight: "", making_charges: "", stone_weight: "", gst_amount: "", discount: "", final_amount: "", payment_method: "cash" });
      await loadSales();
    } catch (e: any) { setError(e.message || "Failed to create sale"); } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Sales & Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Process sales. After billing, customer returns to reception for final checkout.</p>
        </div>
        <button onClick={loadSales} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
            <button
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              onClick={searchTicket} disabled={looking}
            >
              {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Find
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

              {lastInvoice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Sale recorded! Invoice: <span className="font-mono font-bold">{lastInvoice}</span>
                </div>
              )}
              {message && (
                <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${messageType === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {messageType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message}
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
                  <div className="text-xs text-gray-500">
                    {ticket.ticket_number} · {ticket.customer?.phone || "—"} · <span className="capitalize">{ticket.current_section?.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Total Weight (g)</label>
              <input type="number" step="0.001" min="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.total_weight} onChange={(e) => setForm({ ...form, total_weight: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Stone Weight (carats)</label>
              <input type="number" step="0.001" min="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.stone_weight} onChange={(e) => setForm({ ...form, stone_weight: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Making Charges (₹)</label>
              <input type="number" min="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.making_charges} onChange={(e) => setForm({ ...form, making_charges: e.target.value })} onBlur={computeTotal} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">GST Amount ()</label>
              <input type="number" min="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.gst_amount} onChange={(e) => setForm({ ...form, gst_amount: e.target.value })} onBlur={computeTotal} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Discount (₹)</label>
              <input type="number" min="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} onBlur={computeTotal} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Payment Method</label>
              <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Final Amount ()</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input type="number" min="0" className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-lg font-bold focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" value={form.final_amount} onChange={(e) => setForm({ ...form, final_amount: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
              disabled={!ticket || submitting || !form.final_amount || Number(form.final_amount) <= 0}
              onClick={submitSale}
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><ShoppingBag className="w-4 h-4" /> Complete Sale & Return to Reception</>}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Sales</h3>
          {loading ? <div className="text-gray-400 text-sm text-center py-8">Loading…</div>
            : sales.length === 0 ? <div className="text-gray-400 text-sm text-center py-8">No sales recorded yet</div>
              : <ul className="space-y-3 max-h-[600px] overflow-y-auto">
                {sales.slice(0, 20).map((s) => (
                  <li key={s.id} className="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition card-hover">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-700">{s.invoice_number}</span>
                      <span className="font-bold text-gray-900 flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {Number(s.final_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      {s.payment_method} · {formatDateTime(s.created_at)}
                    </div>
                  </li>
                ))}
              </ul>}
        </div>
      </div>
    </div>
  );
}
