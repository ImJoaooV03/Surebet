import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { addSeconds, addMinutes } from "date-fns";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { theOddsApiService } from "../services/theOddsApiService";
import { rapidApiService } from "../services/rapidApiService";
import { betsApiService } from "../services/betsApiService";
import { sportmonksService } from "../services/sportmonksService";

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
  
  // API Keys
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [secApiKey, setSecApiKey] = useState<string | null>(null);
  const [terApiKey, setTerApiKey] = useState<string | null>(null);
  const [quatApiKey, setQuatApiKey] = useState<string | null>(null);

  // Check for API Keys AND Enabled Status
  useEffect(() => {
    async function checkSettings() {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_settings')
        .select('external_api_key, api_enabled, secondary_api_key, secondary_api_enabled, tertiary_api_key, tertiary_api_enabled, quaternary_api_key, quaternary_api_enabled')
        .eq('user_id', user.id)
        .single();

      const hasPrimary = data?.external_api_key && data?.api_enabled !== false;
      const hasSecondary = data?.secondary_api_key && data?.secondary_api_enabled === true;
      const hasTertiary = data?.tertiary_api_key && data?.tertiary_api_enabled === true;
      const hasQuaternary = data?.quaternary_api_key && data?.quaternary_api_enabled === true;

      if (hasPrimary || hasSecondary || hasTertiary || hasQuaternary) {
        setApiKey(hasPrimary ? data.external_api_key : null);
        setSecApiKey(hasSecondary ? data.secondary_api_key : null);
        setTerApiKey(hasTertiary ? data.tertiary_api_key : null);
        setQuatApiKey(hasQuaternary ? data.quaternary_api_key : null);
        setMode('real');
        console.log(`[Worker] REAL MODE Active. P:${hasPrimary} S:${hasSecondary} T:${hasTertiary} Q:${hasQuaternary}`);
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
      if (mode === 'real') {
        // --- REAL MODE ---
        // 1. Executa API Principal
        if (apiKey) {
          const result = await theOddsApiService.fetchAndProcessOdds(apiKey);
          if (!result.success && result.error?.includes("401")) {
             toast("Erro API Principal: Chave Inválida", "error");
          }
        }

        // 2. Executa API Secundária (se configurada)
        if (secApiKey) {
           await rapidApiService.fetchAndProcessOdds(secApiKey);
        }

        // 3. Executa API Terciária (se configurada)
        if (terApiKey) {
           await betsApiService.fetchAndProcessOdds(terApiKey);
        }

        // 4. Executa API Quaternária (se configurada)
        if (quatApiKey) {
           await sportmonksService.fetchAndProcessOdds(quatApiKey);
        }

      } else {
        // --- SIMULATION MODE ---
        await runSimulation();
      }
    };

    const intervalMs = mode === 'real' ? 60000 : 15000;
    
    workerRef.current = setInterval(runLoop, intervalMs);
    cleanupRef.current = setInterval(runCleanup, 30000);

    runLoop();

    return () => {
      if (workerRef.current) clearInterval(workerRef.current);
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, [mode, apiKey, secApiKey, terApiKey, quatApiKey, toast]);

  // --- SIMULATION LOGIC ---
  const runSimulation = async () => {
    try {
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

        if (arb) {
           const { data: books } = await supabase.from('books').select('id').limit(3);
           if (books && books.length >= 3) {
             const outcomes = ['HOME', 'DRAW', 'AWAY'];
             const legPromises = outcomes.map((outcome, idx) => 
                supabase.from('arb_legs').insert({
                  arb_id: arb.id,
                  book_id: books[idx].id,
                  outcome_key: outcome,
                  odd_value: 3.0,
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
