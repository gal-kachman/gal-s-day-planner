-- Enable RLS on scheduled_days
ALTER TABLE public.scheduled_days ENABLE ROW LEVEL SECURITY;

-- Enable RLS on scheduled_items  
ALTER TABLE public.scheduled_items ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policy on task_completions
DROP POLICY IF EXISTS "Allow all operations on task_completions" ON public.task_completions;

-- Add authenticated-user-only policies for scheduled_days
CREATE POLICY "Authenticated users can view schedules"
ON public.scheduled_days FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert schedules"
ON public.scheduled_days FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedules"
ON public.scheduled_days FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete schedules"
ON public.scheduled_days FOR DELETE
TO authenticated
USING (true);

-- Add authenticated-user-only policies for scheduled_items
CREATE POLICY "Authenticated users can view items"
ON public.scheduled_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert items"
ON public.scheduled_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update items"
ON public.scheduled_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete items"
ON public.scheduled_items FOR DELETE
TO authenticated
USING (true);

-- Add authenticated-user-only policies for task_completions
CREATE POLICY "Authenticated users can view task completions"
ON public.task_completions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert task completions"
ON public.task_completions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update task completions"
ON public.task_completions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete task completions"
ON public.task_completions FOR DELETE
TO authenticated
USING (true);