## Objetivo
- Ao aprovar um check-in de Hotel Pet, o card deve aparecer na sessão “Hospedagens Aprovadas”.
- Permitir arrastar cards de “pendentes” para “Hospedagens Aprovadas” via drag-and-drop.

## Ajustes de UI/Estado
- Renomear a sessão “Pets aprovados” para “Hospedagens Aprovadas” e posicioná-la logo após “Check-ins pendentes de análise”.
- Tornar cards da sessão “pendentes” arrastáveis; capturar origem do arraste.
- Adicionar área de drop em “Hospedagens Aprovadas” que, ao receber um card pendente, atualiza `approval_status` para `approved` e move o card.
- Manter a área “Pets no Hotel Agora” para arrastar aprovados e efetivar `checked_in`.

## Lógica
- Estado adicional: `dragSource: 'pending' | 'approved'` além de `draggedRegistration`.
- Aprovar (botão verde): update Supabase (`approval_status='approved'`), atualizar estado local e o card deve aparecer na sessão aprovada.
- Drop na sessão “Hospedagens Aprovadas”: quando origem for `pending`, executar update Supabase e mover no estado local.

## Supabase (MCP Sandy PetShop)
- Garantir que registros com `approval_status` nulo sejam tratados como `pending` (update massivo).
- Confirmar colunas existem.

## Validação
- Iniciar dev server; aprovar pelo botão e via arraste; ver card em “Hospedagens Aprovadas”.
- Arrastar da sessão aprovada para “Pets no Hotel Agora” continua funcionando.

Confirma aplicar essas mudanças agora para corrigir o fluxo de aprovação e arraste?