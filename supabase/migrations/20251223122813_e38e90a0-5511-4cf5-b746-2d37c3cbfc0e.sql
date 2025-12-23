-- Create scheduled_days table
CREATE TABLE public.scheduled_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  conversation_summary TEXT
);

-- Create scheduled_items table
CREATE TABLE public.scheduled_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_day_id UUID REFERENCES public.scheduled_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'event', 'break')),
  priority TEXT,
  location TEXT,
  notes TEXT,
  is_done BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

-- Create index for faster date lookups
CREATE INDEX idx_scheduled_days_date ON public.scheduled_days(date);