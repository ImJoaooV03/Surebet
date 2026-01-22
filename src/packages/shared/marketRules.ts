/**
 * REGRAS DE MERCADO E NORMALIZAÇÃO
 * Garante que apenas mercados idênticos e coberturas completas sejam comparados.
 */

export type MarketFamily = '1x2' | 'moneyline' | 'totals' | 'handicap' | 'btts';
export type Period = 'ft' | '1h' | '2h' | 'q1' | 'q2' | 'q3' | 'q4';

export interface NormalizedMarketInfo {
  family: MarketFamily;
  period: Period;
  line?: number;
  outcomes: string[]; // Lista de outcomes esperados para cobertura 100%
}

export const MarketRules = {
  /**
   * Normaliza o nome do mercado vindo da API para um padrão interno estrito.
   * Ex: "Over/Under 2.5 Goals" -> family: 'totals', line: 2.5, period: 'ft'
   */
  normalize(apiMarketKey: string, outcomes: { name: string; price: number }[]): NormalizedMarketInfo | null {
    // The-Odds-API keys: 'h2h', 'totals', 'spreads'
    
    // 1. H2H (Moneyline / 1X2)
    if (apiMarketKey === 'h2h') {
      // Detecta se é 2-way ou 3-way baseado nos outcomes disponíveis
      const hasDraw = outcomes.some(o => o.name.toLowerCase() === 'draw' || o.name.toLowerCase() === 'x');
      
      if (hasDraw) {
        return {
          family: '1x2',
          period: 'ft',
          outcomes: ['HOME', 'DRAW', 'AWAY']
        };
      } else {
        return {
          family: 'moneyline',
          period: 'ft',
          outcomes: ['HOME', 'AWAY']
        };
      }
    }

    // 2. Totals (Over/Under)
    if (apiMarketKey === 'totals') {
      // Na The-Odds-API, outcomes vêm como "Over" e "Under" e geralmente têm um campo 'point' (linha)
      // Mas a estrutura bruta aqui nos outcomes é {name, price, point?}.
      // Precisamos extrair a linha. Assumimos que todos outcomes do mesmo market group têm a mesma linha.
      const line = (outcomes[0] as any).point;
      
      if (typeof line === 'number') {
        return {
          family: 'totals',
          period: 'ft',
          line: line,
          outcomes: ['OVER', 'UNDER']
        };
      }
    }

    return null; // Mercado não suportado ou desconhecido
  },

  /**
   * Verifica se um conjunto de outcomes cobre 100% do mercado (Regra 2)
   */
  validateCoverage(family: MarketFamily, availableOutcomes: string[]): boolean {
    const normalized = availableOutcomes.map(o => o.toUpperCase());

    if (family === '1x2') {
      return normalized.includes('HOME') && normalized.includes('DRAW') && normalized.includes('AWAY');
    }

    if (family === 'moneyline') {
      return normalized.includes('HOME') && normalized.includes('AWAY');
    }

    if (family === 'totals') {
      return normalized.includes('OVER') && normalized.includes('UNDER');
    }

    return false;
  },

  /**
   * Normaliza a chave do outcome
   */
  normalizeOutcomeKey(name: string, homeTeam: string, awayTeam: string): string {
    const n = name.toLowerCase();
    const h = homeTeam.toLowerCase();
    const a = awayTeam.toLowerCase();

    if (n === h) return 'HOME';
    if (n === a) return 'AWAY';
    if (n === 'draw' || n === 'x') return 'DRAW';
    if (n.includes('over')) return 'OVER';
    if (n.includes('under')) return 'UNDER';
    
    return 'UNKNOWN';
  }
};
