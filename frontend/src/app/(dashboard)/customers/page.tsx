"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, Loader2, Phone, MapPin, Award } from "lucide-react";
import { customersApi } from "@/lib/api";
import type { Customer } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = (await customersApi.list(query || undefined)) as Customer[];
      setCustomers(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Customers</h1>
          <p className="text-sm text-ink-500 mt-1">
            Visitor database with visit history.
          </p>
        </div>
        <button onClick={load} className="btn-outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-ink-500" />
          <input
            className="input pl-9"
            placeholder="Search by name or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="card p-4 text-red-600 bg-red-50 border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20 text-ink-500">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full card p-10 text-center">
            <div className="text-ink-700 font-semibold">No customers found</div>
            <div className="text-ink-500 text-sm mt-1">
              Create a ticket at Reception to register a new visitor.
            </div>
          </div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-semibold text-lg">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-900 truncate">
                    {c.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                    <Phone className="w-3 h-3" /> {c.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-semibold text-gold-700">
                    <Award className="w-3 h-3" />
                    {c.visit_count} visits
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                {c.city && (
                  <div className="flex items-center gap-1 text-ink-500">
                    <MapPin className="w-3 h-3" /> {c.city}
                  </div>
                )}
                {c.purpose && (
                  <div className="text-ink-500">
                    Purpose: <span className="text-ink-700">{c.purpose}</span>
                  </div>
                )}
                {c.budget && (
                  <div className="text-ink-500">
                    Budget: <span className="text-ink-700">{c.budget}</span>
                  </div>
                )}
                <div className="text-ink-500 col-span-2 mt-1">
                  Last visit:{" "}
                  <span className="text-ink-700">
                    {formatDateTime(c.last_visit)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
