// lib/pncp.js
// Cliente para a API pública do PNCP — usa fetch nativo (Node 18+)
// Sem dependências externas. Funciona em Vercel serverless.

const BASE = 'https://pncp.gov.br/api/consulta/v1';

function fmtData(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function fetchPNCP(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'RadarOportunidades/1.0',
    },
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`PNCP ${res.status}: ${url}`);
  return res.json();
}

/**
 * Busca contratações publicadas no período.
 * Retorna array de itens brutos do PNCP.
 */
async function buscarPublicados({ diasBusca = 30, pagina = 1, tamanhoPagina = 500 } = {}) {
  const dataFinal   = fmtData(new Date());
  const dataInicial = fmtData(diasAtras(diasBusca));

  const data = await fetchPNCP('/contratacoes/publicacao', {
    dataInicial,
    dataFinal,
    tamanhoPagina,
    pagina,
  });

  return {
    items:        Array.isArray(data?.data) ? data.data : [],
    totalPaginas: data?.totalPaginas || 1,
    totalRegistros: data?.totalRegistros || 0,
  };
}

/**
 * Busca propostas com prazo ainda em aberto.
 */
async function buscarPropostasAbertas({ diasBusca = 30, pagina = 1, tamanhoPagina = 500 } = {}) {
  const dataFinal   = fmtData(new Date());
  const dataInicial = fmtData(diasAtras(diasBusca));

  try {
    const data = await fetchPNCP('/contratacoes/proposta', {
      dataInicial,
      dataFinal,
      tamanhoPagina,
      pagina,
    });
    return {
      items:        Array.isArray(data?.data) ? data.data : [],
      totalPaginas: data?.totalPaginas || 1,
    };
  } catch {
    return { items: [], totalPaginas: 0 };
  }
}

/**
 * Captura completa: percorre páginas e retorna APENAS items brutos.
 * O chamador é responsável por filtrar/classificar.
 */
async function capturarTudo({ diasBusca = 30, maxPaginas = 8, onProgresso } = {}) {
  const todos = [];

  // ── Fase 1: publicados ──────────────────────────────────────────
  let pagina = 1;
  let totalPags = 1;

  do {
    onProgresso?.(`PNCP publicados — página ${pagina}...`);
    const { items, totalPaginas } = await buscarPublicados({ diasBusca, pagina });
    todos.push(...items);
    totalPags = totalPaginas;
    pagina++;
    if (pagina <= Math.min(totalPags, maxPaginas)) {
      await new Promise(r => setTimeout(r, 300)); // delay gentil
    }
  } while (pagina <= totalPags && pagina <= maxPaginas);

  // ── Fase 2: propostas abertas (pag 1 apenas para não exceder timeout) ──
  onProgresso?.('PNCP propostas abertas...');
  const { items: abertas } = await buscarPropostasAbertas({ diasBusca, pagina: 1 });
  todos.push(...abertas);

  return todos;
}

module.exports = { capturarTudo, buscarPublicados, buscarPropostasAbertas };
