import axios from 'axios';

/**
 * Serviço para API Quaternária (Sportmonks V3)
 * Documentação: https://docs.sportmonks.com/football/endpoints/odds/pre-match-odds
 */

const BASE_URL = 'https://api.sportmonks.com/v3/football';

interface SportmonksOdd {
  id: number;
  fixture_id: number;
  market_id: number;
  bookmaker_id: number;
  label: string; // "1", "X", "2"
  value: string; // "2.50"
  probability: string;
}

export const sportmonksService = {
  /**
   * Busca odds da Sportmonks API
   */
  async fetchAndProcessOdds(apiToken: string) {
    let totalEvents = 0;
    let totalArbs = 0;

    console.group("📡 [Sportmonks] Starting Scan...");

    if (!apiToken) {
      console.warn("Sportmonks API Token is missing.");
      console.groupEnd();
      return { success: false, error: "Token ausente" };
    }

    try {
      // Utilizando Axios conforme sugerido pelo debug agent
      // Endpoint de odds pré-jogo
      const response = await axios.get(`${BASE_URL}/odds/pre-match`, {
        params: {
          api_token: apiToken,
          per_page: 10 // Limitando para teste
        }
      });

      const json = response.data;
      
      if (!json.data) {
         console.warn("Sportmonks returned no data structure:", json);
         return { success: false, error: "Estrutura de dados inválida" };
      }

      const oddsData: SportmonksOdd[] = json.data;
      totalEvents += oddsData.length;

      // Normalização e Processamento
      // Aqui mapeamos os dados brutos da Sportmonks para o formato que nosso engine entende
      const normalizedOdds = oddsData.map((item) => ({
        source: 'Sportmonks',
        eventId: item.fixture_id,
        marketId: item.market_id,
        outcome: item.label,
        odd: parseFloat(item.value),
        bookmakerId: item.bookmaker_id,
        timestamp: new Date().toISOString()
      }));

      console.log(`✅ Sportmonks Scan Complete. Fetched ${normalizedOdds.length} odds records.`);
      
      // Nota: Em um cenário real, aqui chamaríamos this.processEvent() para salvar no banco
      // Para o MVP, retornamos o sucesso da conexão.

    } catch (error: any) {
      console.error("❌ Error fetching Sportmonks:", error.message);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
           console.groupEnd();
           return { success: false, error: "Token Sportmonks inválido." };
        }
      }
      
      console.groupEnd();
      return { success: false, error: error.message };
    }

    console.groupEnd();
    return { success: true, events: totalEvents, arbs: totalArbs };
  }
};
