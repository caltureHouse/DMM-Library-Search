const fs = require('fs');
const XLSX = require('xlsx');
const workbook = XLSX.readFile('قائمة الدمام.xlsx');
const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
fs.writeFileSync('books.json', JSON.stringify(json));