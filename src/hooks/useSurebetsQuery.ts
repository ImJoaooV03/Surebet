import { useQuery, useQueryClient } from "@tanstack/react-query";
import { surebetService, FetchSurebetsParams } from "../services/surebetService";
import { supabase } from "../lib/supabase";
import { useEffect } from "react";

/**
 * Hook Customizado usando React Query.
 * Combina cache, refetch automático e atualizações em tempo real via WebSocket.
 */
export function useSurebetsQuery(params: FetchSurebetsParams) {
  const queryClient = useQueryClient();
  const queryKey = ['surebets', params];

  // 1. React Query para busca de dados e cache
  const query = useQuery({
    queryKey,
    queryFn: () => surebetService.fetchSurebets(params),
    refetchInterval: 10000, // Polling de backup a cada 10s
  });

  // 2. Supabase Realtime para invalidação de cache instantânea
  useEffect(() => {
    const channel = supabase
      .channel('realtime-arbs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arbs' },
        () => {
          // Quando houver mudança no banco, invalida o cache para forçar atualização
          queryClient.invalidateQueries({ queryKey: ['surebets'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
