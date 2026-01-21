-- Enable RLS on all Enterprise Tables
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arb_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_whatsapp ENABLE ROW LEVEL SECURITY;

-- Ensure Policies exist (Re-applying broadly to be safe)
-- Public Read Access for Reference Tables
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read books" ON public.books FOR SELECT USING (true);

-- Authenticated Read Access for Operational Data
CREATE POLICY "Auth read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read markets" ON public.markets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read odds" ON public.odds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read arbs" ON public.arbs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read arb_legs" ON public.arb_legs FOR SELECT TO authenticated USING (true);

-- Simulation/Worker Write Access (For MVP/Demo purposes only - in Prod this would be Service Role only)
CREATE POLICY "Auth insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert markets" ON public.markets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert odds" ON public.odds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert arbs" ON public.arbs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert arb_legs" ON public.arb_legs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert sports" ON public.sports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert leagues" ON public.leagues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert books" ON public.books FOR INSERT TO authenticated WITH CHECK (true);
