import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// 1. Remove the misplaced helper
const wrongLocationStr = `    
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
`;
content = content.replace(wrongLocationStr, '');

// 2. Insert it at the right location before `return (` which is around line 246
const targetStr = `    return (`;
const helperStr = `
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

    return (`

// Since `return (` might match multiple things, we can be more specific, or since `return (` (with 4 spaces) is exactly the component return, we can use that.
// Let's replace the EXACT `    return (`.
content = content.replace('    return (', helperStr);

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
