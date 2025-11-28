## Escopo
- Capturar screenshots de absolutamente todas as telas públicas e administrativas.
- Usar o servidor local em `http://localhost:5000/`.
- Autenticar na área admin com `login@sandypetshop.com` / `1234` apenas para automação.
- Salvar PNGs em `testsprite_output/screenshots/` com nomes padronizados.

## Cobertura de Telas
### Público (Agendador)
- Home do Agendador: `scheduler_home.png`
- Agendar Visita — Seletor de serviço: `visita_selector.png`
- Agendar Visita — Formulário Creche Pet: `visita_form_creche.png`
- Agendar Visita — Formulário Hotel Pet: `visita_form_hotel.png`

### Admin — Principais Views
- Login Admin: `admin_login.png`
- Dashboard — Banho & Tosa — Visão Diária: `admin_banho_diario.png`
- Dashboard — Banho & Tosa — Ver Todos: `admin_banho_todos.png`
- Pet Móvel — Lista: `pet_movel_list.png`
- Pet Móvel — Calendário: `pet_movel_calendar.png`
- Creche: `creche.png`
- Hotel Pet: `hotel.png`
- Clientes: `clientes.png`
- Mensalistas: `mensalistas.png`
- Adicionar Mensalista: `add_mensalista.png`

### Admin — Modais/Componentes
- Card de Agendamento (detalhe visível): `appointment_card.png`
- Modal de Serviços Extras: `extras_modal.png`
- Notificações (Sino): `notifications.png`
- Editar Agendamento (modal): `edit_appointment.png`
- Adicionar Agendamento (modal): `add_appointment.png`
- Detalhe de Agendamento no Calendário: `calendar_appointment_detail.png`
- Estatísticas Mensalistas: `stats_mensalistas.png`
- Estatísticas Creche: `stats_creche.png`
- Estatísticas Hotel Pet: `stats_hotel.png`
- Detalhes de Registro do Hotel Pet: `hotel_view_registration.png`

## Fluxo e Navegação Automatizada
1. Garantir servidor ativo em `http://localhost:5000/`.
2. Público: acessar home, iniciar fluxo “Agendar Visita”, abrir seletor e formularios (Creche/Hotel), capturar.
3. Admin:
   - Abrir Login; autenticar com `login@sandypetshop.com` / `1234`.
   - Navegar por menu principal para cada view; alternar “Ver Todos”/“Ver Calendário” quando aplicável.
   - Abrir modais: serviços extras, editar/adicionar agendamento, detalhe no calendário.
   - Abrir componentes de estatísticas (Mensalistas/Creche/Hotel) e capturar.
4. Sempre aguardar estado de rede ociosa e visibilidade do heading antes de salvar.

## Automação (TestSprite MCP)
- Ler `testsprite_tests/screenshots.md` como fonte de nomes e ordem.
- Definir viewport 1440x900.
- Usar seletores baseados em texto para botões/links (ex.: "Admin", "Agendar Visita", "Ver Todos").
- Salvar arquivos PNG em `testsprite_output/screenshots/` seguindo os nomes padronizados.

## Saída e Entrega
- Pasta: `testsprite_output/screenshots/`.
- Opcional: gerar `testsprite_output/index.md` listando todas as imagens com links relativos.
- Validar que cada arquivo foi gerado e é visualmente completo (sem spinners/erro).

## Riscos e Mitigações
- Erros de rede/CDN: se houver falha de carregamento de assets, forçar re-tentativa após load ou seguir sem fontes externas.
- Modais dependem de dados: garantir que há agendamentos para exibição; se não, criar um agendamento temporário apenas para captura (não persistente).

## Confirmação
- Ao aprovar, executo a automação, gero todas as screenshots e entrego a pasta pronta para upload do documento MD. Deseja que eu avance agora? 