// lib/palavras-chave.js
// Classificação por área com base no objetoCompra do PNCP

const DICIONARIO = {
  tecnologia: {
    label: 'Tecnologia',
    peso: [
      // Software / Sistemas
      'software','sistema de informação','sistema integrado','sistema web',
      'desenvolvimento de sistema','desenvolvimento de software','aplicativo',
      'aplicação web','portal web','erp','crm','lms','cms','plataforma digital',
      // TI geral
      'tecnologia da informação','tecnologia de informação','serviços de ti',
      'consultoria de ti','solução de ti','infraestrutura de ti',
      // Cloud / Hosting
      'computação em nuvem','cloud computing','nuvem','saas','paas','iaas',
      'microsoft azure','amazon web services','aws','google cloud','hospedagem',
      // Infraestrutura
      'data center','servidor','storage','backup','rede corporativa',
      'rede lógica','cabeamento estruturado','switch','roteador','nobreak',
      // Segurança
      'cibersegurança','segurança da informação','segurança cibernética',
      'firewall','antivírus','siem','soc','pentest','vulnerabilidade',
      // Dados / IA
      'inteligência artificial','machine learning','análise de dados',
      'business intelligence','big data','ciência de dados','bi ','rpa',
      'automação de processos','chatbot','processamento de dados',
      // Hardware
      'computador','notebook','desktop','impressora','equipamento de informática',
      'equipamentos de informática','scanner','projetor','tablet',
      // Suporte
      'suporte técnico','suporte de ti','help desk','service desk',
      'manutenção de equipamentos','manutenção preventiva de computador',
      // Licenças
      'licença de software','licenciamento de software','microsoft office',
      'microsoft 365','google workspace','adobe',
    ],
    bonus: [
      'digital','digitalização','transformação digital','automação',
      'inovação tecnológica','conectividade','internet','wi-fi','iot',
      'monitoramento','dashboard','integração de sistemas',
    ],
  },

  treinamento: {
    label: 'Treinamento',
    peso: [
      // Termos diretos
      'treinamento','capacitação','curso ','cursos ','formação profissional',
      'formação continuada','qualificação profissional','qualificação de pessoal',
      'qualificação de servidores','capacitar servidores',
      // Modalidades
      'ead','e-learning','ensino a distância','ensino à distância',
      'educação corporativa','educação continuada','educação profissional',
      'educação técnica','aprendizagem corporativa',
      // Eventos
      'workshop','seminário','congresso','palestra','webinar',
      'bootcamp','imersão','jornada de aprendizagem',
      // Certificação
      'certificação profissional','certificado','trilha de aprendizagem',
      'trilha de conhecimento','trilha de capacitação',
      // Plataformas
      'plataforma de aprendizagem','ambiente virtual de aprendizagem',
      'ava ','moodle','learning management system','plataforma lms',
      // Conteúdo
      'material didático','conteúdo didático','conteúdo instrucional',
      'elaboração de conteúdo','produção de conteúdo educacional',
      // Formação formal
      'escola corporativa','universidade corporativa',
      'pós-graduação','especialização','mba ','graduação corporativa',
      // Idiomas
      'curso de inglês','curso de espanhol','idiomas','língua estrangeira',
    ],
    bonus: [
      'aprendizagem','aprendizado','habilidades','competências',
      'desenvolvimento profissional','reciclagem','atualização profissional',
      'nivelamento','capacitar','instrutoria','facilitação',
    ],
  },

  rh: {
    label: 'Programas de RH',
    peso: [
      // Gestão de pessoas
      'recursos humanos','gestão de pessoas','gestão de rh',
      'administração de pessoal','gestão de capital humano',
      // Recrutamento
      'recrutamento e seleção','recrutamento e  seleção','processo seletivo',
      'seleção de pessoal','seleção de servidores','headhunting',
      'banco de talentos','atração de talentos','talent acquisition',
      // Consultoria
      'consultoria de rh','consultoria em gestão de pessoas',
      'consultoria organizacional','consultoria de recursos humanos',
      'consultoria em rh','assessoria de rh',
      // Avaliação
      'avaliação de desempenho','avaliação de competências',
      'gestão por competências','mapeamento de competências',
      'avaliação 360','feedback organizacional',
      // Cultura / Clima
      'clima organizacional','pesquisa de clima','cultura organizacional',
      'engajamento de colaboradores','bem-estar organizacional',
      'saúde organizacional','qualidade de vida no trabalho',
      // Liderança
      'programa de liderança','desenvolvimento de lideranças',
      'coaching executivo','coaching ','mentoria ','mentoring',
      'liderança e gestão','programa de gestão',
      // Diversidade
      'diversidade e inclusão','diversidade, equidade',
      'programa de diversidade','inclusão social','equidade de gênero',
      // Benefícios
      'plano de cargos e salários','política de remuneração',
      'gestão de benefícios','programa de benefícios',
      'plano de saúde','vale alimentação',
      // Programas
      'programa de jovens talentos','programa de estágio',
      'programa trainee','programa de aprendizagem','lei do aprendiz',
      'outplacement','recolocação profissional','desligamento assistido',
      'plano de desenvolvimento individual','pdi ',
    ],
    bonus: [
      'colaboradores','funcionários','trabalhadores','equipe',
      'talentos','people analytics','onboarding','offboarding',
      'employer branding','people ','endomarketing',
    ],
  },
};

