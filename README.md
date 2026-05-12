# 🎯 Radar de Oportunidades Inteligentes

Plataforma de captura automática de editais públicos do PNCP,
classificados por área: **Tecnologia**, **Treinamento** e **Programas de RH**.

Roda 100% na nuvem via Vercel — sem instalar nada na sua máquina.

---

## 🚀 Deploy em 5 minutos (sem instalar nada)

### Passo 1 — Criar conta no GitHub
Acesse **github.com** e crie uma conta gratuita (se ainda não tiver).

### Passo 2 — Criar repositório e subir os arquivos

1. Clique em **"New repository"**
2. Nome: `radar-oportunidades`
3. Clique em **"Create repository"**
4. Clique em **"uploading an existing file"**
5. Suba **todos os arquivos** do projeto mantendo a estrutura:

```
radar-oportunidades/
├── vercel.json
├── package.json
├── api/
│   ├── editais.js
│   ├── capturar.js
│   └── cron.js
├── lib/
│   ├── palavras-chave.js
│   └── pncp.js
└── public/
    └── index.html
```

6. Clique em **"Commit changes"**

### Passo 3 — Deploy na Vercel

1. Acesse **vercel.com** e clique em **"Sign up"**
2. Escolha **"Continue with GitHub"**
3. Clique em **"Add New Project"**
4. Selecione o repositório `radar-oportunidades`
5. Clique em **"Deploy"**

✅ Pronto! Em 1-2 minutos sua URL estará disponível.
Exemplo: `https://radar-oportunidades.vercel.app`

---

## ⚙️ Variáveis de ambiente (opcional)

Na Vercel, vá em **Settings → Environment Variables** e adicione:

| Variável      | Valor padrão | Descrição                              |
|---------------|-------------|----------------------------------------|
| `DIAS_BUSCA`  | `30`        | Dias retroativos para buscar no PNCP   |
| `MAX_PAGINAS` | `8`         | Páginas por captura (500 editais/página)|
| `CRON_SECRET` | (qualquer)  | Segredo para proteger o endpoint cron  |

---

## 🔄 Como funciona

```
Você acessa a URL
      │
      ▼
Vercel chama /api/editais
      │
      ▼
Serverless function acessa a API pública do PNCP
https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
      │
      ▼
Percorre as páginas (cada uma com até 500 editais)
      │
      ▼
Para cada edital, analisa o "objetoCompra" buscando
as palavras-chave das 3 áreas:
  • Tecnologia    → software, TI, cloud, IA, cibersegurança...
  • Treinamento   → curso, capacitação, EAD, LMS, workshop...
  • RH            → recrutamento, coaching, clima org., RH...
      │
      ▼
Calcula score de relevância (0–99)
Classifica prioridade: Alta / Média / Baixa
      │
      ▼
Retorna os resultados para o dashboard
```

### Por que não há banco de dados?
A API do PNCP é pública e sempre atualizada. Cada acesso busca
dados frescos diretamente na fonte — sem necessidade de armazenar
localmente. O Vercel Cron faz uma chamada diária às 6h para
manter o cache aquecido.

---

## 📡 Endpoints da API

| Método | Rota            | Descrição                          |
|--------|-----------------|------------------------------------|
| GET    | `/api/editais`  | Lista editais classificados        |
| POST   | `/api/capturar` | Força atualização com log SSE      |
| GET    | `/api/cron`     | Executado automaticamente às 6h   |

### Parâmetros de `/api/editais`

| Parâmetro | Exemplo      | Descrição                       |
|-----------|--------------|---------------------------------|
| `area`    | `tech`       | Filtrar área (tech/trein/rh)    |
| `uf`      | `SP`         | Filtrar por estado              |
| `pri`     | `Alta`       | Filtrar prioridade              |
| `q`       | `software`   | Busca no texto do objeto        |
| `pagina`  | `1`          | Página de resultados            |
| `limite`  | `20`         | Resultados por página (máx 100) |
| `dias`    | `30`         | Período de busca no PNCP        |

---

## 🧠 Lógica de classificação

Cada edital do PNCP é analisado pelo campo `objetoCompra`.
O sistema conta quantas palavras-chave de cada área estão presentes:

- Palavra primária encontrada → **+10 pontos**
- Palavra bônus encontrada   → **+3 pontos**

**Score de prioridade:**
- Score ≥ 30 → 🔴 Alta
- Score ≥ 13 → 🟡 Média
- Score < 13 → 🟢 Baixa

A área com mais pontos "vence" e o edital é classificado nela.

---

## 📋 Exemplos de editais capturados por área

**Tecnologia:**
- "Contratação de empresa para desenvolvimento de sistema web de gestão"
- "Aquisição de licenças Microsoft 365 e suporte técnico especializado"
- "Implantação de solução de cibersegurança e SOC"

**Treinamento:**
- "Contratação de empresa para capacitação de servidores em EAD"
- "Serviços de treinamento e certificação em gestão de projetos"
- "Plataforma LMS para educação corporativa com trilhas de aprendizagem"

**Programas de RH:**
- "Consultoria em gestão de pessoas e avaliação de desempenho"
- "Serviços de recrutamento e seleção para cargos executivos"
- "Programa de coaching e desenvolvimento de lideranças"

---

## 🆓 Plano gratuito da Vercel (Hobby)

- ✅ 100GB de banda por mês
- ✅ Funções serverless ilimitadas
- ✅ 1 Cron job (executa 1x por dia)
- ✅ Deploy automático a cada push no GitHub
- ✅ HTTPS incluído
- ✅ Domínio `.vercel.app` gratuito
