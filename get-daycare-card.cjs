const fs = require('fs');
const content = fs.readFileSync('App.tsx', 'utf8');
const startIndex = content.indexOf('const DaycareEnrollmentCard: React.FC<{');
if (startIndex === -1) {
    console.log("NOT FOUND");
    process.exit(1);
}
let endIndex = startIndex;
let braceCount = 0;
let foundFirstBrace = false;

for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') {
        braceCount++;
        foundFirstBrace = true;
    } else if (content[i] === '}') {
        braceCount--;
    }
    
    if (foundFirstBrace && braceCount === 0) {
        endIndex = i + 1;
        break;
    }
}

// Write the original function to a file so we can view it fully
fs.writeFileSync('scratch/originalDaycareCard.tsx', content.substring(startIndex, endIndex));
console.log(`Saved original function to scratch/originalDaycareCard.tsx. Lines: ${content.substring(startIndex, endIndex).split('\n').length}`);
