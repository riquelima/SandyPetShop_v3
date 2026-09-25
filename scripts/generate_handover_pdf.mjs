import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Dossiê Técnico de Handover - Sandy's Pet Shop</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.5;
      font-size: 9.8pt;
      margin: 0;
      padding: 0;
    }

    /* CAPA */
    .cover-container {
      min-height: 860px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      padding: 30px 10px 10px 10px;
    }

    .cover-top {
      border-left: 6px solid #2563eb;
      padding-left: 24px;
    }

    .badge-top {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 20px;
      border: 1px solid #bfdbfe;
    }

    .cover-title {
      font-size: 27pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      margin: 0 0 10px 0;
    }

    .cover-subtitle {
      font-size: 13.5pt;
      color: #475569;
      font-weight: 400;
      margin: 0 0 20px 0;
    }

    .cover-desc {
      font-size: 10.5pt;
      color: #64748b;
      max-width: 620px;
      line-height: 1.6;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-top: 36px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      margin-bottom: 3px;
    }

    .meta-val {
      font-size: 10.5pt;
      color: #0f172a;
      font-weight: 600;
    }

    .cover-footer-note {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #94a3b8;
    }

    /* ELEMENTOS DE ESTRUTURA */
    .page-break {
      page-break-before: always;
    }

    .no-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 24px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h1::before {
      content: "";
      display: inline-block;
      width: 5px;
      height: 18px;
      background: #2563eb;
      border-radius: 3px;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    p {
      margin: 0 0 10px 0;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 20px;
      color: #334155;
    }

    li {
      margin-bottom: 4px;
    }

    /* ALERTAS */
    .alert-box {
      border-radius: 8px;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 9pt;
      line-height: 1.45;
      break-inside: avoid;
    }

    .alert-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    .alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #22c55e;
      color: #166534;
    }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 8.8pt;
      background: #ffffff;
      break-inside: avoid;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 7px 9px;
      border: 1px solid #cbd5e1;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 6px 9px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    /* CÓDIGO E TERMINAL */
    .code-block {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 6px;
      padding: 10px 14px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 8.2pt;
      line-height: 1.4;
      margin: 8px 0 12px 0;
      word-break: break-all;
      white-space: pre-wrap;
      border: 1px solid #1e293b;
      break-inside: avoid;
    }

    .inline-code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 5px;
      border-radius: 4px;
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 8.2pt;
      border: 1px solid #e2e8f0;
    }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 7.2pt;
      font-weight: 700;
    }

    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }
    .badge-amber { background: #fef3c7; color: #b45309; }

    /* CARDS */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 10px 0 14px 0;
      break-inside: avoid;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #ffffff;
    }

    .card-title {
      font-weight: 700;
      font-size: 9.5pt;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-desc {
      font-size: 8.2pt;
      color: #64748b;
      margin: 0;
      line-height: 1.45;
    }
  </style>
</head>
<body>

  <!-- ================= CAPA ================= -->
  <div class="cover-container">
    <div class="cover-top">
      <div class="badge-top">Confidencial • Transição de Engenharia</div>
      <div class="cover-title">Dossiê Técnico de Handover</div>
      <div class="cover-subtitle">Sistema Completo de Gestão e Agendamento — Sandy's Pet Shop v3</div>
      <div class="cover-desc">
        Manual consolidado de transição técnica com a documentação da arquitetura, credenciais de banco de dados, chaves de API, credenciais do Supabase, estrutura de tabelas, integrações fiscais (Focus NFe) e guia de execução para novos desenvolvedores.
      </div>
    </div>

    <div class="cover-meta-grid">
      <div class="meta-item">
        <span class="meta-label">Sistema / Empresa</span>
        <span class="meta-val">Sandy's Pet Shop & Pet Móvel</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Versão do Projeto</span>
        <span class="meta-val">v3.0 (React 19 + TypeScript + Supabase)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Data de Emissão</span>
        <span class="meta-val">18 de Setembro de 2026</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Plataforma Cloud</span>
        <span class="meta-val">Supabase PostgreSQL 15 (AWS sa-east-1)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Tabelas Ativas</span>
        <span class="meta-val">19 Tabelas no Schema Public</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Volume de Registros</span>
        <span class="meta-val" style="color:#16a34a;">2.911 Registros Exportados</span>
      </div>
    </div>

    <div class="cover-footer-note">
      <span>Sandy's Pet Shop • Engenharia de Software</span>
      <span>Documento estritamente confidencial para transferência de custódia técnica</span>
    </div>
  </div>

  <!-- ================= SEÇÃO 1: CREDENCIAIS E CHAVES ================= -->
  <div class="page-break">
    <h1>1. Credenciais, Chaves e Acessos Administrativos</h1>

    <div class="alert-box alert-danger">
      <strong>⚠️ ATENÇÃO MÁXIMA DE SEGURANÇA:</strong><br>
      As chaves abaixo contêm a <strong>SERVICE_ROLE_KEY</strong> do Supabase, que ignora todas as políticas de Row Level Security (RLS) e concede acesso total irrestrito de leitura e escrita ao banco de dados. Nunca exponha ou suba essas chaves para repositórios públicos.
    </div>

    <h2>1.1. Credenciais do Banco de Dados Supabase</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Parâmetro</th>
          <th>Valor / Configuração</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Supabase Project URL</strong></td>
          <td><span class="inline-code">https://xilavhopbmjhsovvybza.supabase.co</span></td>
        </tr>
        <tr>
          <td><strong>Project Reference ID</strong></td>
          <td><span class="inline-code">xilavhopbmjhsovvybza</span></td>
        </tr>
        <tr>
          <td><strong>Anon Public Key</strong><br><small style="color:#64748b;">(Configurada no Frontend / VITE_SUPABASE_ANON_KEY)</small></td>
          <td>
            <div class="code-block">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI</div>
          </td>
        </tr>
        <tr>
          <td><strong>Service Role Key</strong><br><small style="color:#64748b;">(Acesso Administrador Total / Bypasses RLS / Backend / Edge Functions)</small></td>
          <td>
            <div class="code-block">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDYxOCwiZXhwIjoyMDg5NzE2NjE4fQ.bWbPrMN8FNAHUNV5WKApBa-B5_x1FOJzUy1hOWINU74</div>
          </td>
        </tr>
      </tbody>
    </table>

    <h2>1.2. Contas de Operadores no Supabase Auth</h2>
    <p>O sistema possui 3 usuários cadastrados na autenticação do Supabase (<span class="inline-code">auth.users</span>):</p>
    <table>
      <thead>
        <tr>
          <th>E-mail do Operador</th>
          <th>Função (Role)</th>
          <th>UUID no Supabase</th>
          <th>Credenciais / Observações</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>login@sandypetshop.com</strong></td>
          <td><span class="badge badge-green">authenticated</span></td>
          <td><small>33b9b449-5e01-4b59-b96f-f19d6bccbe73</small></td>
          <td><strong>Usuário Master Principal</strong><br>Senha inicial padrão: <span class="inline-code">1234</span></td>
        </tr>
        <tr>
          <td><strong>sandy.petmovel@gmail.com</strong></td>
          <td><span class="badge badge-blue">authenticated</span></td>
          <td><small>4fbc8cad-8497-48c8-9dcd-0f76bc994949</small></td>
          <td>Conta de Acesso Operacional Pet Móvel</td>
        </tr>
        <tr>
          <td><strong>roberta_mnovais@hotmail.com</strong></td>
          <td><span class="badge badge-blue">authenticated</span></td>
          <td><small>57740429-fbb7-4df0-9d2d-5c3fea12ae25</small></td>
          <td>Conta de Gestão e Atendimento</td>
        </tr>
      </tbody>
    </table>

    <h2>1.3. Integração Fiscal Focus NFe (Emissão de NFS-e Municipal)</h2>
    <p>
      O sistema conta com emissão de Nota Fiscal de Serviço (NFS-e padrão nacional/Diadema) implementada em uma Edge Function (<span class="inline-code">supabase/functions/focus-nfe</span>):
    </p>
    <table>
      <thead>
        <tr>
          <th style="width: 32%;">Parâmetro da Empresa</th>
          <th>Configuração Utilizada</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>CNPJ Prestador</strong></td>
          <td><span class="inline-code">27.859.716/0001-03</span></td>
        </tr>
        <tr>
          <td><strong>Regime Tributário</strong></td>
          <td>Simples Nacional / MEI (Código <span class="inline-code">2</span>)</td>
        </tr>
        <tr>
          <td><strong>Município Emissor e Prestação</strong></td>
          <td>Código IBGE <span class="inline-code">3513801</span> (Diadema - SP)</td>
        </tr>
        <tr>
          <td><strong>Código Tributação Nacional ISS</strong></td>
          <td><span class="inline-code">050801</span> (Guarda, embelezamento e cuidados com animais)</td>
        </tr>
        <tr>
          <td><strong>Item Lista Serviço LC 116</strong></td>
          <td><span class="inline-code">05.08</span></td>
        </tr>
        <tr>
          <td><strong>URLs da API FocusNFe</strong></td>
          <td>
            • Produção: <span class="inline-code">https://api.focusnfe.com.br/v2/nfsen</span><br>
            • Homologação: <span class="inline-code">https://homologacao.focusnfe.com.br/v2/nfsen</span>
          </td>
        </tr>
        <tr>
          <td><strong>Secrets Configurados no Supabase</strong></td>
          <td>
            <span class="inline-code">FOCUS_NFE_API_KEY</span> (Token de autorização da Focus NFe)<br>
            <span class="inline-code">FOCUS_NFE_ENVIRONMENT</span> (<span class="inline-code">producao</span> ou <span class="inline-code">homologacao</span>)
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ================= SEÇÃO 2: BANCO DE DADOS ================= -->
  <div class="page-break">
    <h1>2. Mapeamento Completo do Banco de Dados</h1>
    <p>
      O banco de dados roda em PostgreSQL 15 com <strong>19 tabelas ativas</strong>. Todas as tabelas foram auditadas com contagem exata de registros:
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Nome da Tabela</th>
          <th style="width: 10%;">Registros</th>
          <th style="width: 25%;">Chaves / Relacionamentos</th>
          <th>Propósito e Papel no Negócio</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>pet_movel_appointments</strong></td>
          <td><span class="badge badge-blue">912</span></td>
          <td><small>PK: id (uuid)<br>FK: monthly_client_id</small></td>
          <td>Atendimentos móveis a domicílio em condomínios fechados cadastrados.</td>
        </tr>
        <tr>
          <td><strong>appointments</strong></td>
          <td><span class="badge badge-blue">539</span></td>
          <td><small>PK: id (uuid)<br>FK: monthly_client_id</small></td>
          <td>Agendamentos de banho e tosa executados na loja física principal.</td>
        </tr>
        <tr>
          <td><strong>agendamento_banhotosa</strong></td>
          <td><span class="badge badge-blue">492</span></td>
          <td><small>PK: id (uuid)<br>FK: monthly_client_id</small></td>
          <td>Fila operacional detalhada dos tosadores com dados do profissional e observações.</td>
        </tr>
        <tr>
          <td><strong>clients</strong></td>
          <td><span class="badge badge-green">225</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Cadastro geral de tutores, telefones de WhatsApp e dados de contato.</td>
        </tr>
        <tr>
          <td><strong>daycare_diary_entries</strong></td>
          <td><span class="badge badge-purple">184</span></td>
          <td><small>PK: id (uuid)<br>FK: enrollment_id</small></td>
          <td>Diário do Pet da Creche (humor, comportamento, alimentação, fezes/urina, fotos).</td>
        </tr>
        <tr>
          <td><strong>pet_album_photos</strong></td>
          <td><span class="badge badge-purple">139</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Galeria pública do portfólio "antes e depois" dos pets atendidos.</td>
        </tr>
        <tr>
          <td><strong>disabled_dates</strong></td>
          <td><span class="badge badge-amber">64</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Datas e períodos bloqueados no calendário para impedir agendamentos.</td>
        </tr>
        <tr>
          <td><strong>hotel_registrations</strong></td>
          <td><span class="badge badge-green">61</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Ficha completa de hospedagem/hotelzinho (check-in, check-out, termos assinados).</td>
        </tr>
        <tr>
          <td><strong>controle_bloqueio_chat</strong></td>
          <td><span class="badge badge-amber">57</span></td>
          <td><small>PK: id (int)</small></td>
          <td>Controle de rate-limit e anti-spam de telefones no atendimento/bot.</td>
        </tr>
        <tr>
          <td><strong>financeiro_gastos</strong></td>
          <td><span class="badge badge-blue">55</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Controle financeiro de contas a pagar, despesas fixas e variáveis da empresa.</td>
        </tr>
        <tr>
          <td><strong>feedbacks</strong></td>
          <td><span class="badge badge-green">38</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Avaliações de satisfação dos clientes (estrelas de 1 a 5, elogios e fotos).</td>
        </tr>
        <tr>
          <td><strong>monthly_clients</strong></td>
          <td><span class="badge badge-blue">31</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Contratos de mensalistas (recorrência semanal/quinzenal, horários e valores).</td>
        </tr>
        <tr>
          <td><strong>feriados</strong></td>
          <td><span class="badge badge-amber">30</span></td>
          <td><small>PK: id (int)</small></td>
          <td>Calendário de feriados nacionais e locais para validação da agenda.</td>
        </tr>
        <tr>
          <td><strong>fiscal_notes</strong></td>
          <td><span class="badge badge-green">27</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Histórico de notas fiscais emitidas (referências Focus NFe e links DANFSe).</td>
        </tr>
        <tr>
          <td><strong>adoption_pets</strong></td>
          <td><span class="badge badge-purple">21</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Vitrine de animais para adoção responsável (porte, temperamento e fotos).</td>
        </tr>
        <tr>
          <td><strong>notifications</strong></td>
          <td><span class="badge badge-blue">15</span></td>
          <td><small>PK: id (int)</small></td>
          <td>Notificações internas do sistema exibidas no sininho de alertas.</td>
        </tr>
        <tr>
          <td><strong>daycare_enrollments</strong></td>
          <td><span class="badge badge-green">14</span></td>
          <td><small>PK: id (uuid)</small></td>
          <td>Matrículas ativas na creche pet (daycare) com fichas de saúde e contratos.</td>
        </tr>
        <tr>
          <td><strong>service_prices</strong></td>
          <td><span class="badge badge-blue">7</span></td>
          <td><small>PK: weight_category</small></td>
          <td>Tabela dinâmica de preços cadastrados por faixa de peso do animal.</td>
        </tr>
        <tr>
          <td><strong>pets</strong></td>
          <td>0</td>
          <td><small>PK: id (bigint)</small></td>
          <td>Tabela legada do protótipo inicial (substituída pelas tabelas especializadas).</td>
        </tr>
      </tbody>
    </table>

    <div class="alert-box alert-success no-break">
      <strong>📦 DUMP COMPLETO DISPONÍVEL NO PROJETO:</strong><br>
      Todos os 2.911 registros acima foram exportados com fidelidade integral para o arquivo:<br>
      <span class="inline-code">sandypetshop/database_backup_full.json</span> (~5.1 MB).
    </div>
  </div>

  <!-- ================= SEÇÃO 3: REGRAS DE NEGÓCIO E MÓDULOS ================= -->
  <div class="page-break">
    <h1>3. Arquitetura Funcional e Regras de Negócio</h1>

    <h2>3.1. Módulo de Agendamentos (Loja Física vs. Pet Móvel)</h2>
    <div class="card-grid">
      <div class="card">
        <div class="card-title">
          <span>Loja Física (Banho & Tosa)</span>
          <span class="badge badge-blue">Capacidade: 2 simultâneos</span>
        </div>
        <p class="card-desc">
          • Horário de funcionamento: 09:00 às 17:00 (pausa para almoço das 12:00 às 13:00).<br>
          • Concorrência: Máximo de 2 pets simultâneos por horário.<br>
          • Duração do slot: Banho (1h), Só Tosa (2h), Banho & Tosa (2h).
        </p>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Pet Móvel (Van em Domicílio)</span>
          <span class="badge badge-green">Por Condomínio</span>
        </div>
        <p class="card-desc">
          • Atendimento focado em condomínios parceiros (Paseo, Vitta Parque, Maxhaus, etc.).<br>
          • Requer seleção de Condomínio, Bloco/Torre e Apartamento.<br>
          • Slot com duração adaptada para o deslocamento da van.
        </p>
      </div>
    </div>

    <h2>3.2. Clientes Mensalistas (Gestão de Assinaturas Recorrentes)</h2>
    <ul>
      <li><strong>Frequências de Recorrência:</strong> Suporta planos <em>Semanais</em> (4 atendimentos no mês) e <em>Quinzenais</em> (2 atendimentos no mês).</li>
      <li><strong>Parametrização:</strong> O registro em <span class="inline-code">monthly_clients</span> armazena o dia da semana (<span class="inline-code">recurrence_day</span>: 0=Dom a 6=Sáb) e hora fixa (<span class="inline-code">recurrence_time</span>: ex: 9 para 09:00).</li>
      <li><strong>Geração Automática:</strong> Os agendamentos futuros são gerados e sincronizados na grade com o vínculo <span class="inline-code">monthly_client_id</span>.</li>
      <li><strong>Status Financeiro:</strong> Status de pagamento (<span class="inline-code">Pendente</span>, <span class="inline-code">Pago</span>, <span class="inline-code">Atrasado</span>) com controle de dia de vencimento.</li>
    </ul>

    <h2>3.3. Creche Pet (Daycare) e o "Diário do Pet"</h2>
    <ul>
      <li><strong>Matrícula e Saúde:</strong> Registro de castração, convivência com outros cães, vacinas (V10, Raiva, Gripe), vermífugo, antipulgas e alergias.</li>
      <li><strong>Diário Digital do Pet:</strong> Registro diário preenchido pela equipe e compartilhado com os tutores contendo:
        <ul>
          <li>Humor do dia: <em>Animado, Normal, Sonolento ou Agitado</em>.</li>
          <li>Comportamento geral (nota de 1 a 5 estrelas).</li>
          <li>Alimentação: <em>Comeu tudo, Comeu pouco, Não comeu</em>.</li>
          <li>Registro de necessidades fisiológicas e fotos do dia via Supabase Storage.</li>
        </ul>
      </li>
      <li><strong>Serviços Extras:</strong> Pernoite, dia extra avulso, banho e tosa na saída e adestrador.</li>
    </ul>

    <h2>3.4. Hotelzinho Pet (Hospedagem)</h2>
    <ul>
      <li><strong>Check-in e Check-out:</strong> Registro de datas e horários exatos de entrada e saída.</li>
      <li><strong>Termos e Assinatura:</strong> Coleta e armazenamento de assinatura digital do tutor (<span class="inline-code">tutor_signature</span>).</li>
      <li><strong>Protocolo de Cuidados:</strong> Registro de medicação, porções de ração, pertences entregues e contato veterinário emergencial.</li>
    </ul>

    <h2>3.5. Tabela de Preços e Adicionais</h2>
    <table>
      <thead>
        <tr>
          <th>Faixa de Peso do Animal</th>
          <th>Banho Simples</th>
          <th>Só Tosa</th>
          <th>Banho & Tosa (Soma)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Até 5 kg</td><td>R$ 70,00</td><td>R$ 70,00</td><td>R$ 140,00</td></tr>
        <tr><td>Até 10 kg</td><td>R$ 80,00</td><td>R$ 80,00</td><td>R$ 160,00</td></tr>
        <tr><td>Até 15 kg</td><td>R$ 90,00</td><td>R$ 90,00</td><td>R$ 180,00</td></tr>
        <tr><td>Até 20 kg</td><td>R$ 100,00</td><td>R$ 100,00</td><td>R$ 200,00</td></tr>
        <tr><td>Até 25 kg</td><td>R$ 120,00</td><td>R$ 120,00</td><td>R$ 240,00</td></tr>
        <tr><td>Até 30 kg</td><td>R$ 160,00</td><td>R$ 150,00</td><td>R$ 310,00</td></tr>
        <tr><td>Acima de 30 kg</td><td>R$ 180,00</td><td>R$ 170,00</td><td>R$ 350,00</td></tr>
      </tbody>
    </table>
    <p>
      <strong>Serviços Adicionais:</strong> Tosa na Tesoura (+R$ 160), Aparação Contorno (+R$ 35), Hidratação (+R$ 25), Botinhas (+R$ 25), Desembolo (+R$ 25), Patacure (+R$ 15 a R$ 20), Tintura (+R$ 15), Corte de Unha avulso (+R$ 10), Tosa Higiênica (Inclusa).
    </p>
  </div>

  <!-- ================= SEÇÃO 4: SUPABASE STORAGE E EDGE FUNCTIONS ================= -->
  <div class="page-break">
    <h1>4. Supabase Storage e Edge Functions</h1>

    <h2>4.1. Buckets de Armazenamento de Arquivos</h2>
    <table>
      <thead>
        <tr>
          <th>Nome do Bucket</th>
          <th>Finalidade do Conteúdo</th>
          <th>Permissão de Acesso</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>pet_photos</strong></td>
          <td>Fotos de perfil dos animais cadastrados nos agendamentos.</td>
          <td>Leitura Pública / Upload Autenticado</td>
        </tr>
        <tr>
          <td><strong>pet_album</strong></td>
          <td>Fotos em alta resolução do álbum de transformações e adoção.</td>
          <td>Leitura Pública / Upload Autenticado</td>
        </tr>
        <tr>
          <td><strong>daycare_pet_photos</strong></td>
          <td>Fotos e registros enviados no Diário do Pet da creche.</td>
          <td>Leitura Pública por Link Direto</td>
        </tr>
        <tr>
          <td><strong>monthly_pet_photos</strong></td>
          <td>Fotos de identificação dos cães mensalistas recorrentes.</td>
          <td>Leitura Pública / Upload Autenticado</td>
        </tr>
        <tr>
          <td><strong>hotel_checklists</strong></td>
          <td>Documentos e carteirinhas de vacinação dos hóspedes do hotel.</td>
          <td>Restrito / Acesso Administrativo</td>
        </tr>
        <tr>
          <td><strong>daycare_checklists</strong></td>
          <td>Termos de responsabilidade e checklists assinados da creche.</td>
          <td>Restrito / Acesso Administrativo</td>
        </tr>
      </tbody>
    </table>

    <h2>4.2. Edge Function Focus NFe (supabase/functions/focus-nfe/index.ts)</h2>
    <p>
      Função em runtime Deno responsável pela emissão de notas fiscais de serviços (NFS-e) para a Prefeitura de Diadema:
    </p>
    <ul>
      <li><strong>Consulta de Notas:</strong> Endpoint <span class="inline-code">action: 'consult'</span> busca o status atualizado da NFS-e na prefeitura e recupera o link oficial do PDF DANFSe.</li>
      <li><strong>Emissão Automática:</strong> Conecta nas tabelas de serviço pelo ID da referência, extrai os dados do tomador e do serviço, valida o CPF e dispara a requisição no padrão flat da NFS-e Nacional.</li>
      <li><strong>Compensação Horária:</strong> Ajusta automaticamente a hora da requisição para o fuso de Brasília (-03:00) com tolerância de segurança de 1 hora para evitar erros de data futura.</li>
    </ul>

    <div class="no-break">
      <h3>Exemplo de Chamada da Edge Function no Frontend:</h3>
      <div class="code-block">const { data, error } = await supabase.functions.invoke('focus-nfe', {
  body: {
    reference_id: appointment.id,
    reference_type: 'appointment',
    pet_name: appointment.pet_name,
    tutor_name: appointment.owner_name
  }
});

if (data?.success) {
  console.log('Nota autorizada com sucesso! DANFSe:', data.pdf_url);
}</div>
    </div>
  </div>

  <!-- ================= SEÇÃO 5: GUIA DO DESENVOLVEDOR ================= -->
  <div class="page-break">
    <h1>5. Guia Prático de Inicialização para o Novo Desenvolvedor</h1>

    <h2>5.1. Pré-requisitos</h2>
    <ul>
      <li><strong>Node.js:</strong> Versão 18 ou superior (Recomendado Node 20+ LTS; testado em Node v26).</li>
      <li><strong>NPM:</strong> Gerenciador de pacotes nativo do Node.</li>
      <li><strong>Git:</strong> Para controle e sincronização de versão.</li>
    </ul>

    <h2>5.2. Passo a Passo para Subir o Ambiente Local</h2>

    <div class="no-break">
      <h3>Passo 1: Acessar a Pasta do Projeto</h3>
      <div class="code-block">cd "sandypetshop"</div>
    </div>

    <div class="no-break">
      <h3>Passo 2: Configurar o Arquivo .env</h3>
      <p>Certifique-se de que o arquivo <span class="inline-code">.env</span> contenha as variáveis do Supabase:</p>
      <div class="code-block">VITE_SUPABASE_URL=https://xilavhopbmjhsovvybza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI</div>
    </div>

    <div class="no-break">
      <h3>Passo 3: Instalar as Dependências</h3>
      <div class="code-block">npm install</div>
    </div>

    <div class="no-break">
      <h3>Passo 4: Iniciar o Servidor Vite</h3>
      <div class="code-block">npm run dev</div>
      <p>O sistema subirá por padrão no endereço: <span class="inline-code">http://localhost:5173</span></p>
    </div>

    <div class="no-break">
      <h3>Passo 5: Compilar para Produção</h3>
      <div class="code-block">npm run build</div>
      <p>Gera o bundle otimizado dentro do diretório <span class="inline-code">dist/</span>.</p>
    </div>

    <h2>5.3. Scripts Utilitários Disponíveis</h2>
    <table>
      <thead>
        <tr>
          <th>Script</th>
          <th>Comando</th>
          <th>Finalidade</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="inline-code">scripts/export_database.mjs</span></td>
          <td><span class="inline-code">node scripts/export_database.mjs</span></td>
          <td>Gera novo dump JSON completo com todas as 19 tabelas e dados.</td>
        </tr>
        <tr>
          <td><span class="inline-code">scripts/generate_handover_pdf.mjs</span></td>
          <td><span class="inline-code">node scripts/generate_handover_pdf.mjs</span></td>
          <td>Recompila este PDF de handover com informações atualizadas.</td>
        </tr>
        <tr>
          <td><span class="inline-code">create_admin.js</span></td>
          <td><span class="inline-code">node create_admin.js</span></td>
          <td>Cria ou reseta a conta de usuário administrador no Supabase Auth.</td>
        </tr>
        <tr>
          <td><span class="inline-code">create_buckets.js</span></td>
          <td><span class="inline-code">node create_buckets.js</span></td>
          <td>Verifica e inicializa os 6 buckets necessários no Supabase Storage.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ================= SEÇÃO 6: MAPA DO CÓDIGO E RECOMENDAÇÕES ================= -->
  <div class="page-break">
    <h1>6. Mapa do Código e Recomendações de Engenharia</h1>

    <h2>6.1. Componentes e Estrutura Principal</h2>
    <ul>
      <li><span class="inline-code">App.tsx</span>: Núcleo do frontend com o roteamento interno por abas (Agenda Loja, Pet Móvel, Mensalistas, Creche Pet, Hotel, Financeiro, Fiscal, Avaliações, Adoção).</li>
      <li><span class="inline-code">supabaseClient.ts</span>: Inicialização unificada do cliente Supabase utilizada pelos componentes.</li>
      <li><span class="inline-code">constants.ts</span> & <span class="inline-code">types.ts</span>: Interfaces TypeScript das entidades de negócio, tabela de preços e pesos.</li>
      <li><span class="inline-code">src/components/MonthlyClientCard.tsx</span>: Card de controle dos mensalistas recorrentes e sincronização na grade.</li>
      <li><span class="inline-code">src/components/FinancialDashboardView.tsx</span>: Painel analítico de faturamento, custos e lucratividade.</li>
      <li><span class="inline-code">src/components/FiscalNotesView.tsx</span>: Módulo de acompanhamento e emissão de notas fiscais via Focus NFe.</li>
      <li><span class="inline-code">PriceTableModal.tsx</span>: Modal administrativo para alteração e sincronização dos preços vigentes.</li>
    </ul>

    <h2>6.2. Recomendações para a Nova Equipe de Desenvolvimento</h2>
    <div class="alert-box alert-warning">
      <strong>1. Modularização do <span class="inline-code">App.tsx</span>:</strong><br>
      O arquivo <span class="inline-code">App.tsx</span> acumula múltiplos contextos e estados. Recomenda-se migrar para o <em>React Router</em> com rotas independentes e extrair a lógica de dados para custom hooks dedicados (<span class="inline-code">useAppointments</span>, <span class="inline-code">useDaycare</span>, etc.).
    </div>

    <div class="alert-box alert-info">
      <strong>2. Reforço de Políticas de RLS (Row Level Security):</strong><br>
      Recomenda-se revisar as políticas de segurança de banco no Supabase para garantir que ações sensíveis de escrita em tabelas financeiras (<span class="inline-code">financeiro_gastos</span> e <span class="inline-code">fiscal_notes</span>) exijam token autenticado do usuário operador.
    </div>

    <div class="alert-box alert-success">
      <strong>3. Rotina Automática de Backups:</strong><br>
      Utilize o script <span class="inline-code">scripts/export_database.mjs</span> em uma pipeline ou cron semanal para salvaguarda periódica e versionada da base de dados.
    </div>

    <div style="margin-top: 35px; padding: 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;" class="no-break">
      <h3 style="margin-top: 0; color: #0f172a;">🎉 Projeto Pronto para Transição</h3>
      <p style="margin-bottom: 0; color: #64748b; font-size: 8.5pt;">
        Este dossiê encerra todas as informações necessárias para a transição completa do sistema Sandy's Pet Shop.
      </p>
    </div>
  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log('Iniciando renderização do PDF com Google Chrome...');
  const htmlPath = path.resolve(__dirname, 'temp_handover.html');
  const pdfPath = path.resolve(__dirname, '../DOCUMENTACAO_SISTEMA_HANDOVER.pdf');

  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; padding: 0 16mm; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;"><span>Sandy\'s Pet Shop — Dossiê Técnico de Handover</span><span>Confidencial</span></div>',
    footerTemplate: '<div style="font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; padding: 0 16mm; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;"><span>Sistema de Gestão & Agendamento Integrado v3</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '16mm',
      right: '16mm'
    }
  });

  await browser.close();

  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  const stats = fs.statSync(pdfPath);
  console.log(`PDF gerado com sucesso em: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

generatePDF().catch(err => {
  console.error('Erro ao gerar PDF:', err);
  process.exit(1);
});
