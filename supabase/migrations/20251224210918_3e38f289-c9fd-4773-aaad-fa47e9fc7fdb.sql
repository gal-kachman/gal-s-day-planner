-- Create task_completions table to log when tasks are completed
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_title TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_task_id TEXT,
  notes TEXT,
  priority TEXT
);

-- Enable RLS (but allow public access since there's no auth yet)
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth in place)
CREATE POLICY "Allow all operations on task_completions"
ON public.task_completions
FOR ALL
USING (true)
WITH CHECK (true);