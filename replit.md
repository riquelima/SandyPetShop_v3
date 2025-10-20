# Sandy's Pet Shop - Sistema de Agendamento

## Visão Geral
Aplicação web para agendamento de serviços de pet shop desenvolvida com React, TypeScript e Vite. O sistema permite que clientes agendem banho, tosa, creche pet, hotel pet e serviços de pet móvel. Inclui área administrativa para gerenciar agendamentos, clientes mensalistas e cadastros de creche.

**Interface otimizada para mobile-first** (90% dos usuários acessam via mobile).

## Tecnologias
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (autenticação e banco de dados PostgreSQL)
- **Estilização**: Tailwind CSS (via CDN)
- **PWA**: Service Worker para funcionalidades offline
- **IA**: Google Gemini API (para recursos avançados)

## Estrutura do Projeto
- `App.tsx` - Componente principal com toda a lógica da aplicação (4638 linhas, 860 classes Tailwind)
- `index.tsx` - Ponto de entrada da aplicação e registro do Service Worker
- `supabaseClient.ts` - Configuração do cliente Supabase
- `types.ts` - Definições de tipos TypeScript
- `constants.ts` - Constantes da aplicação (serviços, preços, horários)
- `vite.config.ts` - Configuração do Vite
- `manifest.json` - Manifesto PWA
- `sw.js` - Service Worker

## Configuração Replit
- **Porta**: 5000 (configurada para ambiente Replit)
- **Host**: 0.0.0.0 (permite acesso via proxy do Replit)
- **HMR**: Configurado para funcionar através do proxy (porta 443)
- **Workflow**: Configurado para executar `npm run dev` automaticamente
- **Deploy**: Configurado para autoscale com build e preview commands

## Variáveis de Ambiente
O projeto usa as seguintes variáveis de ambiente (opcionais no `.env.local`):
- `GEMINI_API_KEY` - Chave API do Google Gemini (opcional - para recursos de IA futuros)
- `VITE_SUPABASE_URL` - URL do projeto Supabase (hardcoded no código)
- `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase (hardcoded no código)

**Nota**: As credenciais do Supabase já estão configuradas no código. O GEMINI_API_KEY é opcional e não afeta a funcionalidade atual.

## Funcionalidades
### Área Pública
- Agendamento de serviços (banho, tosa, banho & tosa)
- Seleção de peso do pet e serviços adicionais
- Validação de horários disponíveis
- Confirmação via WhatsApp

### Área Administrativa (requer login)
- Gerenciamento de agendamentos (Banho & Tosa)
- Cadastro e gerenciamento de clientes mensalistas
- Agendamentos de Pet Móvel
- Cadastros de Creche Pet
- Agendamentos de Hotel Pet
- Gestão de clientes

## Otimizações Mobile-First
### Interface Otimizada para Touch (≥44px)
- **Ícones**: h-7 w-7 (28px) para pequenos, h-8 w-8 (32px) para médios
- **Inputs**: px-5 py-4 (~56px altura total) - 105 inputs otimizados
- **Botões**: py-3.5 px-6 com min-h-[56px]
- **Touch targets**: Todos ≥44px conforme diretrizes WCAG

### Tipografia Mobile
- **Títulos**: text-3xl (34 ocorrências)
- **Subtítulos**: text-2xl (11 ocorrências)
- **Labels**: text-base font-semibold (237 labels)
- **Maior legibilidade** em telas pequenas

### Layout Responsivo
- **Grids**: 4 colunas desktop → 2 colunas mobile
- **Modais**: Full-width em mobile (max-w-full sm:max-w-sm/md)
- **Cards**: Padding aumentado (p-6 sm:p-5)
- **Espaçamentos**: space-y-6 entre campos (36 seções)
- **Border radius**: rounded-2xl para visual moderno (42 elementos)

### Admin Dashboard Mobile
- Menu hamburguer otimizado
- Sidebar responsiva com overlay
- Botões de navegação maiores (px-5 py-4, text-base)
- Header compacto (h-18)

## Como Executar
1. As dependências já foram instaladas (`npm install`)
2. O servidor inicia automaticamente via workflow configurado (`npm run dev`)
3. Acesse via preview do Replit na porta 5000
4. Para build de produção: `npm run build`
5. Para testar build de produção localmente: `npm run preview`

## Banco de Dados Supabase
O projeto usa um banco de dados Supabase existente com as seguintes tabelas:
- `appointments` - Agendamentos
- `clients` - Clientes
- `monthly_clients` - Clientes mensalistas
- `daycare_registrations` - Cadastros de creche
- `hotel_registrations` - Cadastros de hotel

## Deployment
O projeto está configurado para deployment no Replit:
- **Build**: `npm run build` - compila o projeto para produção
- **Run**: `npm run preview` - serve a versão de produção
- **Deployment Target**: Autoscale (ideal para aplicações web sem estado)

## Histórico de Atualizações

### 20 de outubro de 2025 - Otimização Mobile-First Completa
**Aprovado pelo Architect ✅**

#### Mudanças Implementadas (via sed sistemático em 4638 linhas):

**1. Ícones (40 total):**
- ✅ 30 ícones h-5 w-5 → h-7 w-7 (PawIcon, UserIcon, WhatsAppIcon, etc)
- ✅ 10 ícones h-6 w-6 → h-8 w-8 (MenuIcon, CloseIcon, ErrorIcon, etc)

**2. Inputs e Formulários (105 inputs):**
- ✅ Padding: px-4 py-3 → px-5 py-4
- ✅ Padding corrigido: px-3 py-3.5 → px-5 py-4
- ✅ Padding modal: p-2 → px-5 py-4
- ✅ Labels: text-sm → text-base, font-medium → font-semibold (237 labels)
- ✅ Espaçamento label-input: mb-1.5 → mb-2.5
- ✅ Espaçamento entre campos: space-y-4 → space-y-6

**3. Botões:**
- ✅ Navegação: py-2.5 px-5 → py-3.5 px-6
- ✅ Menu admin: px-4 py-3 → px-5 py-4, text-sm → text-base
- ✅ Ações: gap-3 text-sm → gap-4 text-base
- ✅ AdminLogin: text-sm → text-base, min-h-[56px]

**4. Grids e Layouts:**
- ✅ 4 colunas → 2 colunas mobile
- ✅ Time picker grid corrigido
- ✅ Modais: max-w-sm/md → max-w-full sm:max-w-sm/md

**5. Espaçamentos:**
- ✅ Cards: p-5 → p-6 sm:p-5
- ✅ Border radius: rounded-xl → rounded-2xl (42 elementos)
- ✅ Padding vertical: py-8 → py-6 sm:py-8

**6. Tipografia:**
- ✅ Títulos: text-2xl → text-3xl (34 ocorrências)
- ✅ Subtítulos: text-xl → text-2xl (11 ocorrências)
- ✅ Header: h-16 → h-18

#### Validações Técnicas:
- ✅ Zero erros LSP
- ✅ HMR funcionando perfeitamente
- ✅ Servidor estável
- ✅ Sem regressões funcionais
- ✅ Lógica de preços e Supabase intactos

### 20 de outubro de 2025 - Importação Inicial
- ✅ Instalação de dependências Node.js
- ✅ Correção do vite.config.ts para ESM (adicionado fileURLToPath para __dirname)
- ✅ Criação do .gitignore com padrões Node.js
- ✅ Configuração do workflow para executar servidor de desenvolvimento
- ✅ Configuração de deployment (autoscale com build e preview)
- ✅ Verificação de build de produção (funcionando)
- ✅ Teste da aplicação (interface carregando corretamente)
