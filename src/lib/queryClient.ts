import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // Dados considerados frescos por 30 segundos
      gcTime: 1000 * 60 * 5, // Cache mantido por 5 minutos
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
