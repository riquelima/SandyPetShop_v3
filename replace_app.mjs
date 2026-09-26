import fs from 'fs';
let app = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add import
app = app.replace(
    "import MonthlyClientCard from './src/components/MonthlyClientCard';", 
    "import MonthlyClientCard from './src/components/MonthlyClientCard';\nimport DaycareDiaryPage from './src/components/DaycareDiaryPage';"
);

// 2. Remove the inline component
const lines = app.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const DaycareDiaryPage: React.FC')) {
        start = i;
    }
}
for (let i = start; i < lines.length; i++) {
    if (lines[i].includes('const PublicDiaryPage: React.FC')) {
        end = i - 1;
        break;
    }
}

if (start !== -1 && end !== -1) {
    lines.splice(start, end - start + 1);
    fs.writeFileSync('App.tsx', lines.join('\n'));
    console.log('Successfully replaced DaycareDiaryPage');
} else {
    console.log('Failed to find boundaries', {start, end});
}
