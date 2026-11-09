-- Reserve an analysis attempt atomically per authenticated user.
-- The transaction-scoped advisory lock prevents concurrent requests from
-- both passing the hourly limit check.
CREATE OR REPLACE FUNCTION public.try_consume_analysis_run(
  p_max_runs integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_count integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_max_runs < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  SELECT count(*)::integer
    INTO current_count
    FROM public.analysis_runs
    WHERE user_id = current_user_id
      AND created_at >= now() - make_interval(secs => p_window_seconds);

  IF current_count >= p_max_runs THEN
    RETURN false;
  END IF;

  INSERT INTO public.analysis_runs (user_id)
  VALUES (current_user_id);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.try_consume_analysis_run(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.try_consume_analysis_run(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.try_consume_analysis_run(integer, integer) TO authenticated;
