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

### 20 de outubro de 2025 - Redesign Moderno da Interface
**Status: ✅ Concluído e Aprovado pelo Architect**

#### Mudanças Implementadas:

**1. Interface Pública de Agendamento:**
- ✅ Fundo com gradiente moderno (`bg-gradient-to-br from-pink-50 via-white to-rose-50`)
- ✅ Header redesenhado com logo maior (h-24 w-24) e drop-shadow
- ✅ Título aumentado para text-6xl para maior impacto visual
- ✅ Progress stepper modernizado:
  - Linha conectora animada entre os passos
  - Badges com gradiente (`from-pink-500 to-pink-700`)
  - Animações suaves de escala e cor
  - Labels em negrito com cores dinâmicas
- ✅ Card principal atualizado (`rounded-3xl`, `shadow-2xl`, `border-pink-100/40`)
- ✅ Botões de navegação com gradientes e sombras:
  - Botão "Voltar": borda cinza com hover effect
  - Botão "Próximo": gradiente pink com sombra
  - Botão "Confirmar": gradiente verde com ícone
- ✅ Modal de sucesso completamente redesenhado:
  - Backdrop blur (`bg-black/50 backdrop-blur-sm`)
  - Border rosa (`border-4 border-pink-200`)
  - Título com gradiente de texto
  - Mensagem adicional sobre confirmação via WhatsApp

**2. Área Administrativa:**
- ✅ Background com gradiente sutil (`from-gray-50 via-pink-50/20 to-gray-100`)
- ✅ Header modernizado:
  - Border colorido (`border-b-2 border-pink-100`)
  - Backdrop blur para efeito glassmorphism
  - Logo maior (h-12 w-12) com drop-shadow
  - Título em duas linhas com subtítulo "Painel Administrativo"
  - Altura aumentada (h-20)
- ✅ Menu lateral redesenhado:
  - Botões com gradiente quando ativos
  - Efeito de escala (`scale-105`) no item selecionado
  - Shadow melhorada
  - Espaçamento entre itens aumentado (gap-3)
- ✅ Botão de logout com background e hover effect

**3. Componentes Reutilizáveis:**
- ✅ **AlertModal**: 
  - Backdrop blur escuro
  - Bordas coloridas conforme variante (verde/vermelho)
  - Ícone maior (h-16 w-16)
  - Tipografia aumentada (text-4xl para título)
  - Botão "Entendi" com gradiente
  - Fundo com gradiente no rodapé
- ✅ **ConfirmationModal**:
  - Layout similar ao AlertModal
  - Botões com gradientes (pink para primary, vermelho para danger)
  - Bordas arredondadas (rounded-3xl)
  - Melhor espaçamento e tipografia
- ✅ **Botões gerais**:
  - Todos atualizados com `rounded-xl`
  - Gradientes aplicados consistentemente
  - Sombras melhoradas (`shadow-lg hover:shadow-xl`)
  - Estados disabled com gradiente cinza

**4. Melhorias de Hierarquia Visual:**
- ✅ Tipografia mais impactante
- ✅ Uso consistente de gradientes para elementos principais
- ✅ Sombras em camadas para profundidade
- ✅ Espaçamento aumentado entre seções
- ✅ Cores mais vibrantes em elementos interativos
- ✅ Transições suaves em todas as interações

#### Validações Técnicas:
- ✅ Todas as funcionalidades permanecem intactas
- ✅ Lógica de agendamento não afetada
- ✅ Sistema de preços funcionando corretamente
- ✅ Validações de formulário preservadas
- ✅ Integração com Supabase estável
- ✅ Sem erros no console
- ✅ Sem regressões funcionais
- ✅ Identidade visual (cores, logo, fontes) preservada

#### Resultado:
Interface completamente modernizada mantendo 100% da funcionalidade. O design agora apresenta um visual mais profissional, intuitivo e atraente, com melhor hierarquia visual e navegação mais clara.

### 20 de outubro de 2025 - Importação para Replit
**Status: ✅ Concluído**

#### Mudanças Implementadas:
1. **Dependências**: Instalação completa via `npm install`
2. **Segurança**: Movido credenciais Supabase para `.env.local` (não commitado)
   - Removido hardcoded secrets do `supabaseClient.ts`
   - Adicionado validação de variáveis de ambiente
3. **Gitignore**: Criado `.gitignore` com padrões Node.js e Replit
4. **HMR**: Configurado Hot Module Replacement para funcionar com proxy Replit
   - Protocol: wss
   - Host: dinâmico baseado em `REPL_SLUG` e `REPL_OWNER`
5. **Workflow**: Configurado `npm run dev` em porta 5000
6. **Deployment**: Configurado autoscale deployment
   - Build: `npm run build`
   - Run: `npm run preview`
7. **Build**: Testado e verificado funcionando (371KB bundle)

#### Testes Realizados:
- ✅ Servidor rodando em porta 5000
- ✅ Interface carregando corretamente
- ✅ Build de produção funcionando
- ✅ Supabase conectado via variáveis de ambiente

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
