import { z } from "zod";

/**
 * Zod Schemas for Runtime Validation
 * Ensures that data coming from Supabase/API matches exactly what the UI expects.
 * Discards corrupted, incomplete, or invalid records.
 */

// Validação básica de UUID
const uuidSchema = z.string().uuid();

// Validação de Data (deve ser uma string ISO válida)
const dateSchema = z.string().datetime().transform((str) => new Date(str));

// Schema para o Evento (Jogo)
export const EventSchema = z.object({
  status: z.enum(['scheduled', 'live', 'finished']),
  start_time: dateSchema,
  leagues: z.object({
    name: z.string().min(1)
  }).nullable().optional(),
  sports: z.object({
    name: z.string().min(1)
  }).nullable().optional(),
  teams_home: z.object({
    name: z.string().min(1)
  }).nullable().optional(),
  teams_away: z.object({
    name: z.string().min(1)
  }).nullable().optional(),
});

// Schema para o Mercado
export const MarketSchema = z.object({
  market_type: z.string(),
  rule_set: z.string(),
  line_value: z.number().nullable(),
  events: EventSchema
});

// Schema para as Odds (Legs)
export const LegSchema = z.object({
  outcome_key: z.string(),
  odd_value: z.number().positive(), // Odds devem ser positivas
  books: z.object({
    name: z.string()
  }).nullable().optional()
});

// Schema Principal da Surebet (Arb)
export const SurebetSchema = z.object({
  id: uuidSchema,
  roi: z.number(),
  sum_inv: z.number(),
  status: z.enum(['active', 'expired', 'sent']),
  created_at: dateSchema,
  expires_at: dateSchema,
  markets: MarketSchema,
  arb_legs: z.array(LegSchema).min(2) // Pelo menos 2 pernas para uma aposta
});

// Tipo inferido para uso no TypeScript
export type ValidatedSurebet = z.infer<typeof SurebetSchema>;
