import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { addSeconds, addMinutes } from "date-fns";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { theOddsApiService } from "../services/theOddsApiService";

/**
 * DATA INGESTION WORKER (HYBRID)
 * 
 * Modes:
 * 1. REAL MODE: If user has API Key, fetches from The-Odds-API.
 * 2. SIMULATION MODE: If no key, generates mock data.
 */

const SAMPLE_TEAMS = {
  soccer: [
    ['Arsenal', 'Chelsea'], ['Man City', 'Liverpool'], ['Real Madrid', 'Barcelona'],
    ['Flamengo', 'Palmeiras'], ['Boca Juniors', 'River Plate'], ['Bayern', 'Dortmund']
  ],
  basketball: [
    ['Lakers', 'Celtics'], ['Warriors', 'Suns'], ['Bulls', 'Heat'],
    ['Nuggets', 'Bucks'], ['Mavericks', 'Clippers']
  ]
};

export function MockWorkerService() {
  const { toast } = useToast();
  const { user } = useAuth();
  const workerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<NodeJS.Timeout | null>(null);
  const [mode, setMode] = useState<'simulated' | 'real'>('simulated');
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Check for API Key on mount/user change
  useEffect(() => {
    async function checkSettings() {
      if (!user) return;
      const { data } = await supabase.from('user_settings').select('external_api_key').eq('user_id', user.id).single();
      if (data?.external_api_key) {
        setApiKey(data.external_api_key);
        setMode('real');
        console.log("[Worker] Switched to REAL MODE using The-Odds-API");
      } else {
        setMode('simulated');
        console.log("[Worker] Running in SIMULATION MODE");
      }
    }
    checkSettings();
  }, [user]);

  // --- GARBAGE COLLECTOR ---
  const runCleanup = async () => {
    try {
      const { error } = await supabase
        .from('arbs')
        .delete()
        .lt('expires_at', new Date().toISOString());
      if (error) console.error("Cleanup error:", error);
    } catch (err) {
      console.error("GC Error:", err);
    }
  };

  // --- WORKER LOOP ---
  useEffect(() => {
    const runLoop = async () => {
      if (mode === 'real' && apiKey) {
        // --- REAL MODE ---
        // Fetch less frequently to save quota (every 60s)
        const result = await theOddsApiService.fetchAndProcessOdds(apiKey);
        
        if (!result.success) {
          console.error("API Fetch Error:", result.error);
          
          // Tratamento inteligente de erros da API
          if (result.error?.includes("401") || result.error?.includes("Chave")) {
             toast("Erro API: Chave Inválida. Voltando para simulação.", "error");
             setMode('simulated'); // Fallback automático
          } else if (result.error?.includes("429")) {
             toast("Erro API: Limite de requisições excedido.", "warning");
          } else {
             // Erros de rede temporários não mudam o modo, apenas avisam
             console.warn("API temporariamente indisponível, tentando novamente em breve.");
          }
        }
      } else {
        // --- SIMULATION MODE ---
        await runSimulation();
      }
    };

    // Interval depends on mode
    const intervalMs = mode === 'real' ? 60000 : 15000; // 60s real, 15s sim
    
    workerRef.current = setInterval(runLoop, intervalMs);
    cleanupRef.current = setInterval(runCleanup, 30000);

    // Run immediately once
    runLoop();

    return () => {
      if (workerRef.current) clearInterval(workerRef.current);
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, [mode, apiKey, toast]);

  // --- SIMULATION LOGIC ---
  const runSimulation = async () => {
    try {
        // Ensure basic data exists
        let { data: soccer } = await supabase.from('sports').select('id').eq('key', 'soccer').single();
        if (!soccer) return;

        const isSoccer = Math.random() > 0.4;
        const sportKey = isSoccer ? 'soccer' : 'basketball';
        
        const teamsList = SAMPLE_TEAMS[sportKey];
        const randomMatch = teamsList[Math.floor(Math.random() * teamsList.length)];
        
        const { data: homeTeam } = await supabase.from('teams').select('id').eq('name', randomMatch[0]).single();
        const { data: awayTeam } = await supabase.from('teams').select('id').eq('name', randomMatch[1]).single();
        
        if (!homeTeam || !awayTeam) return;

        const isLive = Math.random() > 0.7;
        
        // Aumentado o range de tempo para até 48h (aprox 2880 min) para testar o filtro
        const { data: event } = await supabase.from('events').insert({
          sport_id: soccer.id,
          start_time: isLive ? addMinutes(new Date(), -15).toISOString() : addMinutes(new Date(), Math.floor(Math.random() * 3000)).toISOString(),
          status: isLive ? 'live' : 'scheduled',
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          provider_keys: { simulation: `evt_${Date.now()}` }
        }).select().single();

        if (!event) return;

        const { data: market } = await supabase.from('markets').insert({
          event_id: event.id,
          market_type: 'soccer_1x2_90',
          rule_set: '90min',
          provider_keys: { simulation: `mkt_${Date.now()}` }
        }).select().single();

        if (!market) return;

        const roi = 0.01 + (Math.random() * 0.05);
        const sumInv = 1 / (1 + roi);

        const { data: arb } = await supabase.from('arbs').insert({
          market_id: market.id,
          status: 'active',
          sum_inv: sumInv,
          roi: roi,
          created_at: new Date().toISOString(),
          expires_at: addSeconds(new Date(), 60).toISOString()
        }).select().single();

        // Add dummy legs for the simulation to show up in UI
        if (arb) {
           // Fetch some books
           const { data: books } = await supabase.from('books').select('id').limit(3);
           if (books && books.length >= 3) {
             const outcomes = ['HOME', 'DRAW', 'AWAY'];
             const legPromises = outcomes.map((outcome, idx) => 
                supabase.from('arb_legs').insert({
                  arb_id: arb.id,
                  book_id: books[idx].id,
                  outcome_key: outcome,
                  odd_value: 3.0, // Dummy value
                  stake_value: 0
                })
             );
             await Promise.all(legPromises);
           }
        }
    } catch (err) {
        // Silent fail
    }
  };

  return null;
}
