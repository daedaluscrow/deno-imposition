import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
import { parse } from "https://deno.land/std@0.134.0/flags/mod.ts";

const args = parse(Deno.args);

// Check to make sure input filename was passed as an argument
if (!args.i || args.i === "") {
  console.log("Must include pdf input filename using the -i switch.");
  Deno.exit(0);
}

// Check to make sure number of pages per signature was passed as an argument
if (!args.p || args.p < 2) {
  console.log(
    "Must include number of sheets of paper per signature using the -p switch."
  );
  Deno.exit(0);
}

// Set output filename if provided as an argument
const outputFile = args.o && args.o !== "" ? args.o : "finished-document.pdf";

// Load the PDF using the commandline argument
const uint8Array = Deno.readFileSync(args.i);
const pdfDoc = await PDFDocument.load(uint8Array);

// Get array of all pages in document and set page constants
// const pages = pdfDoc.getPages();
const pagesPerSignature = args.p * 4;
let totalPages = pdfDoc.getPageCount();

// Make PDF total page count even for signatures by adding needed blank pages at end of document
if (totalPages % pagesPerSignature !== 0) {
  const extraPages = pagesPerSignature - (totalPages % pagesPerSignature);
  for (let i = 1; i <= extraPages; i++) {
    pdfDoc.addPage();
  }
}

totalPages = pdfDoc.getPageCount();
// console.log(totalPages);
const numberOfSignatures = totalPages / pagesPerSignature;
const pageIndex = [...Array(totalPages).keys()];
const arrayOfSignatures: number[][] = [];

for (let i = 0; i < numberOfSignatures; i++) {
  arrayOfSignatures.push([]);
}

let processedDoc: PDFDocument;

const arrayOfIndexes = arrayOfSignatures.map(async (signature, index) => {
  const imposition = await getImpositionArray(index + 1);
  signature = [...signature, ...imposition];
  return await signature;
});

Promise.all(arrayOfIndexes).then((arr) => {
  console.log(arr.flat());
  impositionPages(pdfDoc, arr.flat());
});

// Save the PDFDocument and write it to a file
// const pdfBytes = await processedDoc.save();
// await Deno.writeFile("./output/" + outputFile, pdfBytes);

// Log out successful write operation
console.log("PDF file written to output/" + outputFile);

async function getImpositionArray(index: number): Promise<number[]> {
  const arr: number[] = [];
  let toggle = false;

  for (let i = 0; i < pagesPerSignature / 2; i++) {
    if (toggle) {
      arr.push((index - 1) * pagesPerSignature + i);
      arr.push(index * pagesPerSignature - i - 1);
    } else {
      arr.push(index * pagesPerSignature - i - 1);
      arr.push((index - 1) * pagesPerSignature + i);
    }
    toggle = !toggle;
  }
  // console.log(arr);
  return await arr;
}

function impositionPages(pdfDoc: PDFDocument, arrayOfIndexes: number[]) {
  // console.log(pdfDoc);
  return PDFDocument.create();
}
// To run from the cmd:
// deno run --allow-write --allow-read imposition.ts -i ./test/test-12.pdf -o test-12-output.pdf -p 3
// or
// deno run --allow-write --allow-read imposition.ts -i ./test/test-60.pdf -o test-60-output.pdf -p 3
// or
// deno run --allow-write --allow-read imposition.ts -i ./test/test-103.pdf -o test-103-output.pdf -p 3
