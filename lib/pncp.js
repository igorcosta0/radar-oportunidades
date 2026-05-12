// lib/pncp.js
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
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`PNCP ${res.status}: ${url}`);
  return res.json();
}

async function buscarPublicados({ diasBusca = 7, pagina = 1, tamanhoPagina = 50 } = {}) {
  const dataFinal   = fmtData(new Date());
  const dataInicial = fmtData(diasAtras(diasBusca));

  const data = await fetchPNCP('/contratacoes/publicacao', {
    dataInicial,
    dataFinal,
    tamanhoPagina,
    pagina,
  });

  return {
    items:          Array.isArray(data?.data) ? data.data : [],
    totalPaginas:   data?.totalPaginas || 1,
    totalRegistros: data?.totalRegistros || 0,
  };
}

async function buscarPropostasAbertas({ diasBusca = 7, pagina = 1, tamanhoPagina = 50 } = {}) {
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

async function capturarTudo({ diasBusca = 7, maxPaginas = 2, onProgresso } = {}) {
  const todos = [];

  let pagina = 1;
  let totalPags = 1;

  do {
    onProgresso?.(`PNCP publicados — página ${pagina}...`);
    const { items, totalPaginas } = await buscarPublicados({ diasBusca, pagina });
    todos.push(...items);
    totalPags = totalPaginas;
    pagina++;
    if (pagina <= Math.min(totalPags, maxPaginas)) {
      await new Promise(r => setTimeout(r, 200));
    }
  } while (pagina <= totalPags && pagina <= maxPaginas);

  onProgresso?.('PNCP propostas abertas...');
  const { items: abertas } = await buscarPropostasAbertas({ diasBusca, pagina: 1 });
  todos.push(...abertas);

  return todos;
}

module.exports = { capturarTudo, buscarPublicados, buscarPropostasAbertas };