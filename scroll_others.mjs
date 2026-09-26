import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// For Atividade Favorita:
content = content.replace(
    '<div className="flex flex-wrap gap-2">\n                                {activityOpts.map(opt => {',
    '<div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 w-full whitespace-nowrap">\n                                {activityOpts.map(opt => {'
);

// For Socialização:
content = content.replace(
    '<div className="flex flex-wrap gap-2">\n                                {socialOpts.map(opt => {',
    '<div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 w-full whitespace-nowrap">\n                                {socialOpts.map(opt => {'
);

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
