"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "success", onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const bgColor = type === "success" ? "bg-emerald-600" : type === "error" ? "bg-red-600" : "bg-indigo-600";
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? XCircle : null;

  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-center gap-2 animate-slide-in-right ${bgColor}`}>
      {Icon && <Icon className="w-4 h-4" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-3 hover:bg-white/20 rounded-full p-1 transition">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
