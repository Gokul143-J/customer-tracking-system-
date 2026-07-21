"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  UserPlus,
  Loader2,
  QrCode,
  Phone,
  Search,
} from "lucide-react";
import { customersApi, ticketsApi } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import type { Customer, Ticket as TicketT } from "@/types";
import { formatDateTime } from "@/lib/utils";

const PURPOSES = ["Wedding", "Personal", "Gift", "Festival", "Anniversary", "Other"];
const BUDGETS = ["<25k", "25k-50k", "50k-1L", "1L-3L", "3L-5L", "5L+"];
const SECTIONS = [
  "gold_ring",
  "gold_bangle",
  "gold_chain",
  "necklace",
  "diamond",
  "silver",
  "platinum",
];

export default function ReceptionPage() {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "success">("form");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    gender: "",
    age: "",
    city: "",
    purpose: "",
    budget: "",
    remarks: "",
  });
  const [interested, setInterested] = useState<string[]>([]);
  const [current_section, setCurrentSection] = useState("reception");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<TicketT | null>(null);

  function toggleSection(s: string) {
    setInterested((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function lookupPhone() {
    if (!phoneLookup.trim()) return;
    setLookingUp(true);
    setError(null);
    try {
      const c = await customersApi.byPhone(phoneLookup.trim());
      setFoundCustomer(c);
      setCustomer({
        name: c.name,
        phone: c.phone,
        gender: c.gender || "",
        age: c.age?.toString() || "",
        city: c.city || "",
        purpose: c.purpose || "",
        budget: c.budget || "",
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
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          ...customer,
          age: customer.age ? Number(customer.age) : null,
        },
        ticket: {
          interested_products: interested,
          current_section,
          status: "ACTIVE",
        },
      };
      const t = await ticketsApi.create(payload);
      setCreatedTicket(t);
      setStep("success");
    } catch (err: any) {
      setError(err?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setCustomer({
      name: "",
      phone: "",
      gender: "",
      age: "",
      city: "",
      purpose: "",
      budget: "",
      remarks: "",
    });
    setInterested([]);
    setPhoneLookup("");
    setFoundCustomer(null);
    setCreatedTicket(null);
    setCurrentSection("reception");
    setStep("form");
  }

  if (step === "success" && createdTicket) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl text-ink-900">
            Ticket Generated
          </h1>
          <p className="text-ink-500 mt-1">
            Welcome {createdTicket.customer?.name}! Please show this at the
            counter.
          </p>

          <div className="mt-6 bg-gradient-to-br from-gold-50 to-white border-2 border-dashed border-gold-300 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-widest text-gold-600 font-semibold">
              Royal Jewellers
            </div>
            <div className="font-display text-3xl text-ink-900 mt-2">
              {createdTicket.ticket_number}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 text-left">
              <div>
                <div className="text-xs text-ink-500">Customer</div>
                <div className="font-semibold text-ink-900">
                  {createdTicket.customer?.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Phone</div>
                <div className="font-semibold text-ink-900">
                  {createdTicket.customer?.phone}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Entry Time</div>
                <div className="font-semibold text-ink-900">
                  {formatDateTime(createdTicket.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Starting Section</div>
                <div className="font-semibold text-gold-700 capitalize">
                  {createdTicket.current_section.replace("_", " ")}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="p-3 bg-white rounded-xl shadow-card">
                <QRCodeSVG value={createdTicket.ticket_number} size={160} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={resetForm} className="btn-primary">
              <UserPlus className="w-4 h-4" /> New Ticket
            </button>
            <button
              onClick={() => router.push(`/tickets`)}
              className="btn-outline"
            >
              View All Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-ink-900">New Customer Entry</h1>
      <p className="text-sm text-ink-500 mt-1">
        Register a visitor and generate a digital ticket.
      </p>

      <div className="card p-6 mt-6">
        <div className="flex items-end gap-3 mb-6">
          <div className="flex-1">
            <label className="label">Lookup by Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-ink-500" />
              <input
                type="tel"
                className="input pl-9"
                placeholder="+91 98765 43210"
                value={phoneLookup}
                onChange={(e) => setPhoneLookup(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupPhone()}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={lookupPhone}
            className="btn-outline"
            disabled={lookingUp}
          >
            {lookingUp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Lookup
          </button>
        </div>

        {foundCustomer && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            Returning customer found · Visit count: {foundCustomer.visit_count}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                placeholder="e.g. Priya Sharma"
                required
              />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                className="input"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                placeholder="+91 ..."
                required
              />
            </div>
            <div>
              <label className="label">Gender</label>
              <select
                className="input"
                value={customer.gender}
                onChange={(e) =>
                  setCustomer({ ...customer, gender: e.target.value })
                }
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Age</label>
              <input
                type="number"
                className="input"
                value={customer.age}
                onChange={(e) =>
                  setCustomer({ ...customer, age: e.target.value })
                }
                placeholder="e.g. 32"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                className="input"
                value={customer.city}
                onChange={(e) =>
                  setCustomer({ ...customer, city: e.target.value })
                }
                placeholder="Mumbai"
              />
            </div>
            <div>
              <label className="label">Purpose</label>
              <select
                className="input"
                value={customer.purpose}
                onChange={(e) =>
                  setCustomer({ ...customer, purpose: e.target.value })
                }
              >
                <option value="">Select</option>
                {PURPOSES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Budget</label>
              <select
                className="input"
                value={customer.budget}
                onChange={(e) =>
                  setCustomer({ ...customer, budget: e.target.value })
                }
              >
                <option value="">Select</option>
                {BUDGETS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Remarks</label>
              <textarea
                className="input min-h-[70px]"
                value={customer.remarks}
                onChange={(e) =>
                  setCustomer({ ...customer, remarks: e.target.value })
                }
                placeholder="Any notes…"
              />
            </div>
          </div>

          <div>
            <label className="label">Interested In</label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => {
                const active = interested.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSection(s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-gold-500 text-white border-gold-500"
                        : "bg-white text-ink-700 border-ink-200 hover:border-gold-400"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={resetForm} className="btn-outline">
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" /> Generate Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
