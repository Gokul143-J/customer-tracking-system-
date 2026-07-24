"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, RefreshCw, Loader2, Clock, CheckCircle2, XCircle,
  Search, Phone, MapPin, Timer, ScanLine, Keyboard,
} from "lucide-react";
import { ticketsApi, sectionTimeApi, movementsApi } from "@/lib/supabase/database";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime, formatDuration, prettySection } from "@/lib/utils";

export default function SectionViewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [checkoutModal, setCheckoutModal] = useState<any>(null);

  const mySection = user?.assigned_section || "gold";

  async function loadCustomers() {
    setLoading(true);
    try {
      const all = await ticketsApi.list("ACTIVE");
      // CRITICAL: Only show customers whose target_section matches our section
      const mine = all.filter((t: any) => t.target_section === mySection);
      setCustomers(mine);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { loadCustomers(); const id = setInterval(loadCustomers, 10000); return () => clearInterval(id); }, [mySection]);

  async function handleScanned(ticketNumber: string) {
    setProcessing(true); setMessage(null);
    try {
      const all = await ticketsApi.list();
      const ticket = all.find((t: any) => t.ticket_number?.toLowerCase() === ticketNumber.toLowerCase());
      if (!ticket) { setMessageType("error"); setMessage("Ticket not found"); setProcessing(false); return; }
      if (ticket.status !== "ACTIVE") { setMessageType("error"); setMessage(`Ticket is ${ticket.status}`); setProcessing(false); return; }
      if (ticket.target_section !== mySection) { setMessageType("error"); setMessage(`Customer is assigned to ${prettySection(ticket.target_section)}, not your section`); setProcessing(false); return; }
      if (ticket.current_section === mySection) { setCheckoutModal(ticket); setProcessing(false); return; }

      const now = new Date();
      // Log exit from previous section
      if (ticket.current_section && ticket.current_section !== mySection) {
        try {
          await sectionTimeApi.create({ ticket_id: ticket.id, customer_id: ticket.customer_id, section: ticket.current_section, entry_time: ticket.created_at, exit_time: now.toISOString(), duration_seconds: Math.floor((now.getTime() - new Date(ticket.created_at).getTime()) / 1000) });
        } catch (e) { console.error(e); }
      }
      await movementsApi.create({ ticket_id: ticket.id, customer_id: ticket.customer_id, from_section: ticket.current_section || "reception", to_section: mySection, reason: "QR scan check-in", time_spent_seconds: 0 });
      await ticketsApi.update(ticket.id, { current_section: mySection, updated_at: now.toISOString() });
      await sectionTimeApi.create({ ticket_id: ticket.id, customer_id: ticket.customer_id, section: mySection, entry_time: now.toISOString(), exit_time: null, duration_seconds: 0 });
      setMessageType("success"); setMessage(`✅ ${ticket.customer?.name} checked in to ${prettySection(mySection)}`);
      loadCustomers();
    } catch (err: any) { setMessageType("error"); setMessage("Network error. Please try again."); } finally { setProcessing(false); }
  }

  async function handleCheckout(action: "buying" | "leaving") {
    if (!checkoutModal) return;
    setProcessing(true);
    try {
      const now = new Date();
      const ticket = checkoutModal;
      const timeLogs = await sectionTimeApi.byTicket(ticket.id);
      const currentEntry = timeLogs.filter((l: any) => l.section === mySection && !l.exit_time).pop();
      const durationSeconds = currentEntry ? Math.floor((now.getTime() - new Date(currentEntry.entry_time).getTime()) / 1000) : 0;
      if (currentEntry) await sectionTimeApi.update(currentEntry.id, { exit_time: now.toISOString(), duration_seconds: durationSeconds });

      if (action === "buying") { router.push("/employee/sales-billing"); }
      else {
        const wantToSend = window.confirm(`Customer ${ticket.customer?.name} is leaving.\n\nOK = Send to another section\nCancel = Customer leaving store`);
        if (wantToSend) {
          const next = prompt("Enter next section (gold, silver, diamond, platinum):");
          if (next && ["gold", "silver", "diamond", "platinum"].includes(next.toLowerCase())) {
            await ticketsApi.update(ticket.id, { target_section: next.toLowerCase(), updated_at: now.toISOString() });
            setMessageType("success"); setMessage(`Customer sent to ${prettySection(next.toLowerCase())}`);
          }
        } else {
          await ticketsApi.update(ticket.id, { status: "CLOSED", closed_at: now.toISOString(), updated_at: now.toISOString() });
          setMessageType("success"); setMessage(`Ticket closed. ${ticket.customer?.name} has left the store.`);
        }
      }
      setCheckoutModal(null); loadCustomers();
    } catch (err: any) { setMessageType("error"); setMessage("Checkout failed"); } finally { setProcessing(false); }
  }

  const handleManual = (e: React.FormEvent) => { e.preventDefault(); if (manualInput.trim()) { handleScanned(manualInput.trim()); setManualInput(""); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{prettySection(mySection)}</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} customer{customers.length !== 1 ? "s" : ""} in your section</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium"><MapPin className="w-4 h-4 inline mr-2" />{prettySection(mySection)}</div>
          <button onClick={loadCustomers} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold flex items-center gap-2">
            <ScanLine className="w-4 h-4" /> Camera Scanner
          </div>
          <form onSubmit={handleManual} className="flex gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition" placeholder="Or type ticket number..." value={manualInput} onChange={(e) => setManualInput(e.target.value)} />
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition">Enter</button>
          </form>
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${messageType === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {messageType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-full text-center py-20 text-gray-400"><Loader2 className="w-6 h-6 animate-spin inline mr-2" /> Loading...</div>
          : customers.length === 0
            ? <div className="col-span-full rounded-2xl bg-white border border-gray-100 p-12 text-center"><Users className="w-12 h-12 mx-auto text-gray-300 mb-3" /><div className="text-gray-700 font-semibold">No customers in your section</div><div className="text-gray-500 text-sm mt-1">Customers assigned to {prettySection(mySection)} will appear here</div></div>
            : customers.map((t) => {
                const isCheckedIn = t.current_section === mySection;
                return (
                  <div key={t.id} className={`rounded-2xl border p-5 transition ${isCheckedIn ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-md" : "bg-white border-gray-100 hover:border-indigo-200"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${isCheckedIn ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white" : "bg-gradient-to-br from-amber-400 to-amber-600 text-white"}`}>
                          {t.customer?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{t.customer?.name || "Customer"}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" /> {t.customer?.phone}</div>
                        </div>
                      </div>
                      {isCheckedIn && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />In Section</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="p-2 rounded-lg bg-gray-50"><div className="text-gray-500">Ticket</div><div className="font-mono font-bold text-indigo-700">{t.ticket_number}</div></div>
                      <div className="p-2 rounded-lg bg-gray-50"><div className="text-gray-500">Entry Time</div><div className="font-semibold text-gray-900">{formatDateTime(t.created_at)}</div></div>
                    </div>
                    <div className="flex gap-2">
                      {!isCheckedIn ? (
                        <button onClick={() => handleScanned(t.ticket_number)} disabled={processing} className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-400 hover:to-emerald-500 transition flex items-center justify-center gap-1.5 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Check In</button>
                      ) : (
                        <>
                          <button onClick={() => setCheckoutModal(t)} disabled={processing} className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-400 hover:to-amber-500 transition flex items-center justify-center gap-1.5 disabled:opacity-50"><Timer className="w-4 h-4" /> Check Out</button>
                          <button onClick={() => router.push("/employee/sales-billing")} className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition flex items-center justify-center gap-1.5">💰 Sale</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
      </div>

      {checkoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCheckoutModal(null)}>
          <div className="rounded-2xl bg-white max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xl mb-3">{checkoutModal.customer?.name?.charAt(0).toUpperCase()}</div>
              <h3 className="text-xl font-bold text-gray-900">{checkoutModal.customer?.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{checkoutModal.ticket_number} · {checkoutModal.customer?.phone}</p>
              <p className="text-sm text-amber-600 mt-1">Currently in {prettySection(mySection)}</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleCheckout("buying")} disabled={processing} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50">💰 Customer is Buying → Go to Billing</button>
              <button onClick={() => handleCheckout("leaving")} disabled={processing} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50"><XCircle className="w-4 h-4" /> Customer is Leaving</button>
              <button onClick={() => setCheckoutModal(null)} className="w-full px-4 py-2 rounded-xl text-gray-500 text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
