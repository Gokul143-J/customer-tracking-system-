"use client";

import { FileText, Download, Mail } from "lucide-react";

export default function ManagerPage() {
  const reports = [
    { name: "Daily Footfall Report", desc: "Visits per hour with conversion" },
    { name: "Sales Summary", desc: "Revenue, payment methods, top products" },
    { name: "Section Performance", desc: "Time-spent & conversion by section" },
    { name: "Executive Performance", desc: "Sales closed per executive" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Manager</h1>
        <p className="text-sm text-ink-500 mt-1">
          Reports, exports, and store-level controls.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.name} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-ink-900">{r.name}</div>
                  <div className="text-sm text-ink-500 mt-0.5">{r.desc}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-outline">
                <Download className="w-4 h-4" /> Excel
              </button>
              <button className="btn-outline">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button className="btn-ghost">
                <Mail className="w-4 h-4" /> Email
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="card p-5 text-sm text-ink-600">
        The PDF/Excel/email export endpoints are part of the backend roadmap.
        The UI here is a preview — wire them to <code>/api/v1/reports/...</code>{" "}
        once those routes are added.
      </div>
    </div>
  );
}
