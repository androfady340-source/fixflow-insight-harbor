-- Prevent a task from being reassigned to a project owned by another user.
-- The previous UPDATE policy checked task ownership but did not validate the new project_id.
DROP POLICY IF EXISTS "own tasks update" ON public.tasks;

CREATE POLICY "own tasks update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND p.user_id = auth.uid()
    )
  );
