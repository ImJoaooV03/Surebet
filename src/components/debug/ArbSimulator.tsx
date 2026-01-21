import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, TestTube } from "lucide-react";
import { addMinutes, addSeconds } from "date-fns";
import { useToast } from "../../contexts/ToastContext";

export function ArbSimulator() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateArb = async () => {
    setLoading(true);
    try {
      // 1. Ensure we have basic static data (Books, Sports, Leagues)
      
      // Check/Insert Sport
      let { data: sport } = await supabase.from('sports').select('id').eq('name', 'Futebol').single();
      if (!sport) {
        const { data } = await supabase.from('sports').insert({ name: 'Futebol', key: 'soccer' }).select().single();
        sport = data;
      }

      // Check/Insert League
      let { data: league } = await supabase.from('leagues').select('id').eq('name', 'Premier League').single();
      if (!league) {
        const { data } = await supabase.from('leagues').insert({ name: 'Premier League', sport_id: sport.id }).select().single();
        league = data;
      }

      // Check/Insert Teams
      const teamsList = [['Arsenal', 'Chelsea'], ['Liverpool', 'Man City'], ['Real Madrid', 'Barcelona']];
      const randomMatch = teamsList[Math.floor(Math.random() * teamsList.length)];
      
      const teamIds = [];
      for (const teamName of randomMatch) {
        let { data: team } = await supabase.from('teams').select('id').eq('name', teamName).single();
        if (!team) {
            const { data } = await supabase.from('teams').insert({ name: teamName, sport_id: sport.id }).select().single();
            team = data;
        }
        teamIds.push(team?.id);
      }

      // Check/Insert Books
      const bookNames = ['Bet365', 'Pinnacle', 'Betano'];
      const bookIds = [];
      for (const name of bookNames) {
        let { data: book } = await supabase.from('books').select('id').eq('name', name).single();
        if (!book) {
            const { data } = await supabase.from('books').insert({ name, key: name.toLowerCase() }).select().single();
            book = data;
        }
        bookIds.push(book?.id);
      }

      // 2. Create Event
      const { data: event, error: eventError } = await supabase.from('events').insert({
        sport_id: sport?.id,
        league_id: league?.id,
        home_team_id: teamIds[0],
        away_team_id: teamIds[1],
        start_time: addMinutes(new Date(), Math.floor(Math.random() * 120)).toISOString(),
        status: 'scheduled',
        provider_keys: { manual: true }
      }).select().single();

      if (eventError) throw eventError;

      // 3. Create Market (NEW ENTERPRISE STEP)
      const { data: market, error: marketError } = await supabase.from('markets').insert({
        event_id: event.id,
        market_type: 'soccer_1x2_90',
        rule_set: '90min',
        provider_keys: { manual: true }
      }).select().single();

      if (marketError) throw marketError;

      // 4. Create Arb (Surebet) linked to Market
      // Math: 1/2.1 + 1/3.4 + 1/4.5 = 0.476 + 0.294 + 0.222 = 0.992 (Profit ~0.8%)
      const roi = 0.008;
      const sum_inv = 0.992;
      
      const { data: arb, error: arbError } = await supabase.from('arbs').insert({
        market_id: market.id, // Linked to Market now
        roi: roi,
        sum_inv: sum_inv,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: addSeconds(new Date(), 300).toISOString()
      }).select().single();

      if (arbError) throw arbError;

      // 5. Create Legs
      const legsData = [
        { outcome: randomMatch[0], odd: 2.10, book_id: bookIds[0], key: 'HOME' },
        { outcome: 'Empate', odd: 3.40, book_id: bookIds[1], key: 'DRAW' },
        { outcome: randomMatch[1], odd: 4.50, book_id: bookIds[2], key: 'AWAY' }
      ];

      const { error: legsError } = await supabase.from('arb_legs').insert(
        legsData.map(leg => ({
          arb_id: arb.id,
          book_id: leg.book_id,
          outcome_key: leg.key, // Normalized Key
          odd_value: leg.odd,
          stake_value: 0, // Calculated on frontend
          payout_est: 0
        }))
      );

      if (legsError) throw legsError;

      toast("Surebet Enterprise simulada com sucesso!", "success");
      
    } catch (error: any) {
      console.error("Erro ao simular:", error);
      toast("Erro ao simular: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generateArb}
      disabled={loading}
      className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg shadow-purple-900/50 transition-all hover:scale-105 z-50 flex items-center gap-2 font-bold"
      title="Gerar Surebet de Teste (Dev Mode)"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TestTube className="w-5 h-5" />}
      <span className="hidden md:inline">Simular Arb</span>
    </button>
  );
}
