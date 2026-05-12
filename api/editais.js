// api/editais.js
// Vercel Serverless Function
// GET /api/editais?area=tech&uf=SP&pri=Alta&q=software&pagina=1&limite=20&dias=30

const { capturarTudo }              = require('../lib/pncp');
const { classificar, prioridade, normalizar } = require('../lib/palavras-chave');

// Cache em memória por instância serverless (segundos de vida, mas evita
// chamadas duplicadas em burst de requests simultâneos)
let CACHE = null;
let CACHE_TS = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function obterEditais(diasBusca, maxPaginas) {
  const agora = Date.now();
  if (CACHE && agora - CACHE_TS < CACHE_TTL) return CACHE;

  const logs = [];
  const brutos = await capturarTudo({
    diasBusca,
    maxPaginas,
    onProgresso: msg => logs.push(msg),
  });

  // Classificar e filtrar
  const editais = [];
  for (const raw of brutos) {
    const item = normalizar(raw);
    if (!item.objeto) continue;

    const classif = classificar(item.objeto);
    if (!classif) continue;

    const pri = prioridade(classif.score);
    editais.push({
      ...item,
      area:             classif.area,
      area_label:       classif.label,
      score:            classif.score,
      prioridade:       pri,
      palavras_chave:   classif.palavrasEncontradas,
    });
  }

  // Ordenar por score desc
  editais.sort((a, b) => b.score - a.score);

  // Stats
  const stats = {
    total:        editais.length,
    tecnologia:   editais.filter(e => e.area === 'tecnologia').length,
    treinamento:  editais.filter(e => e.area === 'treinamento').length,
    rh:           editais.filter(e => e.area === 'rh').length,
    alta:         editais.filter(e => e.prioridade === 'Alta').length,
    media:        editais.filter(e => e.prioridade === 'Média').length,
    urgente:      editais.filter(e => {
      if (!e.data_encerramento) return false;
      const dias = Math.round((new Date(e.data_encerramento+'T23:59:59') - new Date()) / 86400000);
      return dias >= 0 && dias <= 7;
    }).length,
    valor_total:  editais.reduce((s, e) => s + (e.valor || 0), 0),
    capturado_em: new Date().toISOString(),
    total_bruto:  brutos.length,
    logs,
  };

  CACHE    = { editais, stats };
  CACHE_TS = agora;

  return CACHE;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' });

  const {
    area, uf, pri, q,
    pagina  = '1',
    limite  = '20',
    dias    = '30',
    maxpags = '8',
  } = req.query;

  try {
    const { editais: todos, stats } = await obterEditais(
      parseInt(dias),
      parseInt(maxpags)
    );

    // Filtrar
    let resultado = todos;
    if (area && area !== 'all') resultado = resultado.filter(e => e.area === area);
    if (uf)  resultado = resultado.filter(e => e.uf  === uf);
    if (pri) resultado = resultado.filter(e => e.prioridade === pri);
    if (q) {
      const qLow = q.toLowerCase();
      resultado = resultado.filter(e =>
        e.objeto.toLowerCase().includes(qLow) ||
        (e.orgao||'').toLowerCase().includes(qLow)
      );
    }

    // Paginar
    const pag    = Math.max(1, parseInt(pagina));
    const lim    = Math.min(100, Math.max(1, parseInt(limite)));
    const offset = (pag - 1) * lim;
    const page   = resultado.slice(offset, offset + lim);

    // UFs disponíveis
    const ufs = [...new Set(todos.map(e => e.uf).filter(Boolean))].sort();

    res.status(200).json({
      editais:      page,
      total:        resultado.length,
      pagina:       pag,
      totalPaginas: Math.ceil(resultado.length / lim),
      stats:        area && area !== 'all' ? null : stats,
      ufs,
      capturado_em: stats.capturado_em,
    });
  } catch (err) {
    console.error('[/api/editais]', err.message);
    res.status(500).json({
      erro:      'Erro ao capturar dados do PNCP.',
      detalhe:   err.message,
      editais:   [],
      total:     0,
      stats:     null,
    });
  }
};
