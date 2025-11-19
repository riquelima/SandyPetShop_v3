## Objetivo
- Reformular o resumo de Check-in com visual minimalista, claro e elegante.
- Calcular o total corretamente conforme regras de diárias por faixa de dias e peso, com sobrepreço em feriados (23–25/12 e 30–31/12, 01/01).

## UI do Resumo
- Substituir o bloco atual por um cartão com:
  - Título “Resumo do Check‑in” e seções claras.
  - Campos exibidos: Nome do Pet, Peso, Nome do Tutor, Telefone, Data/Horário de Check‑in, Data/Horário de Check‑out, Quantidade de diárias, Lista de feriados (se houver), Serviços adicionais selecionados, Observações.
  - Rodapé: “Total do Serviço: R$ …” destacado.
- Padrões: tipografia consistente, cores suaves, espaçamentos uniformes, valores alinhados à direita para números.

## Regras de Preço
- Faixas por quantidade de diárias (base não feriado):
  - 2–3 dias: Até 5kg → 100,00; Até 10kg → 120,00; Até 20kg → 150,00
  - 4–5 dias: Até 5kg → 90,00; Até 10kg → 110,00; Até 20kg → 140,00
  - 6–7 dias: Até 5kg → 80,00; Até 10kg → 100,00; Até 20kg → 130,00
- Feriados (por dia): 23–25/12 e 30–31/12, 01/01
  - Até 5kg → 120,00; Até 10kg → 140,00; Até 20kg → 160,00
- Regra de aplicação:
  - Iterar cada dia entre Check‑in (inclusive) e Check‑out (exclusivo) e somar:
    - Se dia for feriado: usar preço de feriado da faixa de peso.
    - Caso contrário: usar preço da faixa por quantidade total de diárias (2–3, 4–5, 6–7). 
- Validações e casos extremos:
  - 1 dia → aplicar faixa de 2–3 dias (valor mínimo).
  - > 7 dias → aplicar faixa de 6–7 dias para dias não feriados, feriados sempre usam tabela de feriado.
  - Pesos acima de 20kg (25/30/30+): usar como “Até 20kg”.

## Implementação Técnica
- Utilitários:
  - `isHoliday(date: Date): boolean` (verifica dia/mês em [23–25/12, 30–31/12, 01/01]).
  - `normalizeWeight(petWeight): 'UP_TO_5'|'KG_10'|'KG_20'` (mapa para 5/10/20kg).
  - `getLengthBracket(nDiarias): '2_3'|'4_5'|'6_7'` com regras para <2 e >7.
  - Tabelas de preço: objetos constantes para base e feriados.
  - `calculateTotal(checkIn, checkOut, petWeight): number` somando por dia.
- UI/Estado:
  - Atualizar o resumo em tempo real conforme campos são preenchidos (peso, datas, extras).
  - Mostrar lista de feriados (datas) quando detectados.
  - Persistir `total_services_price` ao salvar o registro, e refletir no modal do admin.

## Verificação
- Testar casos: 2, 4, 6 e 8 diárias em cada faixa de peso; datas com e sem feriados.
- Conferir exibição correta e destaque do “Total do Serviço”.
- Validar que o peso agora aparece sempre (via coluna `pet_weight`).

## Entrega
- Resumo visual atualizado e cálculo correto de diárias com feriados.
- Sem push até sua autorização. Confirma para eu implementar?