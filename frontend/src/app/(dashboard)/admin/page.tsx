"use client";

import { useEffect, useState } from "react";
import {
  UserCog,
  Users as UsersIcon,
  Building2,
  Shield,
  Database,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleLabel, formatDateTime } from "@/lib/utils";
import { usersApi, rolesApi, storesApi, auditLogsApi } from "@/lib/api";

type Tab = "users" | "roles" | "stores" | "audit";

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("users");

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New user form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role_id: "",
    store_id: "",
  });

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [u, r, s, a] = await Promise.all([
        usersApi.list(),
        rolesApi.list(),
        storesApi.list(),
        auditLogsApi.list(),
      ]);
      setUsers(u);
      setRoles(r);
      setStores(s);
      setLogs(a);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function onCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.full_name || !form.email || !form.password) {
      setFormError("Name, email and password are required");
      return;
    }
    if (!form.role_id || !form.store_id) {
      setFormError("Please select a role and a store");
      return;
    }
    setSaving(true);
    try {
      await usersApi.create({ ...form, is_active: true });
      setShowForm(false);
      setForm({ full_name: "", email: "", phone: "", password: "", role_id: "", store_id: "" });
      await loadAll();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: any) {
    try {
      await usersApi.update(u.id, { is_active: !u.is_active });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to update user");
    }
  }

  const roleName = (id: string) => roles.find((r) => r.id === id)?.display_name || "—";
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name || "—";

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "users", label: "Users", icon: <UsersIcon className="w-4 h-4" /> },
    { key: "roles", label: "Roles & Permissions", icon: <Shield className="w-4 h-4" /> },
    { key: "stores", label: "Stores", icon: <Building2 className="w-4 h-4" /> },
    { key: "audit", label: "Audit Logs", icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Admin</h1>
        <p className="text-sm text-ink-500 mt-1">
          System administration and configuration.
        </p>
      </div>

      <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-gold-50 to-white">
        <div className="w-12 h-12 rounded-full bg-gold-500 text-white flex items-center justify-center">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <div className="text-lg font-semibold text-ink-900">{user?.full_name}</div>
          <div className="text-sm text-ink-500">
            {user?.email} · {roleLabel(user?.role)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? "bg-gold-500 text-white shadow-card"
                : "bg-white text-ink-600 border border-ink-100 hover:bg-gold-50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-10 flex items-center justify-center text-ink-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          {/* ------- USERS ------- */}
          {tab === "users" && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink-900">
                  Staff Accounts ({users.length})
                </h2>
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> New User
                </button>
              </div>

              {showForm && (
                <form
                  onSubmit={onCreateUser}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-gold-50 border border-gold-100"
                >
                  <input
                    className="input"
                    placeholder="Full name *"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="Email *"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <input
                    className="input"
                    type="password"
                    placeholder="Password * (min 6 chars)"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <select
                    className="input"
                    value={form.role_id}
                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  >
                    <option value="">Select role *</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.display_name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={form.store_id}
                    onChange={(e) => setForm({ ...form, store_id: e.target.value })}
                  >
                    <option value="">Select store *</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {formError && (
                    <div className="md:col-span-2 text-sm text-red-600">{formError}</div>
                  )}
                  <div className="md:col-span-2 flex gap-2">
                    <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                      {saving ? "Saving…" : "Create User"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-sm rounded-lg border border-ink-200 text-ink-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-500 border-b border-ink-100">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Role</th>
                      <th className="py-2 pr-4">Store</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-ink-50">
                        <td className="py-2.5 pr-4 font-medium text-ink-900">{u.full_name}</td>
                        <td className="py-2.5 pr-4 text-ink-600">{u.email}</td>
                        <td className="py-2.5 pr-4">{roleName(u.role_id)}</td>
                        <td className="py-2.5 pr-4">{storeName(u.store_id)}</td>
                        <td className="py-2.5 pr-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <XCircle className="w-4 h-4" /> Disabled
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <button
                            onClick={() => toggleActive(u)}
                            className="text-xs px-2.5 py-1 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50"
                          >
                            {u.is_active ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ------- ROLES ------- */}
          {tab === "roles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-gold-600" />
                    <span className="font-semibold text-ink-900">{r.display_name}</span>
                    <code className="text-xs bg-ink-50 px-1.5 py-0.5 rounded">{r.name}</code>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(r.permissions || {}).map(([res, actions]: [string, any]) => (
                      <div key={res} className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-medium text-ink-700 w-24">{res}</span>
                        {(actions as string[]).map((a) => (
                          <span
                            key={a}
                            className="px-1.5 py-0.5 rounded bg-gold-100 text-gold-700"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ------- STORES ------- */}
          {tab === "stores" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((s) => (
                <div key={s.id} className="card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-gold-600" />
                    <span className="font-semibold text-ink-900">{s.name}</span>
                  </div>
                  <div className="text-sm text-ink-600 space-y-0.5">
                    {s.address && <div>{s.address}</div>}
                    {s.phone && <div>📞 {s.phone}</div>}
                    {s.email && <div>✉️ {s.email}</div>}
                    {s.gst_number && <div>GST: {s.gst_number}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ------- AUDIT LOGS ------- */}
          {tab === "audit" && (
            <div className="card p-6">
              <h2 className="font-semibold text-ink-900 mb-4">
                Recent Activity ({logs.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-500 border-b border-ink-100">
                      <th className="py-2 pr-4">When</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Entity</th>
                      <th className="py-2 pr-4">Details</th>
                      <th className="py-2">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-b border-ink-50">
                        <td className="py-2 pr-4 whitespace-nowrap text-ink-600">
                          {formatDateTime(l.created_at)}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 rounded bg-gold-100 text-gold-700 text-xs uppercase">
                            {l.action}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{l.entity_type}</td>
                        <td className="py-2 pr-4 text-ink-600 max-w-xs truncate">
                          {l.new_values ? JSON.stringify(l.new_values) : "—"}
                        </td>
                        <td className="py-2 text-ink-500">{l.ip_address || "—"}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-ink-400">
                          No audit entries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
