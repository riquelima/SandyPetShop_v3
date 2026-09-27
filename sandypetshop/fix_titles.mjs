import fs from 'fs';
let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// The section titles look like this:
// <div className="flex items-center justify-center gap-2">
//    <img src="..."/>
//    <h3

// I will replace `flex items-center justify-center gap-2` with `flex items-center justify-start gap-2 w-full` for all those title headers.
// The easiest way is to use a regex that matches the div before the image.

content = content.replace(
    /<div className="flex items-center justify-center gap-2">\s*<img src="https:\/\/cdn-icons-png\.flaticon\.com/g,
    '<div className="flex items-center justify-start gap-2 w-full">\n                            <img src="https://cdn-icons-png.flaticon.com'
);

// Actually, let's just make it simpler.
content = content.replace(
    /className="flex items-center justify-center gap-2">\s*<img/g,
    'className="flex items-center justify-start gap-2 w-full">\n                            <img'
);

content = content.replace(
    /className="flex items-center justify-center gap-2">\s*<span/g,
    'className="flex items-center justify-start gap-2 w-full">\n                            <span'
);

// Fix the 'Nível de Energia' one too just in case
content = content.replace(
    /className="flex items-center justify-center gap-2">\s*<img src="https:\/\/cdn-icons-png\.flaticon\.com\/512\/16725\/16725843\.png"/g,
    'className="flex items-center justify-start gap-2 w-full">\n                                <img src="https://cdn-icons-png.flaticon.com/512/16725/16725843.png"'
);

// Recadinho text change
content = content.replace('Recadinho da Tia da Creche', 'Recadinho da Sandy');

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
