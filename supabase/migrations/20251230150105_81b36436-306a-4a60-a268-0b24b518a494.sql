-- Drop the task_completions table as it's no longer needed
-- Task completion is now synced directly to Google Sheets
DROP TABLE IF EXISTS public.task_completions;