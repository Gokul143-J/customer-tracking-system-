"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket, UserPlus, Loader2, Phone, Search, CheckCircle2, XCircle,
  Crown, Sparkles,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { customersApi, ticketsApi } from "@/lib/supabase/database";
import { formatDateTime, prettySection } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const SECTIONS = ["gold", "silver", "diamond", "platinum"];

export default function TicketGenerationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<"form" | "success">("form");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);

  const [customer, setCustomer] = useState({
    name: "", phone: "", gender: "", age: "", city: "", remarks: "",
  });
  const [targetSection, setTargetSection] = useState("gold");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  // Generate unique ticket number using timestamp + random
  function generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JR-${year}-${ts}${rand}`.slice(0, 18);
  }

  function validatePhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10 && /^[6-9]/.test(digits);
  }

  function formatPhoneDisplay(value: string): string {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function getPhoneError(phone: string): string | null {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 0) return null;
    if (digits.length < 10) return `Please enter 10 digits (${digits.length}/10)`;
    if (digits.length > 10) return "Phone number cannot exceed 10 digits";
    if (!/^[6-9]/.test(digits)) return "Mobile number must start with 6, 7, 8, or 9";
    return null;
  }

  function autoAssignSection(gender: string, age: string): string {
    if (!gender || !age) return "gold";
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return "gold";
    if (gender === "Female" && ageNum < 30) return "diamond";
    if (gender === "Female" && ageNum >= 30) return "gold";
    if (gender === "Male" && ageNum < 25) return "silver";
    if (gender === "Male" && ageNum >= 25 && ageNum < 40) return "gold";
    if (gender === "Male" && ageNum >= 40) return "platinum";
    return "gold";
  }

  const lookupPhone = useCallback(async () => {
    if (!phoneLookup.trim()) return;
    if (!validatePhone(phoneLookup)) {
      setError("Please enter a valid 10-digit mobile number starting with 6-9");
      return;
    }
    setLookingUp(true);
    setError(null);
    try {
      const c = await customersApi.byPhone(phoneLookup.trim());
      setFoundCustomer(c);
      setCustomer({
        name: c.name || "", phone: c.phone || "", gender: c.gender || "",
        age: c.age?.toString() || "", city: c.city || "", remarks: c.remarks || "",
      });
      if (c.gender && c.age) {
        setTargetSection(autoAssignSection(c.gender, c.age.toString()));
      }
    } catch {
      setFoundCustomer(null);
      setCustomer((p) => ({ ...p, phone: phoneLookup.trim(), name: "" }));
    } finally {
      setLookingUp(false);
    }
  }, [phoneLookup]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    const name = customer.name.trim();
    if (!name) { setError("Customer name is required"); return; }
    if (name.length < 2) { setError("Name must be at least 2 characters"); return; }
    if (name.length > 50) { setError("Name must be 50 characters or less"); return; }

    if (!customer.phone) { setError("Phone number is required"); return; }
    const phoneErr = getPhoneError(customer.phone);
    if (phoneErr) { setError(phoneErr); return; }

    if (customer.age) {
      const ageNum = parseInt(customer.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        setError("Age must be between 1 and 120");
        return;
      }
    }

    if (!SECTIONS.includes(targetSection)) {
      setError("Please select a valid section");
      return;
    }

    // Check for duplicate active ticket
    try {
      const existingCustomer = await customersApi.byPhone(customer.phone);
      if (existingCustomer) {
        const activeTickets = await ticketsApi.list("ACTIVE");
        const hasActive = activeTickets.some((t: any) => t.customer_id === existingCustomer.id);
        if (hasActive) {
          const activeTicket = activeTickets.find((t: any) => t.customer_id === existingCustomer.id);
          setError(`This customer already has an active ticket (${activeTicket?.ticket_number}). Please close it first.`);
          return;
        }
      }
    } catch { /* Customer doesn't exist yet - that's fine */ }

    setSubmitting(true);
    try {
      let customerId: string;
      try {
        const existing = await customersApi.byPhone(customer.phone);
        customerId = existing.id;
        await customersApi.update(customerId, {
          ...customer,
          name,
          age: customer.age ? Number(customer.age) : null,
          visit_count: (existing.visit_count || 0) + 1,
          last_visit: new Date().toISOString(),
        });
      } catch {
        const newCustomer = await customersApi.create({
          ...customer,
          name,
          age: customer.age ? Number(customer.age) : null,
          visit_count: 1,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
        });
        customerId = newCustomer.id;
      }

      const ticketNum = generateTicketNumber();
      const t = await ticketsApi.create({
        ticket_number: ticketNum,
        customer_id: customerId,
        target_section: targetSection,
        current_section: "reception",
        status: "ACTIVE",
        created_by: user?.id,
      });
      setCreatedTicket(t);
      setStep("success");
    } catch (err: any) {
      setError(err?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setCustomer({ name: "", phone: "", gender: "", age: "", city: "", remarks: "" });
    setTargetSection("gold");
    setPhoneLookup("");
    setFoundCustomer(null);
    setCreatedTicket(null);
    setStep("form");
    setError(null);
  }

  const isVIP = foundCustomer?.visit_count > 2;

  if (step === "success" && createdTicket) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Ticket Generated Successfully!</h1>
          <p className="text-sm text-gray-500 mt-2">Welcome {createdTicket.customer?.name || "Customer"}! Please show this at the counter.</p>

          <div className="mt-6 bg-gradient-to-br from-amber-50 to-white border-2 border-dashed border-amber-300 rounded-2xl p-8">
            <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Royal Jewellers</div>
            <div className="text-4xl font-bold text-gray-900 mt-3 font-mono">{createdTicket.ticket_number}</div>

            <div className="grid grid-cols-2 gap-4 mt-6 text-left">
              <div>
                <div className="text-xs text-gray-500">Customer</div>
                <div className="font-bold text-gray-900 flex items-center gap-1">
                  {createdTicket.customer?.name || customer.name}
                  {isVIP && <Crown className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div className="font-bold text-gray-900">{createdTicket.customer?.phone || customer.phone}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Entry Time</div>
                <div className="font-bold text-gray-900">{formatDateTime(createdTicket.created_at || new Date().toISOString())}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Assigned Section</div>
                <div className="font-bold text-amber-700 capitalize">{prettySection(createdTicket.target_section || targetSection)}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <QRCodeSVG value={createdTicket.ticket_number} size={160} level="H" includeMargin={true} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Scan QR code for quick ticket lookup</p>
          </div>

          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <button onClick={resetForm} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold text-sm hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> New Ticket
            </button>
            <button onClick={() => router.push("/employee/my-tickets")} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
              View All Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>New Ticket</h1>
      <p className="text-sm text-gray-500 mt-1">Register a visitor and generate a digital ticket.</p>

      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm mt-6">
        <div className="flex items-end gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Lookup by Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="tel"
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="Enter 10-digit mobile number"
                value={phoneLookup}
                onChange={(e) => { setPhoneLookup(formatPhoneDisplay(e.target.value)); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && lookupPhone()}
                maxLength={10}
              />
              <span className="absolute right-3 top-3.5 text-xs text-gray-400">{phoneLookup.length}/10</span>
            </div>
          </div>
          <button
            type="button"
            onClick={lookupPhone}
            disabled={lookingUp || phoneLookup.length !== 10}
            className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Lookup
          </button>
        </div>

        {foundCustomer && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Returning customer found
            {isVIP && <><Crown className="w-4 h-4 text-amber-500 ml-2" /> <span className="text-amber-700 font-semibold">VIP · {foundCustomer.visit_count} visits</span></>}
            {!isVIP && <span className="ml-2">· Visit count: {foundCustomer.visit_count}</span>}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Full Name *</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                required
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Mobile Number * (10 digits, starts with 6-9)</label>
              <div className="relative">
                <input
                  type="tel"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-4 pr-12 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  value={customer.phone}
                  onChange={(e) => { setCustomer({ ...customer, phone: formatPhoneDisplay(e.target.value) }); setError(null); }}
                  placeholder="9876543210"
                  required
                  maxLength={10}
                />
                <span className="absolute right-3 top-3.5 text-xs text-gray-400">{customer.phone.length}/10</span>
              </div>
              {getPhoneError(customer.phone) && <p className="text-xs text-red-500 mt-1">{getPhoneError(customer.phone)}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Gender</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={customer.gender}
                onChange={(e) => { const gender = e.target.value; setCustomer({ ...customer, gender }); setTargetSection(autoAssignSection(gender, customer.age)); }}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Age (1-120)</label>
              <input
                type="number"
                min="1"
                max="120"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={customer.age}
                onChange={(e) => { const age = e.target.value; setCustomer({ ...customer, age }); if (customer.gender) setTargetSection(autoAssignSection(customer.gender, age)); }}
                placeholder="e.g. 32"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">City</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={customer.city}
                onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                placeholder="Mumbai"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Assign to Section *</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
              >
                {SECTIONS.map((s) => <option key={s} value={s}>{prettySection(s)}</option>)}
              </select>
              {customer.gender && customer.age && (
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-suggested based on profile
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Remarks</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition min-h-[70px]"
                value={customer.remarks}
                onChange={(e) => setCustomer({ ...customer, remarks: e.target.value })}
                placeholder="Any notes…"
                maxLength={200}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm p-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={submitting || (customer.phone.length > 0 && !validatePhone(customer.phone))}
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Ticket className="w-4 h-4" /> Generate Ticket</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
