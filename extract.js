const fs = require('fs');
const pdf = require('pdf-parse');

console.log(typeof pdf);

let dataBuffer = fs.readFileSync('public/INDO 100.pdf');

if (typeof pdf === 'function') {
  pdf(dataBuffer).then(function(data) {
      fs.writeFileSync('extracted_text.txt', data.text);
      console.log("Extraction complete.");
  }).catch(console.error);
} else if (pdf.default && typeof pdf.default === 'function') {
  pdf.default(dataBuffer).then(function(data) {
      fs.writeFileSync('extracted_text.txt', data.text);
      console.log("Extraction complete.");
  }).catch(console.error);
} else {
  console.log('Unable to find pdf parse function:', pdf);
}
