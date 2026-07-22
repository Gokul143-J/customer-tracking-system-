import { supabase } from './client';

// ─── AUTH ───────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, username, full_name, email, role, store_id, is_active')
      .eq('username', username)
      .eq('password_hash', password) // In production, use proper auth
      .eq('is_active', true)
      .single();
    if (error || !data) throw new Error('Invalid credentials or account disabled');
    return data;
  },

  adminLogin: async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, username, full_name, email, role, store_id, is_active')
      .eq('username', username)
      .eq('password_hash', password)
      .eq('role', 'admin')
      .eq('is_active', true)
      .single();
    if (error || !data) throw new Error('Invalid admin credentials');
    return data;
  },

  employeeLogin: async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, username, full_name, email, role, store_id, is_active')
      .eq('username', username)
      .eq('password_hash', password)
      .in('role', ['receptionist', 'sales_executive', 'floor_manager', 'store_manager'])
      .eq('is_active', true)
      .single();
    if (error || !data) throw new Error('Invalid employee credentials');
    return data;
  },
};

// ─── CUSTOMERS ──────────────────────────────────────
export const customersApi = {
  list: async (search?: string) => {
    let query = supabase
      .from('customers')
      .select('*')
      .order('last_visit', { ascending: false });
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  byPhone: async (phone: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (payload: any) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, payload: any) => {
    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── TICKETS ────────────────────────────────────────
export const ticketsApi = {
  list: async (status?: string) => {
    let query = supabase
      .from('tickets')
      .select('*, customer:customers(*)')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (payload: any) => {
    const { data, error } = await supabase
      .from('tickets')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  close: async (id: string, status: string = 'CLOSED') => {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status, closed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  movements: async (ticketId: string) => {
    const { data, error } = await supabase
      .from('movements')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};

// ─── MOVEMENTS ──────────────────────────────────────
export const movementsApi = {
  create: async (payload: any) => {
    const { data, error } = await supabase
      .from('movements')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  list: async () => {
    const { data, error } = await supabase
      .from('movements')
      .select('*, tickets(*), customers(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },
};

// ─── SALES ──────────────────────────────────────────
export const salesApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*, tickets(*), customers(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (payload: any) => {
    const { data, error } = await supabase
      .from('sales')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── INVOICES ───────────────────────────────────────
export const invoicesApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (payload: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── SECTIONS ───────────────────────────────────────
export const sectionsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (error) throw error;
    return data || [];
  },
};

// ─── STAFF ──────────────────────────────────────────
export const staffApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (payload: any) => {
    const { data, error } = await supabase
      .from('staff')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, payload: any) => {
    const { data, error } = await supabase
      .from('staff')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── AUDIT LOGS ─────────────────────────────────────
export const auditLogsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  },

  create: async (payload: any) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── DASHBOARD STATS ────────────────────────────────
export const dashboardApi = {
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalCustomers },
      { count: activeTickets },
      { count: todayTickets },
      { data: todaySales },
      { data: occupancy },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('sales').select('final_amount').gte('created_at', today),
      supabase.from('tickets')
        .select('current_section')
        .eq('status', 'ACTIVE'),
      supabase.from('tickets')
        .select('*, customer:customers(name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const revenueToday = (todaySales || []).reduce(
      (sum, s) => sum + Number(s.final_amount || 0), 0
    );

    const occupancyMap: Record<string, number> = {};
    (occupancy || []).forEach((t) => {
      const sec = t.current_section || 'unknown';
      occupancyMap[sec] = (occupancyMap[sec] || 0) + 1;
    });
    const occupancyList = Object.entries(occupancyMap).map(([section, count]) => ({
      section,
      count,
    }));

    return {
      totalCustomers: totalCustomers || 0,
      activeTickets: activeTickets || 0,
      todayTickets: todayTickets || 0,
      revenueToday,
      occupancy: occupancyList,
      recentActivity: recentActivity || [],
    };
  },
};
