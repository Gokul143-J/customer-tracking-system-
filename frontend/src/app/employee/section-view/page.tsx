"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import {
  Users, RefreshCw, Loader2, CheckCircle2, XCircle,
  Phone, MapPin, Timer, Keyboard, Crown, Award, TimerReset, QrCode, Camera,
} from "lucide-react";
import { ticketsApi, sectionTimeApi, movementsApi, auditLogsApi } from "@/lib/supabase/database";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime, formatDuration, prettySection } from "@/lib/utils";

export default function SectionViewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [allActiveTickets, setAllActiveTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [checkoutModal, setCheckoutModal] = useState<any>(null);
  const [scannerActive, setScannerActive] = useState(false);

  const mySection = user?.assigned_section || "";
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // QR Scanner effect
  useEffect(() => {
    if (!scannerActive) return;

    const startScanner = async () => {
      try {
        // Create scanner if it doesn't exist
        if (!qrScannerRef.current) {
          qrScannerRef.current = new Html5Qrcode("qr-reader");
        }

        // Start scanning
        await qrScannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            // Stop scanner after successful scan
            try {
              await qrScannerRef.current?.stop();
            } catch (e) {
              // Ignore stop errors
            }
            setScannerActive(false);
            await handleCheckIn(decodedText);
          },
          () => {
            // Ignore scan failures (no QR detected yet)
          }
        );
      } catch (err: any) {
        console.error("Scanner start failed:", err);
        const errorMessage = typeof err === "string" ? err : err?.message || "Unknown error";
        setMessageType("error");
        setMessage(`Camera error: ${errorMessage}. Use manual entry instead.`);
        setScannerActive(false);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop().catch(() => {
            // Ignore stop errors during cleanup
          });
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, [scannerActive]);

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
      setAllActiveTickets(all);
      // Show only customers currently checked in to MY section
      const inMySection = all.filter((t: any) => t.current_section === mySection);
      setCustomers(inMySection);
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

  async function writeAuditLog(action: string, entityType: string, entityId: string, details: any) {
    try {
      await auditLogsApi.create({
        action,
        entity_type: entityType,
        entity_id: entityId,
        new_values: details,
        performed_by: user?.id,
      });
    } catch (e) { console.warn("Audit log failed:", e); }
  }

  // Check-in: by ticket number OR QR code
  async function handleCheckIn(ticketNumber: string) {
    setProcessing(true); setMessage(null);
    try {
      const all = await ticketsApi.list("ACTIVE");
      const ticket = all.find((t: any) => t.ticket_number?.toLowerCase() === ticketNumber.toLowerCase().trim());

      if (!ticket) { setMessageType("error"); setMessage("Ticket not found or already closed"); setProcessing(false); return; }
      if (ticket.status !== "ACTIVE") { setMessageType("error"); setMessage(`Ticket is ${ticket.status}`); setProcessing(false); return; }
      if (ticket.current_section === mySection) {
        setCheckoutModal(ticket);
        setProcessing(false);
        return;
      }

      const now = new Date();
      const fromSection = ticket.current_section || "idle";
      const existingLogs = await sectionTimeApi.byTicket(ticket.id);

      // Close any open time log for previous section
      const openExitLog = existingLogs.find((l: any) => l.section === fromSection && !l.exit_time);
      if (!openExitLog && fromSection !== "idle") {
        await sectionTimeApi.create({
          ticket_id: ticket.id,
          customer_id: ticket.customer_id,
          section: fromSection,
          entry_time: ticket.created_at,
          exit_time: now.toISOString(),
          duration_seconds: Math.max(0, Math.floor((now.getTime() - new Date(ticket.created_at).getTime()) / 1000)),
        });
      }

      // Record movement
      await movementsApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        from_section: fromSection,
        to_section: mySection,
        reason: `Checked in by ${user?.full_name || "employee"}`,
        time_spent_seconds: 0,
      });

      // Update ticket to my section
      await ticketsApi.update(ticket.id, { current_section: mySection, updated_at: now.toISOString() });

      // Open new time log for my section
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

      await writeAuditLog("CUSTOMER_CHECKED_IN", "ticket", ticket.id, {
        ticket_number: ticket.ticket_number,
        customer: ticket.customer?.name,
        from_section: fromSection,
        to_section: mySection,
        by: user?.full_name,
      });

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

  // Check-out: customer leaves section
  async function handleCheckout(action: "buying" | "idle") {
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
        await writeAuditLog("CUSTOMER_SENT_TO_BILLING", "ticket", ticket.id, {
          ticket_number: ticket.ticket_number,
          customer: ticket.customer?.name,
          section: mySection,
          by: user?.full_name,
        });
        router.push("/employee/sales-billing");
      } else {
        // Customer becomes IDLE - no section, waits to be checked in again
        await movementsApi.create({
          ticket_id: ticket.id,
          customer_id: ticket.customer_id,
          from_section: mySection,
          to_section: "idle",
          reason: `Checked out by ${user?.full_name || "employee"} - idle`,
          time_spent_seconds: 0,
        });

        // Set current_section to null (idle state)
        await ticketsApi.update(ticket.id, { current_section: null, updated_at: now.toISOString() });

        await writeAuditLog("CUSTOMER_CHECKED_OUT_IDLE", "ticket", ticket.id, {
          ticket_number: ticket.ticket_number,
          customer: ticket.customer?.name,
          from_section: mySection,
          by: user?.full_name,
        });

        setMessageType("success");
        setMessage(`✅ ${ticket.customer?.name} is now idle — waiting to be checked in elsewhere`);
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
    if (val) { handleCheckIn(val); setManualInput(""); }
  };

  const closeScanner = async () => {
    setScannerActive(false);
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
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
            {customers.length} customer{customers.length !== 1 ? "s" : ""} checked in · {allActiveTickets.length} total active in store
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

      {/* Check-in Panel */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Check In a Customer</h3>
          <span className="text-xs text-gray-500">— Scan QR or enter ticket number</span>
        </div>

        {/* QR Scanner */}
        <div className="mb-4">
          {!scannerActive ? (
            <button
              onClick={() => setScannerActive(true)}
              className="w-full px-4 py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50 transition flex items-center justify-center gap-3"
            >
              <Camera className="w-5 h-5" />
              <span>Tap to open QR Scanner</span>
              <QrCode className="w-5 h-5" />
            </button>
          ) : (
            <div className="rounded-xl overflow-hidden border-2 border-indigo-200">
              <div id="qr-reader" style={{ width: "100%" }} />
              <button
                onClick={closeScanner}
                className="w-full py-2 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
              >
                Close Scanner
              </button>
            </div>
          )}
        </div>

        {/* Manual entry */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Or enter ticket number manually</span>
          </div>
          <form onSubmit={handleManual} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              placeholder="e.g. JR-2026-XXXXX"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition">Check In</button>
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
            <div className="text-gray-700 font-semibold">No customers in {prettySection(mySection)}</div>
            <div className="text-gray-500 text-sm mt-1">Check in a customer using QR scan or ticket number above</div>
          </div>
        ) : customers.map((t) => {
          const isVIP = t.customer?.visit_count > 2;
          const totalStoreTime = getTotalStoreTime(t);
          return (
            <div
              key={t.id}
              className="rounded-2xl border p-5 transition hover:shadow-lg hover:-translate-y-0.5 card-hover bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg relative bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
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
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Checked In
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-white border border-gray-100">
                  <div className="text-gray-500">Ticket</div>
                  <div className="font-mono font-bold text-indigo-700">{t.ticket_number}</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-gray-100">
                  <div className="text-gray-500">Check-in Time</div>
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
                >
                   Sale
                </button>
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
                onClick={() => handleCheckout("idle")}
                disabled={processing}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold hover:from-gray-300 hover:to-gray-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                 Customer is Idle (waiting for next section)
              </button>
              <button
                onClick={() => setCheckoutModal(null)}
                className="w-full px-4 py-2 rounded-xl text-gray-500 text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
