// api/capturar.js
const { capturarTudo }                        = require('../lib/pncp');
const { classificar, prioridade, normalizar } = require('../lib/palavras-chave');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { dias = 3, maxpags = 1 } = req.body || {};

  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (tipo, dados) => {
    try { res.write(`data: ${JSON.stringify({ tipo, ...dados })}\n\n`); } catch {}
  };
  const log = (msg, nivel = 'info') => send('log', { msg, nivel });

  try {
    log('Iniciando captura ao vivo no PNCP...', 'info');
    log(`Período: últimos ${dias} dias | ${maxpags} página/dia`, 'info');

    const brutos = await capturarTudo({
      diasBusca:   parseInt(dias),
      maxPaginas:  parseInt(maxpags),
      onProgresso: msg => log(msg, 'info'),
    });

    log(`PNCP retornou ${brutos.length} editais`, 'info');
    log('Classificando por área...', 'info');

    let tech = 0, trein = 0, rh = 0, total = 0;
    for (const raw of brutos) {
      const item = normalizar(raw);
      if (!item.objeto) continue;
      const cl = classificar(item.objeto);
      if (!cl) continue;
      total++;
      if (cl.area === 'tecnologia')  tech++;
      else if (cl.area === 'treinamento') trein++;
      else if (cl.area === 'rh')     rh++;
    }

    log(`Tecnologia   : ${tech}`,  'ok');
    log(`Treinamento  : ${trein}`, 'ok');
    log(`Programas RH : ${rh}`,    'ok');
    log(`Total relevante: ${total} de ${brutos.length}`, 'ok');

    send('concluido', { total, tecnologia: tech, treinamento: trein, rh, total_bruto: brutos.length });
  } catch (err) {
    log(`Erro: ${err.message}`, 'erro');
    send('erro', { msg: err.message });
  }

  res.end();
};