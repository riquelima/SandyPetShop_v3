import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// Replace flex items-center without justify-center (for buttons)
// We can just add justify-center anywhere in the class string where we see flex items-center
content = content.replace(/flex items-center gap-2\.5/g, 'flex items-center justify-center gap-2.5');
content = content.replace(/flex items-center gap-1\.5/g, 'flex items-center justify-center gap-1.5');
content = content.replace(/flex items-center gap-2/g, 'flex items-center justify-center gap-2');
content = content.replace(/flex flex-col items-center/g, 'flex flex-col items-center justify-center');
content = content.replace(/flex items-center transition-all/g, 'flex items-center justify-center transition-all');

// Fix buttons that don't have flex at all in Rotina Básica
content = content.replace(/className={\`min-h-\[48px\] p-2 rounded-2xl/g, 'className={`min-h-[48px] p-2 flex items-center justify-center text-center rounded-2xl');
content = content.replace(/className={\`min-h-\[44px\] px-2 py-1\.5 rounded-2xl/g, 'className={`min-h-[44px] px-2 py-1.5 flex items-center justify-center text-center rounded-2xl');
content = content.replace(/className={\`min-h-\[44px\] px-2 py-1 rounded-2xl/g, 'className={`min-h-[44px] px-2 py-1 flex items-center justify-center text-center rounded-2xl');

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
