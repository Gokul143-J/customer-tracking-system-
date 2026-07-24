"use client";

import Link from "next/link";
import { Gem, Shield, Users, ArrowRight, Sparkles, BarChart3, Ticket, FileText } from "lucide-react";
import Particles from "@/components/Particles";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1520] to-[#0f0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/3 rounded-full blur-3xl" />
      </div>

      {/* Floating particles - rendered only on client to avoid hydration mismatch */}
      <Particles />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-8 inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-amber-500/30 rounded-full scale-150" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
              <Gem className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Royal <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Jewellers</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-4 max-w-lg mx-auto">
          Customer Journey Management System
        </p>
        <div className="flex items-center justify-center gap-2 mb-12">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-400/80 uppercase tracking-widest font-medium">Premium CRM Platform</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Admin Portal */}
          <Link
            href="/admin-login"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-500 hover:border-amber-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-5 mx-auto shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Admin Portal</h2>
              <p className="text-sm text-gray-400 mb-4">
                Dashboard, Analytics, Customer Insights & Management
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {["Dashboard", "Track", "Analytics"].map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-amber-400 font-medium text-sm group-hover:gap-3 transition-all">
                Enter Admin Portal <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Employee Portal */}
          <Link
            href="/employee-login"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-500 hover:border-indigo-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-5 mx-auto shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Employee Portal</h2>
              <p className="text-sm text-gray-400 mb-4">
                Tickets, Invoices, Sales & Daily Operations
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {["Tickets", "Invoices", "Billing"].map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-indigo-400 font-medium text-sm group-hover:gap-3 transition-all">
                Enter Employee Portal <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        <p className="text-xs text-gray-600 mt-10">
          © 2026 Royal Jewellers · Enterprise CRM System
        </p>
      </div>
    </div>
  );
}
