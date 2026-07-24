"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, RefreshCw, Loader2, Clock, CheckCircle2, XCircle,
  Search, User, Phone, Ticket as TicketIcon, MapPin, Timer,
  ScanLine, Keyboard, Camera,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { ticketsApi, sectionTimeApi, movementsApi, customersApi } from "@/lib/supabase/database";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime, formatDuration, prettySection } from "@/lib/utils";

type CheckoutAction = "buying" | "leaving";

export default function SectionViewPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [checkoutModal, setCheckoutModal] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Get employee's assigned section
  const mySection = user?.assigned_section || "gold";

  const startScanner = () => {
    setScannerOpen(true);
  };

  const stopScanner = () => {
    setScannerOpen(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanned(manualInput.trim());
    setManualInput("");
  };

  // Process QR scan or manual input
  async function handleScanned(ticketNumber: string) {
    setProcessing(true);
    setMessage(null);

    try {
      // Find ticket by number
      const all = await ticketsApi.list();
      const ticket = all.find((t: any) =>
        t.ticket_number?.toLowerCase() === ticketNumber.toLowerCase()
      );

      if (!ticket) {
        setMessageType("error");
        setMessage("Ticket not found. Please check the number and try again.");
        setProcessing(false);
        return;
      }

      if (ticket.status !== "ACTIVE") {
        setMessageType("error");
        setMessage(`This ticket is ${ticket.status.toLowerCase()}. Only active tickets can be scanned.`);
        setProcessing(false);
        return;
      }

      // If ticket's target_section doesn't match my section
      if (ticket.target_section !== mySection) {
        setMessageType("error");
        setMessage(`This customer is assigned to ${prettySection(ticket.target_section)}, not your section (${prettySection(mySection)}).`);
        setProcessing(false);
        return;
      }

      // If customer is already checked in to my section (current_section matches)
      if (ticket.current_section === mySection) {
        // Show checkout modal
        setCheckoutModal(ticket);
        setSelectedTicket(ticket);
        setProcessing(false);
        return;
      }

      // CHECK-IN: Customer is entering my section for the first time
      const now = new Date();

      // Log exit from previous section (reception)
      if (ticket.current_section && ticket.current_section !== mySection) {
        try {
          await sectionTimeApi.create({
            ticket_id: ticket.id,
            customer_id: ticket.customer_id,
            section: ticket.current_section,
            entry_time: ticket.created_at,
            exit_time: now.toISOString(),
            duration_seconds: Math.floor((now.getTime() - new Date(ticket.created_at).getTime()) / 1000),
          });
        } catch (e) {
          console.error("Failed to log previous section exit:", e);
        }
      }

      // Create movement record
      await movementsApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        from_section: ticket.current_section || "reception",
        to_section: mySection,
        reason: "Customer checked in via QR scan",
        time_spent_seconds: 0,
      });

      // Update ticket's current section
      await ticketsApi.update(ticket.id, {
        current_section: mySection,
        updated_at: now.toISOString(),
      });

      // Log entry to my section
      await sectionTimeApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        section: mySection,
        entry_time: now.toISOString(),
        exit_time: null,
        duration_seconds: 0,
      });

      setMessageType("success");
      setMessage(`✅ ${ticket.customer?.name} checked in to ${prettySection(mySection)}`);
      setSelectedTicket(ticket);
      setScannerOpen(false);
      loadCustomers();
    } catch (err: any) {
      console.error("Scan error:", err);
      setMessageType("error");
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  }

  // Handle checkout
  async function handleCheckout(action: CheckoutAction) {
    if (!checkoutModal) return;
    setProcessing(true);

    try {
      const now = new Date();
      const ticket = checkoutModal;

      // Find the entry log for current section to calculate duration
      const timeLogs = await sectionTimeApi.byTicket(ticket.id);
      const currentEntry = timeLogs
        .filter((l: any) => l.section === mySection && !l.exit_time)
        .pop();

      const durationSeconds = currentEntry
        ? Math.floor((now.getTime() - new Date(currentEntry.entry_time).getTime()) / 1000)
        : 0;

      // Update the entry log with exit time
      if (currentEntry) {
        await sectionTimeApi.update(currentEntry.id, {
          exit_time: now.toISOString(),
          duration_seconds: durationSeconds,
        });
      }

      if (action === "buying") {
        // Redirect to sales/billing
        router.push("/employee/sales-billing");
      } else {
        // Customer leaving without buying - ask admin to decide
        const wantToSend = window.confirm(
          `Customer ${ticket.customer?.name} is leaving ${prettySection(mySection)}.\n\n` +
          `Click OK to send to another section.\n` +
          `Click Cancel if customer is leaving the store entirely.`
        );

        if (wantToSend) {
          const nextSection = prompt(
            "Which section should they go to?\nOptions: gold, silver, diamond, platinum"
          );
          
          if (!nextSection) {
            setMessageType("error");
            setMessage("Cancelled. No section selected.");
            setCheckoutModal(null);
            setProcessing(false);
            return;
          }
          
          const validSections = ["gold", "silver", "diamond", "platinum"];
          if (!validSections.includes(nextSection.toLowerCase())) {
            setMessageType("error");
            setMessage(`Invalid section: "${nextSection}". Must be one of: ${validSections.join(", ")}`);
            setProcessing(false);
            return;
          }

          await ticketsApi.update(ticket.id, {
            target_section: nextSection.toLowerCase(),
            updated_at: now.toISOString(),
          });
          setMessageType("success");
          setMessage(`✅ Customer sent to ${prettySection(nextSection.toLowerCase())}`);
        } else {
          // Close ticket - customer leaving store
          await ticketsApi.update(ticket.id, {
            status: "CLOSED",
            closed_at: now.toISOString(),
            updated_at: now.toISOString(),
          });
          setMessageType("success");
          setMessage(`✅ Ticket closed. ${ticket.customer?.name} has left the store.`);
        }
      }

      setCheckoutModal(null);
      setSelectedTicket(null);
      loadCustomers();
    } catch (err: any) {
      console.error("Checkout error:", err);
      setMessageType("error");
      setMessage("Failed to process checkout. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  async function loadCustomers() {
    setLoading(true);
    try {
      // Get all active tickets where target_section matches my section
      const all = await ticketsApi.list("ACTIVE");
      const myCustomers = all.filter((t: any) =>
        t.target_section === mySection
      );
      setCustomers(myCustomers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    const id = setInterval(loadCustomers, 10000);
    return () => clearInterval(id);
  }, [mySection]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.customer?.name?.toLowerCase().includes(q) ||
      c.customer?.phone?.includes(q) ||
      c.ticket_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            {prettySection(mySection)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} customer{filtered.length !== 1 ? "s" : ""} in your section
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium">
            <MapPin className="w-4 h-4 inline mr-2" />
            {prettySection(mySection)}
          </div>
          <button onClick={loadCustomers} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Scanner & Search Row */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={scannerOpen ? stopScanner : startScanner}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
              scannerOpen
                ? "bg-red-500 text-white"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            }`}
          >
            <ScanLine className="w-4 h-4" />
            {scannerOpen ? "Stop Scanner" : "Scan QR Code"}
          </button>

          <form onSubmit={handleManualSubmit} className="flex gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="Or type ticket number..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition">
              Enter
            </button>
          </form>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Scanner View */}
        {scannerOpen && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div id="qr-reader-section" className="max-w-md mx-auto" />
            <p className="text-xs text-gray-500 text-center mt-2">Point camera at customer's ticket QR code</p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            messageType === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {messageType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {message}
          </div>
        )}
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white border border-gray-100 p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <div className="text-gray-700 font-semibold">No customers in your section</div>
            <div className="text-gray-500 text-sm mt-1">
              Customers assigned to {prettySection(mySection)} will appear here
            </div>
          </div>
        ) : (
          filtered.map((t) => {
            const isCheckedIn = t.current_section === mySection;
            return (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 transition ${
                  isCheckedIn
                    ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-md"
                    : "bg-white border-gray-100 hover:border-indigo-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${
                      isCheckedIn
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                        : "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                    }`}>
                      {t.customer?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{t.customer?.name || "Customer"}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="w-3 h-3" /> {t.customer?.phone}
                      </div>
                    </div>
                  </div>
                  {isCheckedIn && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      In Section
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
                      >
                        💰 Sale
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCheckoutModal(null)}>
          <div className="rounded-2xl bg-white max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xl mb-3">
                {checkoutModal.customer?.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{checkoutModal.customer?.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {checkoutModal.ticket_number} · {checkoutModal.customer?.phone}
              </p>
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
                onClick={() => handleCheckout("leaving")}
                disabled={processing}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Customer is Leaving
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
