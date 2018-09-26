const fs = require('fs')
const file = fs.readFileSync('transactions.txt')
    .toString()
    .replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");

const [, , ...transactions] = file.split("\n");

const formatted = transactions.reduce((r, t) => {
    const [entryDate, , , amount, payee] = t.split('\t');

    if (typeof amount == 'undefined') {
        return r;
    } 

    const [day, month, year] = entryDate.split('.');

    const qif = `
D${month}/${day}/${year}
T${amount.replace(",", ".")}
P${payee}
^
`;
    return r.concat(qif.trim());

}, []);

const text = '!Type:Bank\n' + formatted.join('\n');

fs.writeFile('transactions.qif', text, err => {
  if (err) throw err;
  console.log('QIF file generated');
});
