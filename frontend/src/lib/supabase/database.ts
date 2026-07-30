import { supabase } from './client';

// ─── AUTH ───────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('staff').select('id, username, full_name, email, role, assigned_section, is_active')
      .eq('username', username).eq('password_hash', password).eq('is_active', true).single();
    if (error || !data) throw new Error('Invalid credentials or account disabled');
    return data;
  },
  adminLogin: async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('staff').select('id, username, full_name, email, role, assigned_section, is_active')
      .eq('username', username).eq('password_hash', password).eq('role', 'admin').eq('is_active', true).single();
    if (error || !data) throw new Error('Invalid admin credentials or account disabled');
    return data;
  },
  employeeLogin: async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('staff').select('id, username, full_name, email, role, assigned_section, is_active')
      .eq('username', username).eq('password_hash', password)
      .in('role', ['receptionist', 'section_manager']).eq('is_active', true).single();
    if (error || !data) throw new Error('Invalid employee credentials or account disabled');
    return data;
  },
};

// ─── CUSTOMERS ──────────────────────────────────────
export const customersApi = {
  list: async (search?: string) => {
    let q = supabase.from('customers').select('*').order('last_visit', { ascending: false });
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
  byPhone: async (phone: string) => {
    const { data, error } = await supabase.from('customers').select('*').eq('phone', phone).single();
    if (error) throw error;
    return data;
  },
  create: async (p: any) => {
    const { data, error } = await supabase.from('customers').insert(p).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, p: any) => {
    const { data, error } = await supabase.from('customers').update(p).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  get: async (id: string) => {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
};

// ─── TICKETS ────────────────────────────────────────
export const ticketsApi = {
  list: async (status?: string) => {
    let q = supabase.from('tickets').select('*, customer:customers(*)').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
  get: async (id: string) => {
    const { data, error } = await supabase.from('tickets').select('*, customer:customers(*)').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  create: async (p: any) => {
    const { data, error } = await supabase.from('tickets').insert(p).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, p: any) => {
    const { data, error } = await supabase.from('tickets').update(p).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  close: async (id: string, status = 'CLOSED') => {
    const { data, error } = await supabase.from('tickets').update({ status, closed_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  movements: async (ticketId: string) => {
    const { data, error } = await supabase.from('movements').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};

// ─── MOVEMENTS ──────────────────────────────────────
// Note: create() only inserts a movement record. It does NOT update the ticket.
// The caller (section-view) is responsible for updating ticket.current_section.
export const movementsApi = {
  create: async (p: any) => {
    const { data, error } = await supabase.from('movements').insert(p).select().single();
    if (error) throw error;
    return data;
  },
  list: async () => {
    const { data, error } = await supabase.from('movements').select('*, tickets(*), customers(*)').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  },
};

// ─── SECTION TIME LOGS ──────────────────────────────
export const sectionTimeApi = {
  create: async (p: any) => {
    const { data, error } = await supabase.from('section_time_logs').insert(p).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, p: any) => {
    const { data, error } = await supabase.from('section_time_logs').update(p).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  byTicket: async (ticketId: string) => {
    const { data, error } = await supabase.from('section_time_logs').select('*').eq('ticket_id', ticketId).order('entry_time', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  byCustomer: async (customerId: string) => {
    const { data, error } = await supabase.from('section_time_logs').select('*').eq('customer_id', customerId).order('entry_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

// ─── SALES ──────────────────────────────────────────
export const salesApi = {
  list: async () => {
    const { data, error } = await supabase.from('sales').select('*, tickets(*), customers(*)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  create: async (p: any) => {
    const { data, error } = await supabase.from('sales').insert(p).select().single();
    if (error) throw error;
    return data;
  },
};

// ─── INVOICES ───────────────────────────────────────
export const invoicesApi = {
  list: async () => {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  create: async (p: any) => {
    const { data, error } = await supabase.from('invoices').insert(p).select().single();
    if (error) throw error;
    return data;
  },
};

// ─── SECTIONS ───────────────────────────────────────
export const sectionsApi = {
  list: async () => {
    const { data, error } = await supabase.from('sections').select('*').eq('is_active', true).order('display_order');
    if (error) throw error;
    return data || [];
  },
};

// ─── STAFF ──────────────────────────────────────────
export const staffApi = {
  list: async () => {
    const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  create: async (p: any) => {
    const { data, error } = await supabase.from('staff').insert(p).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, p: any) => {
    const { data, error } = await supabase.from('staff').update(p).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// ─── AUDIT LOGS ─────────────────────────────────────
export const auditLogsApi = {
  list: async () => {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  },
  create: async (p: any) => {
    const { data, error } = await supabase.from('audit_logs').insert(p).select().single();
    if (error) throw error;
    return data;
  },
};

// ─── DASHBOARD STATS ────────────────────────────────
export const dashboardApi = {
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    const [totalC, activeT, todayT, completedToday, salesRes, occRes, recentRes] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('closed_at', today).in('status', ['COMPLETED', 'CLOSED']),
      supabase.from('sales').select('final_amount').gte('created_at', today),
      supabase.from('tickets').select('current_section').eq('status', 'ACTIVE'),
      supabase.from('tickets').select('*, customer:customers(name)').order('created_at', { ascending: false }).limit(10),
    ]);
    const revenue = (salesRes.data || []).reduce((s: number, x: any) => s + Number(x.final_amount || 0), 0);
    const occMap: Record<string, number> = {};
    (occRes.data || []).forEach((t: any) => { const s = t.current_section || 'unknown'; occMap[s] = (occMap[s] || 0) + 1; });
    return {
      totalCustomers: totalC.count || 0,
      activeTickets: activeT.count || 0,
      todayTickets: todayT.count || 0,
      completedToday: completedToday.count || 0,
      revenueToday: revenue,
      occupancy: Object.entries(occMap).map(([section, count]) => ({ section, count })),
      recentActivity: recentRes.data || [],
    };
  },
};
