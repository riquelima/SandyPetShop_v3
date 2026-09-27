import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// 1. Nível de Energia
content = content.replace(
    '<span className="w-8 h-8 rounded-full bg-[#ffd8e7] flex items-center justify-center text-[#a43073]"><span className="material-symbols-outlined text-[20px]">bolt</span></span>',
    '<img src="https://cdn-icons-png.flaticon.com/512/16725/16725843.png" className="w-8 h-8 drop-shadow-sm" alt="Energia" />'
);

// 2. Estrelinha do Dia
content = content.replace(
    '<span className="w-8 h-8 rounded-full bg-[#ffd8e7] flex items-center justify-center text-[#a43073]"><span className="material-symbols-outlined text-[20px]">military_tech</span></span>',
    '<img src="https://cdn-icons-png.flaticon.com/512/2107/2107957.png" className="w-8 h-8 drop-shadow-sm" alt="Estrelinha" />'
);
// E atualizar o container flex-wrap para o grid horizontal
content = content.replace(
    '<div className="flex flex-wrap gap-2 py-1">\n                            {achievementOpts.map(opt => {',
    '<div className="grid grid-rows-3 grid-flow-col gap-2 py-1 overflow-x-auto no-scrollbar pb-2 w-full auto-cols-max">\n                            {achievementOpts.map(opt => {'
);

// 3. Comportamento & Vibe
content = content.replace(
    '<span className="w-8 h-8 rounded-full bg-[#ffd8e7] flex items-center justify-center text-[#a43073]"><span className="material-symbols-outlined text-[20px]">psychology</span></span>',
    '<img src="https://cdn-icons-png.flaticon.com/512/4117/4117609.png" className="w-8 h-8 drop-shadow-sm" alt="Comportamento" />'
);
// Also for Atividade Favorita and Socialização & Bem Estar which also have flex-wrap, the user said "as demais deve poder passar pro lado para selecionar", meaning maybe the others too? Wait, the user specifically mentioned "Estrelinha do dia... Precisa alinhar o titulo a esquerda... e as labels...". For "Socialização" and "Atividade favorita", I will leave them as flex-wrap for now, or just make them scrollable horizontally like `flex overflow-x-auto no-scrollbar gap-2` (one line). Actually, I'll make them `flex overflow-x-auto no-scrollbar pb-2 w-full whitespace-nowrap` if they want it scrollable horizontally. Wait, "Atividade Favorita" has 4 options. I'll change it to `flex overflow-x-auto no-scrollbar gap-2 pb-1`. 

// 4. Rotina Básica
content = content.replace(
    '<span className="w-8 h-8 rounded-full bg-[#ffd8e7] flex items-center justify-center text-[#a43073]"><span className="material-symbols-outlined text-[20px]">restaurant</span></span>',
    '<img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" className="w-8 h-8 drop-shadow-sm" alt="Rotina" />'
);

// 5. Mídias & Recadinho
content = content.replace(
    '<span className="w-8 h-8 rounded-full bg-[#ffd8e7] flex items-center justify-center text-[#a43073]"><span className="material-symbols-outlined text-[20px]">photo_camera</span></span>',
    '<img src="https://cdn-icons-png.flaticon.com/512/1042/1042390.png" className="w-8 h-8 drop-shadow-sm" alt="Midia" />'
);

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
