const fs = require('fs')
const file = fs.readFileSync('transactions.txt')
    .toString()
    .replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");

const [, , ...transactions] = file.split("\n");

const formatted = transactions.map((t) => {
    const [entryDate, , , amount, payee] = t.split('\t');
    const [day, month, year] = entryDate.split('.');

    const qif = `
D${month}/${day}/${year}
T${amount.replace(",", ".")}
P${payee}
^
`;
    return qif.trim();
});

const text = '!Type:Bank\n' + formatted.join('\n');

fs.writeFile('transactions.qif', text, err => {
  if (err) throw err;
  console.log('QIF file generated');
});
