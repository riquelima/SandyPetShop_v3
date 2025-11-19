## Problemas Atuais
- Erro de referência: chamadas a `setDirectLaunch(...)` ainda presentes em handlers de clique; isso quebra os botões da Home.
- A tela pública mistura o wizard interno ("Escolha os Serviços") com a Home de boas-vindas, gerando confusão.
- Fluxo de "Visita" não possui uma etapa intermediária para escolher entre Creche ou Hotel.

## Mapeamento de Tabelas do Supabase (campos-chave)
- **appointments**: `appointment_time`, `pet_name`, `owner_name`, `whatsapp`, `service`, `weight`, `price`, `status`, `pet_breed`, `owner_address`, `condominium`, `monthly_client_id?`, `extra_services?`.
- **pet_movel_appointments**: `appointment_time`, `pet_name`, `owner_name`, `whatsapp`, `service`, `weight`, `price?`, `status`, `pet_breed?`, `owner_address`, `condominium`, `monthly_client_id?`, `extra_services?`.
- **daycare_enrollments**: dados completos de matrícula da creche (pet/tutor, contatos, itens entregues, plano, extras, `payment_date`, `status`).
- **hotel_registrations**: dados completos de matrícula do hotel (pet/tutor, check-in/out, serviços extras, autorizações, `status`, `check_in_status`).

## Nova Home e Rotas
- **Home (view: `scheduler`)**: manter título e boas‑vindas, com 5 botões:
  - Banho & Tosa → abre wizard específico (serviceStepView: `bath_groom`).
  - Pet Móvel → abre passo de condomínio e depois serviço (serviceStepView: `pet_movel_condo` → `pet_movel`).
  - Creche Pet → abre `view: 'daycareRegistration'` (formulário próprio).
  - Hotel Pet → abre `view: 'hotelRegistration'` (formulário próprio).
  - Visita → abre nova rota `view: 'visitSelector'`.
- **VisitSelector (novo)**: dois botões:
  - "Creche Pet" → pré-seleciona serviço de visita e segue para **AppointmentForm** com `service = 'Creche Pet'`.
  - "Hotel Pet" → pré-seleciona serviço de visita e segue para **AppointmentForm** com `service = 'Hotel Pet'`.

## Formulários por Serviço
- **BathTosaWizard (appointments)**: já existente; garantir que a Home pula a etapa "Escolha os Serviços" e entra direto em `bath_groom` com peso/agenda.
- **PetMovelWizard (pet_movel_appointments)**: já existente; garantir fluxo por condomínio e serviço; grava em `pet_movel_appointments`.
- **DaycareRegistrationForm (daycare_enrollments)**: já existente; manter layout atual.
- **HotelRegistrationForm (hotel_registrations)**: já existente; manter layout atual.
- **AppointmentForm para Visita (appointments)**: formulário simples com coleta rápida: pet/tutor, telefone, endereço/condomínio (opcional), data/horário e preço 0; `service` = "Creche Pet" ou "Hotel Pet", `status` = "pending".

## Correção de Botões da Home
- Remover todas as referências a `setDirectLaunch(...)` e `showWizard` ainda existentes.
- Botões passam a controlar **apenas** `view` (para creche/hotel/visitSelector) ou `serviceStepView` + `step` (para banho & tosa / pet móvel).

## Gesto iPhone (voltar)
- Manter o gesto "arrastar da borda esquerda" para voltar **apenas** do formulário/rotas internas para `view: 'scheduler'`.
- Não depender de variáveis fora de escopo; observar apenas `view`.

## Implementação Técnica
1. Remover `setDirectLaunch`/`showWizard` dos handlers de clique na Home.
2. Criar nova view `visitSelector` no App, com dois botões e navegação para **AppointmentForm** com serviço pré-definido.
3. Garantir renderização por `view`: `scheduler`, `daycareRegistration`, `hotelRegistration`, `visitSelector` e o wizard (quando aplicável).
4. No wizard, ocultar "Escolha os Serviços" quando originado pela Home (entrar direto em `bath_groom` ou `pet_movel`).
5. Mapear `AppointmentForm` (Visita) para `appointments` com payload mínimo (sem extras) e status inicial.
6. Ajustar o gesto back para observar apenas `view` e voltar ao `scheduler`.

## Validação
- Testar todos os botões da Home em mobile e desktop.
- Confirmar inserts no Supabase por tabela correta.
- Verificar navegação por gesto e botões "Voltar".

## Entregáveis
- Nova rota `visitSelector` integrada ao App.
- Botões da Home funcionando sem erros de referência.
- Formulários mapeados às tabelas corretas.
- Wizard simplificado sem categoria quando vindo da Home.

Confirma que posso implementar conforme o plano acima?