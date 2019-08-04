const fs = require('fs');
const prompts = require('prompts');

// Read available files from current directory
// Matches relevant files with regex (tapahtumat, finnish for transactions)
const readAvailableFiles = () => {
  return fs.readdirSync('./').filter(file => /tapahtumat.*(.txt|.csv)/ig.test(file));
}

// Reads a single file
const readFile = (filename) => {
  return fs.readFileSync(filename)
    .toString()
    // remove whitespace
    .replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, '');
}

// User prompt for file selection
// Reads current current directory as a default
const selectFileToParse = async (availabeFiles = readAvailableFiles()) => {
  return await prompts({
    type: 'multiselect',
    name: 'files',
    message: 'Pick file(s) to convert',
    choices: availabeFiles.map((filename) => {
      return {
        title: filename,
        value: filename
      }
    }),
    min: 1,
  });
};

// Formats list of unique transactions to .qif format
const formatTransactions = (transactions, format) => {
  return transactions.reduce((r, t) => {
    let entryDate, amount, payee;

    switch (format) {
      case 'csv':
        [entryDate, , amount, , , payee] = t.split(';');
        break;
      case 'txt':
        [entryDate, , , amount, payee] = t.split('\t');
        break;
      default:
        throw new Error('Unsupported filetype.');
    }

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

};

// Convert formatted transaction to .qif file
const convertFile = (filename) => {
  // Filetype defines the format and bank of transactions file
  // and gives some variations for the parser
  // .csv = OP, .txt Nordea
  const [name, format] = filename.split('.');
  let transactions, formattedTransaction;
  console.log(format)
  const file = readFile(filename);

  switch (format) {
    case 'csv':
      [, , ...transactions] = file.split("\n");
      break;
    case 'txt':
      [, ...transactions] = file.split("\n");
      break;
    default:
      throw new Error('Unsupported filetype.');
  }

  formattedTransaction = formatTransactions(transactions, format);
  const content = '!Type:Bank\n' + formattedTransaction.join('\n');

  const qifFilename = `${name}.qif`;
  fs.writeFile(qifFilename, content, err => {
    if (err) throw err;
    console.log(`${qifFilename} generated`);
  });

};

const run = async () => {
  const response = await selectFileToParse();

  response.files.forEach(filename => convertFile(filename));

};

run();
