// lib/pncp.js
const BASE = 'https://pncp.gov.br/api/consulta/v1';

function fmtData(d) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}${mes}${dia}`;
}

async function fetchPNCP(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
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

async function buscarDia(data, pagina = 1, tamanhoPagina = 50) {
  const dataStr = fmtData(data);
  const data_ = await fetchPNCP('/contratacoes/publicacao', {
    dataInicial:   dataStr,
    dataFinal:     dataStr,
    tamanhoPagina,
    pagina,
  });
  return {
    items:        Array.isArray(data_?.data) ? data_.data : [],
    totalPaginas: data_?.totalPaginas || 1,
  };
}

async function capturarTudo({ diasBusca = 3, maxPaginas = 1, onProgresso } = {}) {
  const todos = [];

  for (let i = 0; i < diasBusca; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dataStr = fmtData(d);

    onProgresso?.(`Buscando ${dataStr}...`);

    try {
      let pagina    = 1;
      let totalPags = 1;
      do {
        const { items, totalPaginas } = await buscarDia(d, pagina);
        todos.push(...items);
        totalPags = totalPaginas;
        pagina++;
        if (pagina <= Math.min(totalPags, maxPaginas)) {
          await new Promise(r => setTimeout(r, 150));
        }
      } while (pagina <= totalPags && pagina <= maxPaginas);
    } catch (err) {
      onProgresso?.(`Aviso: ${dataStr} — ${err.message}`);
    }
  }

  return todos;
}

module.exports = { capturarTudo };