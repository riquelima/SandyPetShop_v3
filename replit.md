# Sandy's Pet Shop - Sistema de Agendamento

## Visão Geral
Aplicação web para agendamento de serviços de pet shop desenvolvida com React, TypeScript e Vite. O sistema permite que clientes agendem banho, tosa, creche pet, hotel pet e serviços de pet móvel. Inclui área administrativa para gerenciar agendamentos, clientes mensalistas e cadastros de creche.

## Tecnologias
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (autenticação e banco de dados PostgreSQL)
- **Estilização**: Tailwind CSS (via CDN)
- **PWA**: Service Worker para funcionalidades offline
- **IA**: Google Gemini API (para recursos avançados)

## Estrutura do Projeto
- `App.tsx` - Componente principal com toda a lógica da aplicação
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

## Variáveis de Ambiente
O projeto usa as seguintes variáveis de ambiente (arquivo `.env.local`):
- `GEMINI_API_KEY` - Chave API do Google Gemini (solicitada ao usuário)
- `VITE_SUPABASE_URL` - URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase

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

## Como Executar
1. As dependências são instaladas automaticamente
2. Configure a variável `GEMINI_API_KEY` quando solicitado
3. O servidor inicia automaticamente em `npm run dev` na porta 5000
4. Acesse via preview do Replit

## Banco de Dados Supabase
O projeto usa um banco de dados Supabase existente com as seguintes tabelas:
- `appointments` - Agendamentos
- `clients` - Clientes
- `monthly_clients` - Clientes mensalistas
- `daycare_registrations` - Cadastros de creche
- `hotel_registrations` - Cadastros de hotel

## Última Atualização
Data: 20 de outubro de 2025
Ação: Importação e configuração inicial do projeto para Replit
