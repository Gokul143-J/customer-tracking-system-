export function formatTime(iso: string) {
  try { const d = new Date(iso); return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}
export function formatDateTime(iso: string) {
  try { const d = new Date(iso); return d.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
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
  return name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
export function roleLabel(r?: string) {
  switch (r) {
    case "admin": return "Admin";
    case "receptionist": return "Receptionist";
    case "section_manager": return "Section Manager";
    default: return r || "User";
  }
}
export function statusColor(status?: string) {
  switch (status) {
    case "ACTIVE": return "bg-emerald-100 text-emerald-700";
    case "COMPLETED": return "bg-amber-100 text-amber-700";
    case "CLOSED": return "bg-gray-100 text-gray-700";
    case "CANCELLED": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}
