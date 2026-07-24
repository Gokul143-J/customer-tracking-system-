"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, RefreshCw, Loader2, CheckCircle2, XCircle,
  Phone, MapPin, Timer, ScanLine, Keyboard, Crown, Award, TimerReset,
} from "lucide-react";
import { ticketsApi, sectionTimeApi, movementsApi } from "@/lib/supabase/database";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime, formatDuration, prettySection } from "@/lib/utils";

const VALID_SECTIONS = ["gold", "silver", "diamond", "platinum"];

export default function SectionViewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [checkoutModal, setCheckoutModal] = useState<any>(null);

  const mySection = user?.assigned_section || "";

  // Guard: section managers must have an assigned section
  useEffect(() => {
    if (user && user.role === "section_manager" && !user.assigned_section) {
      setMessageType("error");
      setMessage("No section assigned. Please contact admin.");
    }
  }, [user]);

  const loadCustomers = useCallback(async () => {
    if (!mySection) return;
    setLoading(true);
    try {
      const all = await ticketsApi.list("ACTIVE");
      setAllTickets(all);
      const mine = all.filter((t: any) => t.target_section === mySection);
      setCustomers(mine);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [mySection]);

  useEffect(() => { loadCustomers(); const id = setInterval(loadCustomers, 10000); return () => clearInterval(id); }, [loadCustomers]);

  function getTotalStoreTime(ticket: any): string | null {
    if (!ticket.created_at) return null;
    const entry = new Date(ticket.created_at).getTime();
    const exit = ticket.closed_at ? new Date(ticket.closed_at).getTime() : Date.now();
    const seconds = Math.floor((exit - entry) / 1000);
    if (seconds <= 0) return null;
    return formatDuration(seconds);
  }

  async function handleScanned(ticketNumber: string) {
    setProcessing(true); setMessage(null);
    try {
      // Fetch fresh data
      const all = await ticketsApi.list();
      const ticket = all.find((t: any) => t.ticket_number?.toLowerCase() === ticketNumber.toLowerCase().trim());
      if (!ticket) { setMessageType("error"); setMessage("Ticket not found"); setProcessing(false); return; }
      if (ticket.status !== "ACTIVE") { setMessageType("error"); setMessage(`Ticket is ${ticket.status} — only active tickets can be scanned`); setProcessing(false); return; }
      if (ticket.target_section !== mySection) { setMessageType("error"); setMessage(`Customer is assigned to ${prettySection(ticket.target_section)}, not your section (${prettySection(mySection)})`); setProcessing(false); return; }

      // Already checked in to my section → open checkout modal
      if (ticket.current_section === mySection) { setCheckoutModal(ticket); setProcessing(false); return; }

      const now = new Date();
      const existingLogs = await sectionTimeApi.byTicket(ticket.id);
      const fromSection = ticket.current_section || "reception";

      // 1. Close open time log for the section they're leaving
      const openExitLog = existingLogs.find((l: any) => l.section === fromSection && !l.exit_time);
      if (!openExitLog) {
        await sectionTimeApi.create({
          ticket_id: ticket.id,
          customer_id: ticket.customer_id,
          section: fromSection,
          entry_time: ticket.created_at,
          exit_time: now.toISOString(),
          duration_seconds: Math.max(0, Math.floor((now.getTime() - new Date(ticket.created_at).getTime()) / 1000)),
        });
      }

      // 2. Record movement
      await movementsApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        from_section: fromSection,
        to_section: mySection,
        reason: "Checked in via QR scan",
        time_spent_seconds: 0,
      });

      // 3. Update ticket's current section (single source of truth)
      await ticketsApi.update(ticket.id, { current_section: mySection, updated_at: now.toISOString() });

      // 4. Open new time log for my section (only if not already open)
      const alreadyHasMyEntry = existingLogs.some((l: any) => l.section === mySection && !l.exit_time);
      if (!alreadyHasMyEntry) {
        await sectionTimeApi.create({
          ticket_id: ticket.id,
          customer_id: ticket.customer_id,
          section: mySection,
          entry_time: now.toISOString(),
          exit_time: null,
          duration_seconds: 0,
        });
      }

      setMessageType("success");
      setMessage(`✅ ${ticket.customer?.name || "Customer"} checked in to ${prettySection(mySection)}`);
      await loadCustomers();
    } catch (err: any) {
      console.error("Check-in error:", err);
      setMessageType("error");
      setMessage("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleCheckout(action: "buying" | "transfer") {
    if (!checkoutModal) return;
    setProcessing(true);
    try {
      const now = new Date();
      const ticket = checkoutModal;

      // Close open time log for my section
      const timeLogs = await sectionTimeApi.byTicket(ticket.id);
      const currentEntry = timeLogs.filter((l: any) => l.section === mySection && !l.exit_time).pop();
      if (currentEntry) {
        const durationSeconds = Math.max(0, Math.floor((now.getTime() - new Date(currentEntry.entry_time).getTime()) / 1000));
        await sectionTimeApi.update(currentEntry.id, { exit_time: now.toISOString(), duration_seconds: durationSeconds });
      }

      if (action === "buying") {
        // Navigate to sales — the sales page will handle the rest
        router.push("/employee/sales-billing");
      } else {
        // Transfer: prompt for target section
        const next = prompt(`Transfer customer to which section?\n\nOptions: ${VALID_SECTIONS.join(", ")}`);
        if (!next) { setMessage(null); setProcessing(false); setCheckoutModal(null); return; }
        const normalized = next.trim().toLowerCase();
        if (!VALID_SECTIONS.includes(normalized)) {
          setMessageType("error"); setMessage(`Invalid section. Choose from: ${VALID_SECTIONS.join(", ")}`); setProcessing(false); return;
        }
        if (normalized === mySection) {
          setMessageType("error"); setMessage("Customer is already in your section."); setProcessing(false); return;
        }

        // Record movement
        await movementsApi.create({
          ticket_id: ticket.id,
          customer_id: ticket.customer_id,
          from_section: mySection,
          to_section: normalized,
          reason: "Transferred by section manager",
          time_spent_seconds: 0,
        });

        // Update BOTH target_section AND current_section to keep state consistent
        await ticketsApi.update(ticket.id, {
          target_section: normalized,
          current_section: normalized,
          updated_at: now.toISOString(),
        });

        // Open new time log for destination section
        await sectionTimeApi.create({
          ticket_id: ticket.id,
          customer_id: ticket.customer_id,
          section: normalized,
          entry_time: now.toISOString(),
          exit_time: null,
          duration_seconds: 0,
        });

        setMessageType("success");
        setMessage(`✅ Transferred to ${prettySection(normalized)}. Customer removed from your section.`);
      }
      setCheckoutModal(null);
      await loadCustomers();
    } catch (err: any) {
      console.error("Checkout error:", err);
      setMessageType("error");
      setMessage("Failed to process checkout");
    } finally {
      setProcessing(false);
    }
  }

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualInput.trim();
    if (val) { handleScanned(val); setManualInput(""); }
  };

  if (!mySection) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Section Assigned</h2>
        <p className="text-gray-500">Please ask the administrator to assign you to a section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{prettySection(mySection)}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {customers.length} customer{customers.length !== 1 ? "s" : ""} in your section · {allTickets.length} total active tickets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium">
            <MapPin className="w-4 h-4 inline mr-2" />{prettySection(mySection)}
          </div>
          <button onClick={loadCustomers} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Scanner + Manual Input */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold flex items-center gap-2">
            <ScanLine className="w-4 h-4" /> Camera Scanner
          </div>
          <form onSubmit={handleManual} className="flex gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="Or type ticket number..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition">Enter</button>
          </form>
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${messageType === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {messageType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message}
          </div>
        )}
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> Loading...
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white border border-gray-100 p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <div className="text-gray-700 font-semibold">No customers in your section</div>
            <div className="text-gray-500 text-sm mt-1">Customers assigned to {prettySection(mySection)} will appear here</div>
          </div>
        ) : customers.map((t) => {
          const isCheckedIn = t.current_section === mySection;
          const isVIP = t.customer?.visit_count > 2;
          const totalStoreTime = getTotalStoreTime(t);
          return (
            <div
              key={t.id}
              className={`rounded-2xl border p-5 transition hover:shadow-lg hover:-translate-y-0.5 card-hover ${
                isCheckedIn ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-md" : "bg-white border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg relative ${
                    isCheckedIn ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white" : "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                  }`}>
                    {t.customer?.name?.charAt(0).toUpperCase() || "?"}
                    {isVIP && <Crown className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 bg-white rounded-full p-0.5" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1">
                      {t.customer?.name || "Unknown Customer"}
                      {isVIP && <Award className="w-3 h-3 text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" /> {t.customer?.phone || "—"}</div>
                    {isVIP && <div className="text-xs text-amber-600 font-medium mt-0.5">VIP · {t.customer.visit_count} visits</div>}
                    {t.customer?.visit_count > 1 && !isVIP && <div className="text-xs text-gray-500 mt-0.5">{t.customer.visit_count} visits</div>}
                  </div>
                </div>
                {isCheckedIn && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Section
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-gray-50">
                  <div className="text-gray-500">Ticket</div>
                  <div className="font-mono font-bold text-indigo-700">{t.ticket_number}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-50">
                  <div className="text-gray-500">Entry Time</div>
                  <div className="font-semibold text-gray-900">{formatDateTime(t.created_at)}</div>
                </div>
              </div>

              {totalStoreTime && (
                <div className="mb-3 p-2 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-2 text-xs">
                  <TimerReset className="w-3 h-3 text-indigo-600" />
                  <span className="text-gray-600">Total in store:</span>
                  <span className="font-bold text-indigo-700">{totalStoreTime}</span>
                </div>
              )}

              <div className="flex gap-2">
                {!isCheckedIn ? (
                  <button
                    onClick={() => handleScanned(t.ticket_number)}
                    disabled={processing}
                    className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-400 hover:to-emerald-500 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Check In
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setCheckoutModal(t)}
                      disabled={processing}
                      className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-400 hover:to-amber-500 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Timer className="w-4 h-4" /> Check Out
                    </button>
                    <button
                      onClick={() => router.push("/employee/sales-billing")}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition flex items-center justify-center gap-1.5"
                      title="Process sale"
                    >
                      💰 Sale
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCheckoutModal(null)}>
          <div className="rounded-2xl bg-white max-w-md w-full p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xl mb-3">
                {checkoutModal.customer?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{checkoutModal.customer?.name || "Customer"}</h3>
              <p className="text-sm text-gray-500 mt-1">{checkoutModal.ticket_number} · {checkoutModal.customer?.phone || "—"}</p>
              <p className="text-sm text-amber-600 mt-1">Currently in {prettySection(mySection)}</p>
              {checkoutModal.customer?.notes && (
                <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">📝 {checkoutModal.customer.notes}</p>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleCheckout("buying")}
                disabled={processing}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                 Customer is Buying → Go to Billing
              </button>
              <button
                onClick={() => handleCheckout("transfer")}
                disabled={processing}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-400 hover:to-amber-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                🔄 Transfer to Another Section
              </button>
              <button
                onClick={() => setCheckoutModal(null)}
                className="w-full px-4 py-2 rounded-xl text-gray-500 text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <p className="text-xs text-gray-400 text-center pt-2">
                Only reception can close tickets (customer leaving shop)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
