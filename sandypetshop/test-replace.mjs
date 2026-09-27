import fs from 'fs';
const app = fs.readFileSync('App.tsx', 'utf-8');
const lines = app.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const DaycareDiaryPage: React.FC')) {
        start = i;
    }
    if (start !== -1 && lines[i] === 'export default App;' && end === -1) {
        // wait, DaycareDiaryPage ends before PublicDiaryPage
    }
}
// Find the exact line DaycareDiaryPage ends.
// Let's search for "const PublicDiaryPage: React.FC"
for (let i = start; i < lines.length; i++) {
    if (lines[i].includes('const PublicDiaryPage: React.FC')) {
        end = i - 1;
        break;
    }
}
console.log('DaycareDiaryPage runs from', start + 1, 'to', end + 1);
