## Objetivo
- Reestruturar o Hotel Pet em sessões: "Pets no Hotel agora", "Hospedagens Aprovadas", "Hospedagens em Análise" e "Arquivados".
- Mover cards automaticamente entre sessões com base nas ações (Aprovar, Check-in, Check-out).
- Adicionar ícone de filtro para filtrar por cada tipo acima, com UI elegante e consistente.

## Contexto no Código
- Lista/gestão Hotel: `HotelView` em `App.tsx` (c:\Users\...\SandyPetShop_v3\App.tsx:7777).
- Ações atuais do card (Check-in, Aprovar, Rejeitar, etc.): `App.tsx:7976–8010` e handlers `handleToggleCheckIn`, `handleApprove`.
- Campos de estado: `check_in_status` e novos `approval_status`/`rejection_reason` em `types.ts:223+`.
- Padrão de filtro existente (painel lateral): referência de estados e UI em `App.tsx:4496–4919`.
- Ícones disponíveis no arquivo (ex.: `ChartBarIcon`, `SearchIcon`); criaremos `FunnelIcon` inline seguindo o padrão.

## Critérios de Agrupamento
- Pets no Hotel agora: `check_in_status === 'checked_in'`.
- Hospedagens Aprovadas: `approval_status === 'Aprovado'` e `check_in_status !== 'checked_in'`.
- Hospedagens em Análise: `approval_status === 'Pendente'` (ou `undefined`) e `check_in_status === 'pending'`.
- Arquivados: `check_in_status === 'checked_out'` ou `status === 'Concluído'`.

## Mudanças de UI
- No `HotelView`, calcular arrays derivados `currentInHotel`, `approved`, `pending`, `archived` a partir de `registrations`.
- Renderizar quatro seções com títulos e contadores, cada uma com grid responsivo de cards.
- Adicionar badge de estado de aprovação no card (discreto, seguindo Tailwind já usado) e manter o badge de check-in.

## Ações e Movimentação de Cards
- `Aprovar`: já atualiza `approval_status` para `Aprovado` (em `handleApprove`); o card automaticamente aparece em "Hospedagens Aprovadas".
- `Check-in`: já alterna `check_in_status` para `checked_in` (em `handleToggleCheckIn`); o card aparece em "Pets no Hotel agora".
- `Check-out`: ao alternar para `checked_out`, o card vai para "Arquivados".
- `Rejeitar`: permanece visível em "Em Análise" com estado apropriado; se necessário podemos ocultá-lo via filtro.

## Filtro por Tipo
- Adicionar estado `hotelFilter` (valores: `all | in_hotel | approved | analysis | archived`).
- Adicionar `showHotelFilterPanel` e um botão com `FunnelIcon` ao lado do título "Hotel Pet" (em `App.tsx:8018–8034`).
- Painel de filtro: semelhante ao existente (toggle com transição), lista de opções com seleção clara.
- Aplicar filtro na renderização: mostrar apenas a seção correspondente quando um tipo for selecionado; `all` mostra todas.

## Persistência/Tipos
- Tratar `approval_status` ausente como `'Pendente'` no agrupamento.
- Sem alterações no banco além das já usadas por `approval_status` e `rejection_reason`.

## Verificação
- Testar cada ação para mover corretamente o card entre seções.
- Testar filtro para cada tipo.
- Verificar responsividade no preview e consistência de estilos com Tailwind existente.

Confirma a execução dessas alterações para organizar o menu Hotel Pet em sessões com filtro?