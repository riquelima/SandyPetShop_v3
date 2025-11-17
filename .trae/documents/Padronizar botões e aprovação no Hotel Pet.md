## Objetivo
- Padronizar o tamanho/estilo dos botões nos cards do Hotel Pet.
- Remover a descrição nos cards do menu "Hotel Pet" para melhor adaptação ao mobile.
- Adicionar em cada card de hospedagem dois botões: `Aprovar` e `Rejeitar`.
- Ao clicar em `Rejeitar`, abrir um campo (modal) para inserir o motivo antes de confirmar.

## Contexto no Código
- Cards de hospedagem: `HotelRegistrationCard` em `App.tsx` (c:\Users\...\SandyPetShop_v3\App.tsx:7896).
- Ações atuais do card (Check-in/Detalhes/Editar/Serviços/Excluir): `App.tsx:7976–8010`.
- Menu "Hotel Pet" (opções de Visita/Matrícula) com descrições: `Scheduler` em `App.tsx:7589–7602`.
- Tipos de Hotel: `HotelRegistration` em `types.ts` (c:\Users\...\SandyPetShop_v3\types.ts:164–232).
- Tabela Supabase envolvida: `hotel_registrations`.

## Alterações Propostas
### 1) Padronizar botões nos cards do Hotel
- Substituir o "row" atual por um layout com botões de mesmo tamanho utilizando `grid grid-cols-2 gap-3` (mobile) e `md:grid-cols-3` conforme necessário.
- Aplicar classes consistentes: `py-3.5 px-4 rounded-lg text-sm font-semibold w-full` e cores padronizadas por ação.
- Tornar todos os botões de ação com dimensões iguais (sem ícones isolados com `p-2`).

### 2) Remover descrição nos cards do menu Hotel Pet
- Em `Scheduler` (`App.tsx:7596–7602`), remover os `<span className="text-sm text-gray-600 mt-1">...` das opções "Visita - Hotel Pet" e "Matrícula - Hotel Pet".
- Ajustar o `min-h` dos botões para ficar uniforme e responsivo (ex.: `min-h-[64px]` em mobile). 

### 3) Adicionar botões `Aprovar` e `Rejeitar` em cada card
- Em `HotelRegistrationCard` (`App.tsx:7896`), incluir dois botões adicionais:
  - `Aprovar`: Atualiza o registro com status de aprovação (ver item 4).
  - `Rejeitar`: Abre modal para inserir `motivo` e confirmar (ver item 4).
- Exibir um badge de aprovação no topo do card (ex.: `Aguardando aprovação` / `Aprovado` / `Rejeitado`).

### 4) Modal de motivo de rejeição
- Nova modal semelhante à de exclusão (`App.tsx:8075–8099`):
  - Campo `textarea` obrigatório para o motivo.
  - Botões `Cancelar` e `Confirmar Rejeição`.
  - Ao confirmar: atualizar a linha no Supabase com `approval_status = 'Rejeitado'` e `rejection_reason = motivo`.

### 5) Persistência e tipos
- `types.ts` (`HotelRegistration`): adicionar campos opcionais
  - `approval_status?: 'Pendente' | 'Aprovado' | 'Rejeitado'`
  - `rejection_reason?: string | null`
- `HotelRegistrationForm` (inserção em `App.tsx:6190–6206`): inicializar novos campos em `'Pendente'`/`null`.
- Atualizações no Supabase:
  - Atualizar `hotel_registrations` para incluir colunas `approval_status` (text) e `rejection_reason` (text). 
  - Em leitura/listagem, lidar com ausência dos campos (fallback para `'Pendente'`).

### 6) Regras de estado/visualização
- `Aprovado`: permite fluxo de check-in normalmente.
- `Rejeitado`: desabilitar check-in; mostrar `rejection_reason` no card e botão para reverter (`Aprovar` novamente, se necessário).
- `Pendente`: ambos botões `Aprovar`/`Rejeitar` habilitados.

## Verificação
- Testar no preview em mobile: 
  - Cards sem descrição no menu Hotel Pet e com dimensões padronizadas.
  - Nos cards de hospedagem, todos botões com o mesmo tamanho e comportamento adequado.
  - Fluxo de `Aprovar` atualiza o badge e habilita check-in.
  - Fluxo de `Rejeitar` exige motivo, salva, mostra badge e desabilita check-in.

## Observações
- Não altera a lógica de `check_in_status` existente; adiciona camada de aprovação acima.
- Caso não seja possível evoluir o schema do Supabase imediatamente, os campos podem ser tratados como opcionais no código até a migration ser aplicada.

Confirma executar estas alterações?