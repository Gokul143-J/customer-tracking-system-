export type Role =
  | "admin"
  | "store_manager"
  | "floor_manager"
  | "sales_executive"
  | "receptionist";

export interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  role: Role | string;
  store_id: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: UserInfo;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  gender: string;
  age?: number | null;
  city: string;
  purpose: string;
  budget: string;
  remarks?: string | null;
  visit_count: number;
  first_visit: string;
  last_visit: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  created_by?: string | null;
  store_id?: string | null;
  status: "ACTIVE" | "COMPLETED" | "CLOSED" | "CANCELLED" | "NO_PURCHASE";
  qr_code?: string | null;
  barcode?: string | null;
  interested_products: string[];
  current_section: string;
  no_purchase_reason?: string | null;
  notes?: string | null;
  created_at: string;
  closed_at?: string | null;
  updated_at: string;
  customer?: Customer;
}

export interface Movement {
  id: string;
  ticket_id: string;
  customer_id: string;
  from_section: string;
  to_section: string;
  assigned_by?: string | null;
  assigned_to?: string | null;
  reason?: string | null;
  notes?: string | null;
  time_spent_seconds: number;
  created_at: string;
}

export interface Sale {
  id: string;
  ticket_id: string;
  customer_id: string;
  salesperson_id: string;
  store_id: string;
  products?: Array<Record<string, unknown>> | null;
  total_weight: string;
  making_charges: string;
  stone_weight: string;
  gst_amount: string;
  discount: string;
  final_amount: string;
  invoice_number: string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  sale_id: string;
  invoice_number: string;
  pdf_url?: string | null;
  invoice_data?: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

export interface MetricWidget {
  label: string;
  value: string;
  trend?: string | null;
  is_positive?: boolean | null;
}

export interface SectionOccupancy {
  section: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  ticket_number: string;
  customer_name: string;
  action: string;
  timestamp: string;
}

export interface AnalyticsDashboard {
  metrics: MetricWidget[];
  occupancy: SectionOccupancy[];
  recent_activity: RecentActivity[];
}

export interface ShowroomSection {
  id: string;
  name: string;
  display_name: string;
  display_order: number;
  is_active: boolean;
  icon?: string | null;
  color?: string | null;
}
