import type { VercelRequest, VercelResponse } from '@vercel/node';
import { testOddsBlazeConnection } from '../_lib/oddsblaze.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

  try {
    // Usa a nova função de teste dedicada
    const result = await testOddsBlazeConnection(apiKey);
    
    if (result.success) {
      return res.json({ 
        success: true, 
        message: `Conexão bem-sucedida! Acesso confirmado a ${result.count} esportes.`
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: result.error || 'Falha na validação da chave.' 
      });
    }
  } catch (error: any) {
    console.error("Erro no teste:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno no teste.' 
    });
  }
}
