## Problema
- Ao clicar em Aprovar, o card não aparece em “Hospedagens Aprovadas”. A causa provável é o estado local não refletir a atualização (mapeamento por `id` falhando ou valores não normalizados), ou agrupamento não recalculado imediatamente.

## Pontos no Código
- Handler de aprovação: `handleApprove` em App.tsx (c:\Users\...\SandyPetShop_v3\App.tsx:7842–7860 aprox.).
- Agrupamento por sessões: cálculo de `currentInHotel`, `approved`, `analysis`, `archived` dentro de `HotelView` (c:\Users\...\SandyPetShop_v3\App.tsx:7933–7937, 7938–7944).
- Render das seções: `HotelAccordionSection` e uso em `App.tsx:8191–8204`.

## Correções Propostas
1) Normalizar aprovação no agrupamento
- Garantir comparação case-insensitive: já aplicado, validar que é consistente.
- Remover de “Em Análise” cards aprovados com conjuntos de IDs: já aplicado, manter.

2) Tornar `handleApprove` robusto
- Após update, chamar `fetchRegistrations()` para recarregar os dados do Supabase, evitando diferenças de tipo (ex.: `id` como number vs string) e garantindo re-render.
- Usar o `data` retornado pelo Supabase para atualizar o item, com fallback para `fetchRegistrations()` se `id` não casar.
- Normalizar `approval_status` e `check_in_status` ao atualizar (já previsto quando vindo de Arquivados).

3) Unificar tipo de `id`
- No `fetchRegistrations`, ao setar `registrations`, converter `id` para string: `String(reg.id)` para garantir que os conjuntos e comparações funcionem.

4) Feedback visual
- Manter expansão automática da sessão “Aprovadas” após Aprovar para evidenciar a movimentação.

## Testes
- Aprovar item em “Em Análise” → aparece em “Aprovadas”, deixa de aparecer em “Em Análise”.
- Aprovar item em “Arquivados” → desarquiva e aparece em “Aprovadas”.
- Aprovar item com `id` numérico → funciona após refetch.

## Implementação
- Editar `handleApprove`: após sucesso, chamar `fetchRegistrations()` e/ou substituir item pelo `data` retornado.
- Editar `fetchRegistrations`: ao montar `registrations`, mapear `id: String(id)`.
- Verificar agrupamento e manter deduplicação com conjuntos.

Confirmo aplicar estas mudanças para que o card seja movido corretamente para “Hospedagens Aprovadas” ao aprovar?