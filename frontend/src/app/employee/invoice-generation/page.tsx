"use client";

import { useEffect, useState } from "react";
import {
  FileText, Search, Loader2, RefreshCw, Download, Eye,
  IndianRupee, CheckCircle2, Printer,
} from "lucide-react";
import { invoicesApi, salesApi, ticketsApi } from "@/lib/supabase/database";
import { formatDateTime } from "@/lib/utils";

export default function InvoiceGenerationPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [inv, s] = await Promise.all([
        invoicesApi.list().catch(() => []),
        salesApi.list().catch(() => []),
      ]);
      setInvoices(inv);
      setSales(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function generateInvoice(sale: any) {
    setGenerating(true);
    setError(null);
    try {
      const invoiceNum = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const invoice = await invoicesApi.create({
        sale_id: sale.id,
        invoice_number: invoiceNum,
        invoice_data: {
          customer_name: sale.customers?.name || sale.customer_name,
          total_amount: sale.final_amount,
          payment_method: sale.payment_method,
          items: sale.products || [],
        },
        status: "generated",
      });
      await load();
      setSelectedInvoice(invoice);
    } catch (err: any) {
      setError(err?.message || "Failed to generate invoice");
    } finally {
      setGenerating(false);
    }
  }

  const salesWithoutInvoice = sales.filter((s) => !invoices.some((i) => i.sale_id === s.id));

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return inv.invoice_number?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Invoice Generation</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and manage invoices for completed sales</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate New Invoice */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Generate New Invoice</h3>
          <p className="text-sm text-gray-500 mb-4">Sales without invoices — click to generate</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-10 text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</div>
          ) : salesWithoutInvoice.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <div className="font-semibold text-gray-600">All sales have invoices</div>
              <div className="text-sm mt-1">No pending invoices to generate</div>
            </div>
          ) : (
            <div className="space-y-3">
              {salesWithoutInvoice.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition">
                  <div>
                    <div className="font-semibold text-gray-900">{s.customers?.name || "Customer"}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDateTime(s.created_at)} · {s.payment_method} · ₹{Number(s.final_amount).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <button
                    onClick={() => generateInvoice(s)}
                    disabled={generating}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-indigo-500 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Generate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Invoices</h3>
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              placeholder="Search invoices…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No invoices yet</div>
          ) : (
            <ul className="space-y-2">
              {filteredInvoices.slice(0, 10).map((inv) => (
                <li key={inv.id} className="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700">{inv.invoice_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === "generated" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>{inv.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatDateTime(inv.created_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
          <div className="rounded-2xl bg-white max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-indigo-600 font-semibold">Royal Jewellers</div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>Invoice</h3>
                  <div className="font-mono text-indigo-700 font-bold mt-1">{selectedInvoice.invoice_number}</div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" onClick={() => setSelectedInvoice(null)}>✕</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-semibold text-gray-900">{formatDateTime(selectedInvoice.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-semibold text-emerald-600 capitalize">{selectedInvoice.status}</div>
                </div>
              </div>

              {selectedInvoice.invoice_data && (
                <div className="p-4 rounded-xl bg-gray-50 space-y-2">
                  <div className="text-xs text-gray-500">Invoice Details</div>
                  {selectedInvoice.invoice_data.customer_name && (
                    <div className="text-sm text-gray-700">Customer: <span className="font-semibold">{selectedInvoice.invoice_data.customer_name}</span></div>
                  )}
                  {selectedInvoice.invoice_data.total_amount && (
                    <div className="text-sm text-gray-700">Amount: <span className="font-bold">₹{Number(selectedInvoice.invoice_data.total_amount).toLocaleString("en-IN")}</span></div>
                  )}
                  {selectedInvoice.invoice_data.payment_method && (
                    <div className="text-sm text-gray-700 capitalize">Payment: {selectedInvoice.invoice_data.payment_method}</div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-indigo-400 hover:to-indigo-500 transition">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
