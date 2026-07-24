"use client";

import { useEffect, useState } from "react";
import {
  Users, Plus, Loader2, CheckCircle2, XCircle, Search,
  Shield, MapPin, UserPlus, Edit3, Save, X,
} from "lucide-react";
import { staffApi } from "@/lib/supabase/database";
import { useAuth } from "@/context/AuthContext";
import { prettySection } from "@/lib/utils";

const SECTIONS = ["reception", "gold", "silver", "diamond", "platinum"];
const ROLES = ["receptionist", "sales_executive", "floor_manager", "store_manager", "admin"];

export default function AdminEmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password_hash: "",
    full_name: "",
    email: "",
    phone: "",
    role: "sales_executive",
    assigned_section: "gold",
    is_active: true,
  });

  async function loadEmployees() {
    setLoading(true);
    try {
      const data = await staffApi.list();
      // Filter out the system admin for clarity (or keep them)
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.username || !form.full_name) {
      setFormError("Username and full name are required");
      return;
    }
    if (!editId && !form.password_hash) {
      setFormError("Password is required for new employees");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        // Update existing
        const payload: any = {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          assigned_section: form.assigned_section,
          is_active: form.is_active,
        };
        if (form.password_hash) payload.password_hash = form.password_hash;
        await staffApi.update(editId, payload);
      } else {
        // Create new
        await staffApi.create({
          username: form.username,
          password_hash: form.password_hash,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          assigned_section: form.assigned_section,
          is_active: true,
        });
      }
      setShowForm(false);
      setEditId(null);
      setForm({
        username: "",
        password_hash: "",
        full_name: "",
        email: "",
        phone: "",
        role: "sales_executive",
        assigned_section: "gold",
        is_active: true,
      });
      await loadEmployees();
    } catch (err: any) {
      setFormError(err.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(emp: any) {
    try {
      await staffApi.update(emp.id, { is_active: !emp.is_active });
      await loadEmployees();
    } catch (e) {
      console.error(e);
    }
  }

  function startEdit(emp: any) {
    setForm({
      username: emp.username || "",
      password_hash: "",
      full_name: emp.full_name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      role: emp.role || "sales_executive",
      assigned_section: emp.assigned_section || "gold",
      is_active: emp.is_active !== false,
    });
    setEditId(emp.id);
    setShowForm(true);
  }

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.full_name?.toLowerCase().includes(q) ||
      e.username?.toLowerCase().includes(q) ||
      e.assigned_section?.toLowerCase().includes(q)
    );
  });

  // Group by section
  const grouped: Record<string, any[]> = {};
  SECTIONS.forEach((s) => (grouped[s] = []));
  filtered.forEach((e) => {
    const sec = e.assigned_section || "unassigned";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(e);
  });

  const sectionColors: Record<string, string> = {
    reception: "from-amber-400 to-amber-600",
    gold: "from-yellow-400 to-amber-500",
    silver: "from-gray-300 to-gray-500",
    diamond: "from-indigo-400 to-indigo-600",
    platinum: "from-slate-300 to-slate-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Employee Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add and assign employees to specific sections
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ username: "", password_hash: "", full_name: "", email: "", phone: "", role: "sales_executive", assigned_section: "gold", is_active: true }); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-500/20"
        >
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
            placeholder="Search by name, username, or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Employees by Section */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> Loading employees...
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sectionColors[section]} text-white flex items-center justify-center shadow-lg`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{prettySection(section)}</h3>
                  <p className="text-xs text-gray-500">{grouped[section]?.length || 0} employee(s)</p>
                </div>
              </div>

              {grouped[section]?.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
                  No employees assigned to this section
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[section].map((emp) => (
                    <div key={emp.id} className="p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-bold text-sm">
                            {emp.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{emp.full_name}</div>
                            <div className="text-xs text-gray-500">@{emp.username}</div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {emp.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {emp.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-gray-500">
                        {emp.email && <div>📧 {emp.email}</div>}
                        {emp.phone && <div>📱 {emp.phone}</div>}
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span className="capitalize">{emp.role?.replace(/_/g, " ")}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => startEdit(emp)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => toggleActive(emp)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          {emp.is_active ? <><XCircle className="w-3 h-3" /> Disable</> : <><CheckCircle2 className="w-3 h-3" /> Enable</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editId ? "Edit Employee" : "Add New Employee"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Full Name *</label>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Raj Kumar"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Username *</label>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. raj_kumar"
                    required
                    disabled={!!editId}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    {editId ? "New Password (leave blank to keep)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                    value={form.password_hash}
                    onChange={(e) => setForm({ ...form, password_hash: e.target.value })}
                    placeholder="Enter password"
                    required={!editId}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Phone</label>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Role *</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Assigned Section *</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                    value={form.assigned_section}
                    onChange={(e) => setForm({ ...form, assigned_section: e.target.value })}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>{prettySection(s)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{formError}</div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editId ? "Update" : "Create"} Employee</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