/**
 * Classifica um texto (objetoCompra) nas áreas definidas.
 * Retorna null se não for relevante para nenhuma área.
 * Retorna { area, label, score, palavrasEncontradas } se relevante.
 */
function classificar(texto) {
  if (!texto || texto.trim().length < 5) return null;
  const t = texto.toLowerCase();
  const resultados = {};

  for (const [area, cfg] of Object.entries(DICIONARIO)) {
    let score = 0;
    const encontradas = new Set();

    for (const kw of cfg.peso) {
      if (t.includes(kw.toLowerCase().trim())) {
        score += 10;
        encontradas.add(kw.trim());
      }
    }
    for (const kw of cfg.bonus) {
      if (t.includes(kw.toLowerCase().trim())) {
        score += 3;
        encontradas.add(kw.trim());
      }
    }

    if (score >= 10) { // pelo menos 1 palavra-chave primária
      resultados[area] = { score, palavrasEncontradas: [...encontradas] };
    }
  }

  if (Object.keys(resultados).length === 0) return null;

  // Área com maior score vence
  const [areaMelhor, dados] = Object.entries(resultados)
    .sort((a, b) => b[1].score - a[1].score)[0];

  return {
    area:              areaMelhor,
    label:             DICIONARIO[areaMelhor].label,
    score:             dados.score,
    palavrasEncontradas: dados.palavrasEncontradas.slice(0, 6),
  };
}

function prioridade(score) {
  if (score >= 30) return 'Alta';
  if (score >= 13) return 'Média';
  return 'Baixa';
}

function normalizar(item) {
  const orgao   = item.orgaoEntidade || {};
  const unidade = item.unidadeOrgao  || {};
  const num     = item.numeroControlePNCP || `${orgao.cnpj||'x'}-${item.anoCompra}-${item.sequencialCompra}`;
  const dataEnc = (item.dataEncerramentoProposta || item.dataAberturaProposta || '').slice(0, 10);
  const dataPub = (item.dataPublicacaoPncp || '').slice(0, 10);

  return {
    id:               num,
    objeto:           (item.objetoCompra || '').trim(),
    orgao:            orgao.razaoSocial || unidade.nomeUnidade || '',
    uf:               unidade.ufSigla || '',
    municipio:        unidade.municipioNome || '',
    modalidade:       item.modalidadeNome || '',
    valor:            item.valorTotalEstimado || 0,
    data_publicacao:  dataPub,
    data_encerramento: dataEnc,
    link:             item.linkSistemaOrigem || `https://pncp.gov.br/app/editais/${num}`,
    situacao:         item.situacaoCompraNome || '',
  };
}

module.exports = { classificar, prioridade, normalizar, DICIONARIO };
