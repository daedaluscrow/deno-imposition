import {
  PDFDocument,
  PDFPage,
} from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
import { parse } from "https://deno.land/std@0.134.0/flags/mod.ts";

// Parse arguments
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

// Create document that will contain impositioned pages
const processedDoc = await PDFDocument.create();

// Set page constants
const pagesPerSignature = args.p * 4;
let totalPages = pdfDoc.getPageCount();

// Make PDF total page count even for signatures by adding needed blank pages at end of document
if (totalPages % pagesPerSignature !== 0) {
  const extraPages = pagesPerSignature - (totalPages % pagesPerSignature);
  for (let i = 1; i <= extraPages; i++) {
    pdfDoc.addPage(); // TODO: Make added pages match size of current pages
  }
  //Update totalPages with new page count after blank page insert
  totalPages = pdfDoc.getPageCount();
}

// Set more constants
const numberOfSignatures = totalPages / pagesPerSignature;
const pageIndex = [...Array(totalPages).keys()]; // This is just an array containing all of the indexes for every page in the file. It is used to copy all of the pages to the new document later
const arrayOfSignatures: number[][] = [];

// Create a two dimensional array containing blank arrays for each signature so each signature can be impositioned properly
for (let i = 0; i < numberOfSignatures; i++) {
  arrayOfSignatures.push([]);
}

// Iterate through 2D array, running the function that returns a 1 dimensional array containing the proper order for the impositioned pages in the signature based on the user inputed settings and original document
const arrayOfIndexes = arrayOfSignatures.map(async (signature, index) => {
  const imposition = await getImpositionArray(index + 1);
  signature = [...signature, ...imposition];
  return await signature;
});

// Resolve all of the promises gathered in the last step, flatten the 2D array into a 1D array, and pass to next function
Promise.all(arrayOfIndexes).then((arr) => {
  impositionPages(arr.flat());
});

// This function uses the passed index to process each individual signature and provide an array containing the impositioned pages expected order
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
  return await arr;
}

// Take the array representing the intended order of pages, copies all pages from the old document to the new one, and then iterates over the arrayOfIndexes, adding each page to the new document based on the value in the arrayOfIndexes
async function impositionPages(arrayOfIndexes: number[]) {
  const allPagesPromise = await processedDoc.copyPages(pdfDoc, pageIndex);
  Promise.resolve(allPagesPromise).then((allPages: PDFPage[]) => {
    arrayOfIndexes.forEach((index) => {
      processedDoc.addPage(allPages[index]);
    });
    savePDF();
  });
}

// Finally, save the new PDF to the output folder using either the provided filename or the default
async function savePDF() {
  const pdfBytes = await processedDoc.save();
  await Deno.writeFile("./output/" + outputFile, pdfBytes);

  console.log("PDF file written to output/" + outputFile);
}

// The repo contains a number of test PDFs that you can run the script on in order to see that it is functioning correctly. Each contains a different number of pages for testing various scenarios. See the arguments below on how to run this script on these test files. The resulting PDF will appear in the "output" folder in the repo

// To run from the cmd:
// deno run --allow-write --allow-read imposition.ts -i ./test/test-12.pdf -o test-12-output.pdf -p 3
// or
// deno run --allow-write --allow-read imposition.ts -i ./test/test-60.pdf -o test-60-output.pdf -p 3
// or
// deno run --allow-write --allow-read imposition.ts -i ./test/test-103.pdf -o test-103-output.pdf -p 3
