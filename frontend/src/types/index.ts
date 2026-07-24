export type Role = "admin" | "receptionist" | "section_manager";

export interface UserInfo {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: Role;
  assigned_section?: string;
}

export interface Customer {
  id: string; name: string; phone: string; gender?: string | null;
  age?: number | null; city?: string | null; purpose?: string | null;
  budget?: string | null; remarks?: string | null; visit_count: number;
  first_visit: string; last_visit: string; created_at: string; updated_at: string;
}

export interface Ticket {
  id: string; ticket_number: string; customer_id: string;
  created_by?: string | null; status: "ACTIVE" | "COMPLETED" | "CLOSED" | "CANCELLED";
  interested_products?: string[]; current_section: string;
  target_section?: string; notes?: string | null;
  created_at: string; closed_at?: string | null; updated_at: string;
  customer?: Customer;
}

export interface Movement {
  id: string; ticket_id: string; customer_id: string;
  from_section: string; to_section: string;
  reason?: string | null; time_spent_seconds: number; created_at: string;
}

export interface Sale {
  id: string; ticket_id: string; customer_id: string;
  salesperson_id: string; total_weight: number; making_charges: number;
  stone_weight: number; gst_amount: number; discount: number;
  final_amount: number; invoice_number: string; payment_method: string;
  status: string; created_at: string; updated_at: string;
}

export interface Invoice {
  id: string; sale_id: string; invoice_number: string;
  invoice_data?: Record<string, unknown> | null; status: string; created_at: string;
}

export interface ShowroomSection {
  id: string; name: string; display_name: string;
  display_order: number; is_active: boolean;
}

export interface StaffMember {
  id: string; username: string; full_name: string;
  email?: string | null; phone?: string | null; role: string;
  assigned_section?: string | null; is_active: boolean; created_at: string;
}
