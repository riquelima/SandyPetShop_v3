import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// Insert getBehaviorLabel helper right before `return (`
const helper = `
    const getBehaviorLabel = (n: number) => {
        switch (n) {
            case 1: return 'Muito Calmo';
            case 2: return 'Dócil & Sossegado';
            case 3: return 'Energia Média';
            case 4: return 'Ativo & Brincalhão';
            case 5: return 'Alta Energia / Reativo';
            default: return '';
        }
    };

    return (`;
content = content.replace('    return (', helper);

// Replace the behavior slider labels
content = content.replace(
    '<span>😇 Anjinho (1)</span>\n                                <span className="px-2.5 py-0.5 rounded-full bg-[#ffd8e7] text-[#a43073]">{behavior} - Normal</span>\n                                <span>🌪️ Furacão (5)</span>',
    '<span>😇 Muito Calmo (1)</span>\n                                <span className="px-2.5 py-0.5 rounded-full bg-[#ffd8e7] text-[#a43073] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] text-center">{behavior} - {getBehaviorLabel(behavior)}</span>\n                                <span>🌪️ Alta Energia (5)</span>'
);

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
