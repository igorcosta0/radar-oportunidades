// api/cron.js
// Vercel Cron Job — executa todo dia às 6h (definido em vercel.json)
// Faz uma captura e aquece o cache para que o primeiro acesso do dia seja rápido.

const { capturarTudo }                        = require('../lib/pncp');
const { classificar, prioridade, normalizar } = require('../lib/palavras-chave');

module.exports = async function handler(req, res) {
  // Vercel envia Authorization header nos cron jobs para segurança
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }

  console.log(`[CRON] Iniciando captura diária — ${new Date().toISOString()}`);

  try {
    const brutos = await capturarTudo({
      diasBusca:  parseInt(process.env.DIAS_BUSCA || 30),
      maxPaginas: parseInt(process.env.MAX_PAGINAS || 8),
      onProgresso: msg => console.log('[CRON]', msg),
    });

    let tech = 0, trein = 0, rh = 0, total = 0;
    for (const raw of brutos) {
      const item = normalizar(raw);
      if (!item.objeto) continue;
      const cl = classificar(item.objeto);
      if (!cl) continue;
      total++;
      if (cl.area === 'tecnologia') tech++;
      else if (cl.area === 'treinamento') trein++;
      else if (cl.area === 'rh') rh++;
    }

    console.log(`[CRON] Concluído: ${total} relevantes (tech:${tech} trein:${trein} rh:${rh})`);
    res.status(200).json({ ok: true, total, tecnologia: tech, treinamento: trein, rh });
  } catch (err) {
    console.error('[CRON] Erro:', err.message);
    res.status(500).json({ erro: err.message });
  }
};
