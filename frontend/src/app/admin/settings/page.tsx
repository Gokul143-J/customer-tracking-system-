"use client";

import { useEffect, useState } from "react";
import {
  Settings, Users, Building2, Shield, Plus, Loader2, CheckCircle2,
  XCircle, Trash2, Save, UserPlus,
} from "lucide-react";
import { staffApi, auditLogsApi } from "@/lib/supabase/database";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/utils";

type Tab = "staff" | "audit";

export default function AdminSettings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("staff");
  const [staff, setStaff] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "receptionist",
    assigned_section: "reception",
  });

  async function load() {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        staffApi.list(),
        auditLogsApi.list(),
      ]);
      setStaff(s);
      setLogs(l);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.username || !form.full_name || !form.password) {
      setFormError("Username, full name, and password are required");
      return;
    }
    setSaving(true);
    try {
      await staffApi.create({ ...form, is_active: true });
      setShowForm(false);
      setForm({ username: "", full_name: "", email: "", phone: "", password: "", role: "receptionist", assigned_section: "reception" });
      await load();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create staff");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: any) {
    try {
      await staffApi.update(s.id, { is_active: !s.is_active });
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Settings</h1>
        <p className="text-sm text-gray-500 mt-1">System administration and user management</p>
      </div>

      {/* Admin Profile */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-white border border-amber-100 p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Settings className="w-7 h-7" />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{user?.full_name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> {user?.email || "Administrator"} · {user?.role}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 w-fit">
        {[
          { key: "staff", label: "Staff Management", icon: <Users className="w-4 h-4" /> },
          { key: "audit", label: "Audit Logs", icon: <Shield className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === t.key ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Staff Tab */}
      {tab === "staff" && (
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Staff Accounts ({staff.length})</h2>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-500/20">
              <UserPlus className="w-4 h-4" /> Add Staff
            </button>
          </div>

          {showForm && (
            <form onSubmit={createStaff} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5 rounded-xl bg-amber-50 border border-amber-100 mb-5">
              <input className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" placeholder="Username *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <input className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" placeholder="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" type="password" placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="receptionist">Receptionist</option>
                <option value="section_manager">Section Manager</option>
              </select>
              <select className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" value={form.assigned_section || "reception"} onChange={(e) => setForm({ ...form, assigned_section: e.target.value })}>
                <option value="reception">Reception</option>
                <option value="gold">Gold Section</option>
                <option value="silver">Silver Section</option>
                <option value="diamond">Diamond Section</option>
                <option value="platinum">Platinum Section</option>
              </select>
              {formError && <div className="md:col-span-2 text-sm text-red-600">{formError}</div>}
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving…" : "Create Account"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-10 text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Username</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 pr-4 font-semibold text-gray-900">{s.full_name}</td>
                      <td className="py-3 pr-4 text-gray-600">{s.username}</td>
                      <td className="py-3 pr-4 text-gray-600">{s.email || "—"}</td>
                      <td className="py-3 pr-4 capitalize text-gray-600">{s.role?.replace(/_/g, " ")}</td>
                      <td className="py-3 pr-4">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> Disabled</span>
                        )}
                      </td>
                      <td className="py-3">
                        <button onClick={() => toggleActive(s)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                          {s.is_active ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {tab === "audit" && (
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">System Audit Logs ({logs.length})</h2>
          {loading ? (
            <div className="text-center py-10 text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No audit entries yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                    <th className="py-3 pr-4">When</th>
                    <th className="py-3 pr-4">Action</th>
                    <th className="py-3 pr-4">Entity</th>
                    <th className="py-3 pr-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-gray-50">
                      <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(l.created_at)}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs uppercase font-medium">{l.action}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{l.entity_type}</td>
                      <td className="py-3 text-gray-500 text-xs max-w-xs truncate">{l.details || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
