import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

const regexesToReplace = [
    /bg-\[#ffd8e7\] text-\[#a43073\] shadow-sm/g,
    /bg-\[#68fcbf\] text-\[#002114\] shadow-sm/g,
    /bg-\[#c185fd\] text-\[#510c8a\] shadow-sm/g,
    /bg-\[#f472b6\] text-\[#6d0047\] shadow-sm/g,
    /bg-\[#ffd8e7\] text-\[#85145a\] shadow-sm/g,
    /bg-\[#f0dbff\] text-\[#62259b\]/g
];

regexesToReplace.forEach(regex => {
    content = content.replace(regex, 'bg-[#a43073] text-white shadow-sm');
});

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
