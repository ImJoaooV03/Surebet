import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchOddsBlazeData } from '../_lib/oddsblaze';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

  try {
    // Tenta buscar dados reais para validar a chave, forçando o erro se falhar
    console.log("Testando conexão com Odds Blaze...");
    const data = await fetchOddsBlazeData(apiKey, 'soccer', true);
    
    if (Array.isArray(data)) {
      return res.json({ 
        success: true, 
        message: `Conexão bem-sucedida! ${data.length} eventos encontrados.`,
        sample: data.slice(0, 1) // Retorna uma amostra para debug
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'A API retornou um formato inválido ou vazio.' 
      });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Falha ao conectar com a API.' 
    });
  }
}
