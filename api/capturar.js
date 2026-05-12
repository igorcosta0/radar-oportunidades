// api/capturar.js
// POST /api/capturar  — força recaptura ignorando cache
// Retorna stream de progresso via Server-Sent Events

const { capturarTudo }                        = require('../lib/pncp');
const { classificar, prioridade, normalizar } = require('../lib/palavras-chave');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { dias = 30, maxpags = 8 } = req.body || {};

  // SSE
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (tipo, dados) => {
    try { res.write(`data: ${JSON.stringify({ tipo, ...dados })}\n\n`); } catch {}
  };

  const log = (msg, nivel = 'info') => send('log', { msg, nivel });

  try {
    log('Iniciando captura ao vivo no PNCP...', 'info');
    log(`Período: últimos ${dias} dias | Máx ${maxpags} páginas`, 'info');

    let totalBruto = 0;
    const brutos = await capturarTudo({
      diasBusca:  parseInt(dias),
      maxPaginas: parseInt(maxpags),
      onProgresso: msg => { log(msg, 'info'); },
    });
    totalBruto = brutos.length;
    log(`PNCP retornou ${totalBruto} editais no período`, 'info');

    // Classificar
    log('Classificando por área (Tecnologia / Treinamento / RH)...', 'info');
    const editais = [];
    let tech = 0, trein = 0, rh = 0;

    for (const raw of brutos) {
      const item = normalizar(raw);
      if (!item.objeto) continue;
      const cl = classificar(item.objeto);
      if (!cl) continue;
      editais.push({ ...item, area: cl.area, area_label: cl.label, score: cl.score, prioridade: prioridade(cl.score), palavras_chave: cl.palavrasEncontradas });
      if (cl.area === 'tecnologia') tech++;
      else if (cl.area === 'treinamento') trein++;
      else if (cl.area === 'rh') rh++;
    }

    log(`Classificação concluída!`, 'ok');
    log(`  Tecnologia    : ${tech}`, 'ok');
    log(`  Treinamento   : ${trein}`, 'ok');
    log(`  Programas RH  : ${rh}`, 'ok');
    log(`  Total relevante: ${editais.length} de ${totalBruto} analisados`, 'ok');

    send('concluido', {
      total: editais.length,
      tecnologia: tech, treinamento: trein, rh,
      total_bruto: totalBruto,
    });
  } catch (err) {
    log(`Erro: ${err.message}`, 'erro');
    send('erro', { msg: err.message });
  }

  res.end();
};
