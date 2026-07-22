"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket, UserPlus, Loader2, Phone, Search, CheckCircle2,
} from "lucide-react";
import { customersApi, ticketsApi } from "@/lib/supabase/database";
import { formatDateTime, prettySection } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const SECTIONS = [
  "gold_ring", "gold_bangle", "gold_chain", "necklace",
  "diamond", "silver", "platinum",
];

export default function TicketGenerationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<"form" | "success">("form");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    gender: "",
    age: "",
    city: "",
    remarks: "",
  });
  const [interested, setInterested] = useState<string[]>([]);
  const [current_section, setCurrentSection] = useState("reception");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  function toggleSection(s: string) {
    setInterested((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  // Validate phone - must be exactly 10 digits
  function validatePhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10;
  }

  function formatPhoneDisplay(value: string): string {
    // Only allow digits, max 10
    const digits = value.replace(/\D/g, "").slice(0, 10);
    return digits;
  }

  async function lookupPhone() {
    if (!phoneLookup.trim()) return;
    if (!validatePhone(phoneLookup)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLookingUp(true);
    setError(null);
    try {
      const c = await customersApi.byPhone(phoneLookup.trim());
      setFoundCustomer(c);
      setCustomer({
        name: c.name || "",
        phone: c.phone || "",
        gender: c.gender || "",
        age: c.age?.toString() || "",
        city: c.city || "",
        remarks: c.remarks || "",
      });
    } catch {
      setFoundCustomer(null);
      setCustomer((p) => ({ ...p, phone: phoneLookup.trim(), name: "" }));
    } finally {
      setLookingUp(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customer.name || !customer.phone) {
      setError("Name and phone are required");
      return;
    }

    if (!validatePhone(customer.phone)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      // Create or update customer
      let customerId: string;
      try {
        const existing = await customersApi.byPhone(customer.phone);
        customerId = existing.id;
        await customersApi.update(customerId, {
          ...customer,
          age: customer.age ? Number(customer.age) : null,
        });
      } catch {
        const newCustomer = await customersApi.create({
          ...customer,
          age: customer.age ? Number(customer.age) : null,
          visit_count: 1,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
        });
        customerId = newCustomer.id;
      }

      // Generate ticket number
      const ticketNum = `JR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

      // Create ticket
      const t = await ticketsApi.create({
        ticket_number: ticketNum,
        customer_id: customerId,
        interested_products: interested,
        current_section,
        status: "ACTIVE",
        created_by: user?.id,
        store_id: user?.store_id,
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
    setInterested([]);
    setPhoneLookup("");
    setFoundCustomer(null);
    setCreatedTicket(null);
    setCurrentSection("reception");
    setStep("form");
    setError(null);
  }

  if (step === "success" && createdTicket) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ticket Generated Successfully!
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Welcome {createdTicket.customer?.name || "Customer"}! Please show this at the counter.
          </p>

          <div className="mt-6 bg-gradient-to-br from-amber-50 to-white border-2 border-dashed border-amber-300 rounded-2xl p-8">
            <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Royal Jewellers</div>
            <div className="text-4xl font-bold text-gray-900 mt-3 font-mono">{createdTicket.ticket_number}</div>

            <div className="grid grid-cols-2 gap-4 mt-6 text-left">
              <div>
                <div className="text-xs text-gray-500">Customer</div>
                <div className="font-bold text-gray-900">{createdTicket.customer?.name || customer.name}</div>
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
                <div className="text-xs text-gray-500">Section</div>
                <div className="font-bold text-amber-700 capitalize">{prettySection(createdTicket.current_section || current_section)}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
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
        {/* Phone Lookup */}
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
                onChange={(e) => {
                  setPhoneLookup(formatPhoneDisplay(e.target.value));
                  setError(null);
                }}
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
            {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Lookup
          </button>
        </div>

        {foundCustomer && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Returning customer found · Visit count: {foundCustomer.visit_count}
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
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Mobile Number * (10 digits)</label>
              <div className="relative">
                <input
                  type="tel"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-4 pr-12 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  value={customer.phone}
                  onChange={(e) => {
                    const val = formatPhoneDisplay(e.target.value);
                    setCustomer({ ...customer, phone: val });
                    setError(null);
                  }}
                  placeholder="9876543210"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Please enter exactly 10 digits"
                />
                <span className="absolute right-3 top-3.5 text-xs text-gray-400">{customer.phone.length}/10</span>
              </div>
              {customer.phone && customer.phone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1">Please enter exactly 10 digits</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Gender</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={customer.gender}
                onChange={(e) => setCustomer({ ...customer, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Age</label>
              <input
                type="number"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={customer.age}
                onChange={(e) => setCustomer({ ...customer, age: e.target.value })}
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
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Starting Section</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                value={current_section}
                onChange={(e) => setCurrentSection(e.target.value)}
              >
                <option value="reception">Reception</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>{prettySection(s)}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Remarks</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition min-h-[70px]"
                value={customer.remarks}
                onChange={(e) => setCustomer({ ...customer, remarks: e.target.value })}
                placeholder="Any notes…"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Interested In</label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => {
                const active = interested.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSection(s)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-400"
                    }`}
                  >
                    {prettySection(s)}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm p-3">{error}</div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-400 hover:to-indigo-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={submitting || (customer.phone.length > 0 && customer.phone.length !== 10)}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><Ticket className="w-4 h-4" /> Generate Ticket</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
