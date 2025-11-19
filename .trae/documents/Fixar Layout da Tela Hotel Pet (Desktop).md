## Problema
- Na versão desktop, elementos da página “Hotel Pet” se movem e se sobrepõem ao rolar.

## Objetivo
- Tornar a página estável, com cabeçalho fixo e conteúdo com rolagem controlada.
- Evitar sobreposição entre seções e cartões.

## Principais Ajustes
- Estrutura de layout consistente (header fixo + conteúdo scrollável):
  - Envolver o container administrativo com `min-h-screen flex flex-col`.
  - Cabeçalho/toolbar com `sticky top-0 z-40 bg-white border-b`.
  - Conteúdo principal com `flex-1 overflow-y-auto`.
- Conter e alinhar conteúdo da “HotelView”:
  - Root de `HotelView`: `min-h-screen bg-gray-50`.
  - Conteúdo dentro de `container mx-auto max-w-7xl px-4 py-6`.
  - Grid das seções com `grid grid-cols-1 lg:grid-cols-2 gap-6 items-start`.
  - Seções/containers com `relative` e cartões com `relative` (posicionamento estático), evitando absolute/fixed fora de modais.
  - Dropzone “Pets no Hotel Agora” com `min-h-[24rem] p-4 border-2 border-dashed rounded-lg` para altura estável.
- Menu/Itens de navegação (evitar deslocamentos por transform):
  - Remover/ajustar `scale-[1.01]`/`scale-[1.02]` dos itens em desktop OU conter o menu em wrapper `relative z-30` e `overflow-hidden` para não empurrar o layout.
- Modais: manter `fixed` e `z-[9999]` apenas para overlays, sem interferir no fluxo normal.

## Arquivos a atualizar
- `App.tsx`: wrapper do AdminDashboard (layout geral) e container da HotelView.
- `src/components/ui/menu.tsx`: ajustar transform/escala dos itens ou conter o menu com wrapper estável.
- Opcional: `src/components/ui/card.tsx`: garantir `relative` (já está) e `overflow-hidden` em conteúdos com animação.

## Validação
- Iniciar dev server, abrir “Hotel Pet” no desktop:
  - Header permanece fixo ao rolar.
  - Seções não se sobrepõem e mantêm espaçamento.
  - Cartões permanecem estáveis; dropzone tem altura fixa; drag-and-drop opera sem deslocar layout.

Confirma que posso aplicar esses ajustes de layout para estabilizar a página e eliminar sobreposição no desktop?