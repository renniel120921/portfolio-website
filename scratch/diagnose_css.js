const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

console.log('=== CSS POTENTIAL OVERFLOW RISKS ===');

// 1. Check fixed widths > 300px
const fixedWidths = [];
const lines = css.split('\n');
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (/width:\s*([3-9]\d{2,}|\d{4,})px/i.test(line)) {
    fixedWidths.push(`${lineNum}: ${line.trim()}`);
  }
  if (/min-width:\s*([2-9]\d{2,}|\d{4,})px/i.test(line)) {
    fixedWidths.push(`MIN-WIDTH ${lineNum}: ${line.trim()}`);
  }
  if (/white-space:\s*nowrap/i.test(line)) {
    fixedWidths.push(`NOWRAP ${lineNum}: ${line.trim()}`);
  }
  if (/100vw/i.test(line)) {
    fixedWidths.push(`100VW ${lineNum}: ${line.trim()}`);
  }
});

console.log('Found risks:', fixedWidths);

