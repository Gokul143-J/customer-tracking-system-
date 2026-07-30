"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Gem, LayoutDashboard, Users, MapPin, BarChart3, Activity,
  Settings, LogOut, Menu, X, Shield, Bell, UserCog, Ticket,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ticketsApi } from "@/lib/supabase/database";
import { formatDateTime, prettySection } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/track-customers", label: "Track Customers", icon: MapPin },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/customer-details", label: "Customer Details", icon: Users },
  { href: "/admin/customer-activities", label: "Customer Activities", icon: Activity },
  { href: "/admin/employees", label: "Employees", icon: UserCog },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch recent activities for notification dropdown
  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      try {
        const recent = await ticketsApi.list();
        if (!cancelled) setNotifications(recent.slice(0, 5));
      } catch (e) { /* ignore */ }
    }
    if (user) loadNotifications();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/admin-login");
    else if (user.role !== "admin") router.replace("/admin-login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-amber-400 text-lg font-medium animate-pulse">Loading admin panel…</div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-red-400 text-lg font-medium">Access denied. Admin only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f6f0]">
      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-[#1a1520] to-[#0f0a1a] flex flex-col transition-transform duration-300`}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/5">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>Royal</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/70 mt-0.5">Admin Panel</div>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold px-3 mb-3 mt-2">Main Menu</div>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? "text-amber-400" : ""}`} />
                <span>{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user.full_name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Administrator
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center px-6 lg:px-10 gap-4 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Royal Jewellers</h2>
            <p className="text-xs text-gray-500">Admin Control Center</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full" suppressHydrationWarning>
              {new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                title="Recent Activities"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Recent Activities</h3>
                      <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">No recent activities</div>
                      ) : (
                        notifications.map((n: any) => (
                          <div key={n.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                <Ticket className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {n.customer?.name || "Customer"}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  <span className="font-mono text-amber-600">{n.ticket_number}</span>
                                  {" · "}
                                  <span className="capitalize">{prettySection(n.current_section)}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(n.created_at)}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                n.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                              }`}>
                                {n.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100 text-center">
                      <Link
                        href="/admin/track-customers"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View all tickets →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 max-w-[1800px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
