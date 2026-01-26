import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchOddsBlazeData } from '../_lib/oddsblaze';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers manuais para garantir (caso necessário)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

  try {
    // Tenta buscar dados reais para validar a chave, forçando o erro se falhar
    console.log("Testando conexão com Odds Blaze...");
    
    // Busca Futebol (Soccer) como padrão de teste
    const data = await fetchOddsBlazeData(apiKey, 'soccer', true);
    
    if (Array.isArray(data)) {
      return res.json({ 
        success: true, 
        message: `Conexão bem-sucedida! ${data.length} eventos encontrados na Odds Blaze.`,
        sample: data.slice(0, 1) // Retorna uma amostra para debug
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'A API retornou um formato inválido ou vazio.' 
      });
    }
  } catch (error: any) {
    console.error("Erro no teste:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Falha ao conectar com a API.' 
    });
  }
}
