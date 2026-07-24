-- ============================================================
-- SECTION TIME LOGS TABLE
-- Track time spent by each customer in each section
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS section_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  section TEXT NOT NULL,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_section_time_ticket ON section_time_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_section_time_customer ON section_time_logs(customer_id);

-- Allow all access (for development)
CREATE POLICY "Allow all for development" ON section_time_logs FOR ALL USING (true) WITH CHECK (true);
