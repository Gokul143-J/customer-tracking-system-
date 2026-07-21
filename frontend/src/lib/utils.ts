import clsx, { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatDuration(seconds: number) {
  if (!seconds || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 1) return `${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h < 1) return `${m}m ${s}s`;
  return `${h}h ${mm}m`;
}

export function prettySection(name: string) {
  if (!name) return "—";
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function roleLabel(r?: string) {
  switch (r) {
    case "admin":
      return "Admin";
    case "store_manager":
      return "Store Manager";
    case "floor_manager":
      return "Floor Manager";
    case "sales_executive":
      return "Sales Executive";
    case "receptionist":
      return "Receptionist";
    default:
      return r || "User";
  }
}

export function statusColor(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "COMPLETED":
      return "bg-gold-100 text-gold-700";
    case "CLOSED":
      return "bg-ink-100 text-ink-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-ink-100 text-ink-700";
  }
}
