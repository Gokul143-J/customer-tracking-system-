"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Gem,
  LayoutDashboard,
  Ticket,
  Users,
  MapPin,
  ShoppingBag,
  BarChart3,
  UserCog,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/utils";

const NAV = [
  { href: "/analytics", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reception", label: "Reception", icon: Ticket },
  { href: "/floor", label: "Floor", icon: MapPin },
  { href: "/sales", label: "Sales / Billing", icon: ShoppingBag },
  { href: "/tickets", label: "Tickets", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/analytics-detail", label: "Analytics", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: UserCog },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold-500 font-display text-xl">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-ink-200/80 flex flex-col transition-transform`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100">
          <Link href="/analytics" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gold-500 text-white flex items-center justify-center">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-lg leading-none">Jewellery</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500">
                CRM
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden btn-ghost p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/analytics" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${active ? "active" : ""}`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-ink-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-semibold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink-900 truncate">
                {user.full_name}
              </div>
              <div className="text-xs text-ink-500 truncate">
                {roleLabel(user.role)}
              </div>
            </div>
            <button
              onClick={logout}
              className="btn-ghost p-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-ink-100 flex items-center px-4 md:px-8 gap-4 sticky top-0 z-10">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden btn-ghost p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-display text-xl text-ink-900">
            Royal Jewellers
          </h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden md:inline text-xs text-ink-500">
              {new Date().toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
