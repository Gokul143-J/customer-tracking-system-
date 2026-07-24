"use client";

import { useEffect, useState, useRef } from "react";
import {
  QrCode, CheckCircle2, Loader2, RefreshCw, AlertCircle,
  User, Phone, MapPin, Clock, Camera, Keyboard, ScanLine,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { ticketsApi, sectionTimeApi } from "@/lib/supabase/database";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime, formatDuration, prettySection } from "@/lib/utils";

export default function ScanSectionPage() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [inputMode, setInputMode] = useState<"camera" | "manual">("camera");

  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader";

  // Employee's assigned section (from their role/assignment)
  // For demo, we'll use a mapping - in production this comes from staff table
  const sectionMapping: Record<string, string> = {
    "gold_ring": "gold_ring",
    "gold_bangle": "gold_bangle",
    "gold_chain": "gold_chain",
    "necklace": "necklace",
    "diamond": "diamond",
    "silver": "silver",
    "platinum": "platinum",
    "reception": "reception",
  };

  // Get the scanner's section (employee's assigned section)
  const scannerSection = user?.assigned_section || "gold_bangle"; // Default for demo

  const startScanner = async () => {
    setError(null);
    setScanning(true);
    setCameraActive(true);

    try {
      const qrCode = new Html5Qrcode(scannerDivId);
      qrRef.current = qrCode;

      await qrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // QR scanned successfully
          console.log("Scanned:", decodedText);
          await stopScanner();
          await handleScannedTicket(decodedText);
        },
        (errorMessage) => {
          // QR scan error - ignore, keep scanning
          console.log("Scan error:", errorMessage);
        }
      );
    } catch (err: any) {
      setError("Camera access failed. Please allow camera permissions or use manual input.");
      setScanning(false);
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (qrRef.current) {
      try {
        await qrRef.current.stop();
        qrRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      qrRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  const handleScannedTicket = async (ticketNumber: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Find the ticket
      const allTickets = await ticketsApi.list();
      const ticket = allTickets.find((t: any) =>
        t.ticket_number?.toLowerCase() === ticketNumber.toLowerCase() ||
        t.id === ticketNumber
      );

      if (!ticket) {
        setError("Ticket not found");
        setLoading(false);
        return;
      }

      if (ticket.status !== "ACTIVE") {
        setError(`Ticket is ${ticket.status}. Cannot scan inactive ticket.`);
        setLoading(false);
        return;
      }

      // If customer is already in this section, skip
      if (ticket.current_section === scannerSection) {
        setError("Customer is already in this section");
        setLoading(false);
        return;
      }

      const previousSection = ticket.current_section;
      const now = new Date();

      // 1. Log exit from previous section
      if (previousSection && previousSection !== "reception") {
        const entryTime = new Date(ticket.created_at).getTime();
        const durationSeconds = Math.floor((now.getTime() - entryTime) / 1000);

        await sectionTimeApi.create({
          ticket_id: ticket.id,
          customer_id: ticket.customer_id,
          section: previousSection,
          entry_time: ticket.created_at,
          exit_time: now.toISOString(),
          duration_seconds: durationSeconds,
        });
      }

      // 2. Update ticket to new section
      await ticketsApi.update(ticket.id, {
        current_section: scannerSection,
        updated_at: now.toISOString(),
      });

      // 3. Log entry to new section
      await sectionTimeApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        section: scannerSection,
        entry_time: now.toISOString(),
        exit_time: null,
        duration_seconds: 0,
      });

      // 4. Create movement record
      const movementsApi = await import("@/lib/supabase/database").then(m => m.movementsApi);
      await movementsApi.create({
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        from_section: previousSection,
        to_section: scannerSection,
        reason: "QR scan at section entrance",
        time_spent_seconds: 0,
        created_at: now.toISOString(),
      });

      setScannedTicket({
        ...ticket,
        previous_section: previousSection,
        new_section: scannerSection,
        scan_time: now.toISOString(),
      });

      setSuccess(`Customer moved from ${prettySection(previousSection)} to ${prettySection(scannerSection)}`);

      // Add to recent scans
      setRecentScans(prev => [{
        ticket_number: ticket.ticket_number,
        customer_name: ticket.customer?.name,
        previous_section: previousSection,
        new_section: scannerSection,
        scan_time: now.toISOString(),
      }, ...prev].slice(0, 10));

    } catch (err: any) {
      setError(err.message || "Failed to process scan");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await handleScannedTicket(manualInput.trim());
    setManualInput("");
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (qrRef.current) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Section Scanner
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Scan customer QR code to track section entry
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium">
          <MapPin className="w-4 h-4 inline mr-2" />
          Your Section: <span className="font-bold">{prettySection(scannerSection)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Scan Customer QR
          </h3>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4 p-1 rounded-xl bg-gray-100">
            <button
              onClick={() => setInputMode("camera")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                inputMode === "camera" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" /> Camera
            </button>
            <button
              onClick={() => setInputMode("manual")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                inputMode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"
              }`}
            >
              <Keyboard className="w-4 h-4 inline mr-2" /> Manual
            </button>
          </div>

          {inputMode === "camera" ? (
            <div>
              <div id={scannerDivId} className="rounded-xl overflow-hidden bg-gray-100" style={{ width: "100%" }} />
              
              {!cameraActive && (
                <button
                  onClick={startScanner}
                  disabled={scanning}
                  className="w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Starting Camera...</>
                  ) : (
                    <><ScanLine className="w-4 h-4" /> Start Camera</>
                  )}
                </button>
              )}

              {cameraActive && (
                <button
                  onClick={stopScanner}
                  className="w-full mt-4 px-6 py-3 rounded-xl border-2 border-red-500 text-red-600 text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2"
                >
                  Stop Camera
                </button>
              )}

              <p className="text-xs text-gray-500 mt-3 text-center">
                Point camera at customer's ticket QR code
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Ticket Number
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g., JR-2026-68252"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim() || loading}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><QrCode className="w-4 h-4" /> Log Section Entry</>
                )}
              </button>
            </form>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> {success}
              </div>
              {scannedTicket && (
                <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-600 space-y-1">
                  <div className="font-semibold text-emerald-800">{scannedTicket.customer?.name}</div>
                  <div>Phone: {scannedTicket.customer?.phone}</div>
                  <div>Ticket: {scannedTicket.ticket_number}</div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Scanned at: {formatDateTime(scannedTicket.scan_time)}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            </div>
          )}
        </div>

        {/* Recent Scans */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Recent Scans
          </h3>
          {recentScans.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ScanLine className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <div className="font-semibold text-gray-600">No scans yet</div>
              <div className="text-sm mt-1">Scanned tickets will appear here</div>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentScans.map((scan, i) => (
                <li key={i} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span className="font-semibold text-gray-900 text-sm">{scan.customer_name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{scan.ticket_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span className="capitalize">{prettySection(scan.previous_section)}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-indigo-700 capitalize">{prettySection(scan.new_section)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDateTime(scan.scan_time)}
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
