"use client";

import { Settings as SettingsIcon, Palette, Printer } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">
          Store configuration, printer setup, and theme.
        </p>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Printer className="w-4 h-4 text-gold-500" /> Printer & Ticket
        </h3>
        <p className="text-sm text-ink-500 mt-1">
          Configure thermal printer and ticket templates.
        </p>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-gold-500" /> Theme
        </h3>
        <p className="text-sm text-ink-500 mt-1">
          Branding colors, logo, and typography.
        </p>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-gold-500" /> Store Info
        </h3>
        <p className="text-sm text-ink-500 mt-1">
          GST number, address, contact details.
        </p>
      </div>
    </div>
  );
}
