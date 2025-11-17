## Objetivo
- Usar um orquestrador de estados (no espírito do “mcp sandy pet shop”) para garantir que, ao Aprovar/Check‑in/Check‑out/Arquivar, os cards mudem de sessão corretamente e nunca dupliquem.

## Achados no código
- Fonte de dados/agrupamento: `HotelView` em `App.tsx` (c:\Users\...\SandyPetShop_v3\App.tsx:7928–8210).
- Handlers:
  - Aprovar: `handleApprove` (c:\Users\...\App.tsx:7842–7860 aprox.).
  - Check-in/out/arquivar: `handleToggleCheckIn` (c:\Users\...\App.tsx:7806–7854).
- Deduplicação atual: conjuntos de IDs por sessão (c:\Users\...\App.tsx:7933–7937 revisado).
- Card e sessões (accordion): `HotelRegistrationCard` (c:\Users\...\App.tsx:7984–8131), `HotelAccordionSection` (c:\Users\...\App.tsx:7942–7974) e render (c:\Users\...\App.tsx:8191–8205).

## Modelo de estados (única fonte de verdade)
- Campos no registro:
  - `approval_status`: `'Pendente' | 'Aprovado' | 'Rejeitado'`
  - `check_in_status`: `'pending' | 'checked_in' | 'checked_out'`
  - `status`: `'Ativo' | 'Concluído' | 'Cancelado'`
- Regras de sessão (disjuntas):
  - Em Análise: `approval_status === 'Pendente'` e `check_in_status !== 'checked_in' && !== 'checked_out'`
  - Aprovadas: `approval_status === 'Aprovado'` e `check_in_status !== 'checked_in'`
  - Pets no Hotel agora: `check_in_status === 'checked_in'`
  - Arquivados: `check_in_status === 'checked_out' || status === 'Concluído'`
- Normalização: comparar com `toLowerCase()` e `trim()` para evitar variações.

## Orquestrador de transições (MCP)
- Criar serviço/“módulo MCP” com funções puras:
  1. `nextStateOnApprove(reg)` → retorna payload coerente:
     - se `checked_out`: desfazer arquivo (`check_in_status = 'pending'`, `checked_out_at = null`, `status = 'Ativo'`)
     - sempre: `approval_status = 'Aprovado'`, `rejection_reason = null`
  2. `nextStateOnCheckIn(reg)`/`nextStateOnCheckOut(reg)`/`nextStateOnArchive(reg)` → definem payloads consistentes
  3. `groupBySession(regs)` → aplica regras disjuntas com conjuntos de IDs
- Vantagens: transições previsíveis, zero duplicação.

## Integração no fluxo
- Substituir lógica inline dos handlers por chamadas ao orquestrador e aplicar payload no Supabase.
- Após cada mutação:
  - Usar ID normalizado (`String(id)`) ao atualizar o estado local
  - Fazer `fetchRegistrations()` para sincronizar
  - Expandir sessão destino (ex.: após `Aprovar`, expandir “Aprovadas”) e opcionalmente setar `hotelFilter = 'approved'`

## Observabilidade
- Logar transição: `from → to` com registro de `id` e campos alterados
- Exibir toast leve ao mover card de sessão

## Testes
- Cenários:
  - Aprovar item em “Em Análise” → aparece só em “Aprovadas”
  - Aprovar item em “Arquivados” → é desarquivado e vai para “Aprovadas”
  - Check‑in em “Aprovadas” → vai para “Pets no Hotel agora”
  - Check‑out/Arquivar → vai para “Arquivados”
  - Nenhuma duplicação ao alternar entre estados

## Passos de implementação
1. Criar módulo de orquestração de estados (funções puras de transição e agrupamento)
2. Atualizar `handleApprove`/`handleToggleCheckIn` para usar o módulo, normalizar ID e refazer `fetchRegistrations()`
3. Ajustar agrupamento com conjuntos e normalização
4. Expandir sessão destino e opcional filtro automático

Confirma que eu integre o orquestrador de estados no Hotel Pet e ajuste os handlers para mover os cards corretamente sem duplicação?