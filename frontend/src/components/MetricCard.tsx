"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  trend?: string | null;
  is_positive?: boolean | null;
  icon?: React.ReactNode;
  accent?: string;
}

export default function MetricCard({
  label,
  value,
  trend,
  is_positive,
  icon,
  accent = "bg-gold-500",
}: Props) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
          {label}
        </div>
        <div className="text-3xl font-display text-ink-900 mt-1">{value}</div>
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs mt-2 font-medium",
              is_positive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {is_positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend}
          </div>
        )}
      </div>
      {icon && (
        <div
          className={cn(
            "w-11 h-11 rounded-xl text-white flex items-center justify-center",
            accent
          )}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
