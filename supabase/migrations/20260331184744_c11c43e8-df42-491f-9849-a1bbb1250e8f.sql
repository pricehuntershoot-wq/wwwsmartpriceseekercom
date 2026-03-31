
CREATE TABLE public.ab_test_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  user_id uuid,
  test_name text NOT NULL,
  variant text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visitor_id, test_name)
);

CREATE TABLE public.ab_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  test_name text NOT NULL,
  variant text NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert assignments" ON public.ab_test_assignments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view own assignments" ON public.ab_test_assignments FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert events" ON public.ab_test_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view events" ON public.ab_test_events FOR SELECT TO public USING (true);
