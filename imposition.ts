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
const pdfDoc = await PDFDocument.load(uint8Array).catch((error) => {
  console.error(
    "There was a problem reading the provided filename. Please check to make sure the file exists in the location specified and that it is a valid PDF. See error below for more details"
  );
  console.error(error);
  Deno.exit(0);
});

// Create document that will contain impositioned pages
const processedDoc = await PDFDocument.create();

// Set page constants
const pagesPerSignature = args.p * 4;
let totalPages = pdfDoc.getPageCount();

// Check to make sure the document has the minimum number of pages
if (totalPages < 4 && !args.f) {
  console.error(
    "The document contains too few pages to do an imposition. The document should contain at least 4 pages to create a single signature. If you would like to override this check, use the -f switch to force the script to add enough blank pages to reach 4."
  );
  Deno.exit(0);
}

// Make PDF total page count even for signatures by adding needed blank pages at end of document
if (totalPages % pagesPerSignature !== 0) {
  const extraPages = pagesPerSignature - (totalPages % pagesPerSignature);
  const samplePage = pdfDoc.getPage(0);
  const { width, height } = samplePage.getSize();
  for (let i = 1; i <= extraPages; i++) {
    pdfDoc.addPage([width, height]);
  }
  // Update totalPages with new page count after blank page insert
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
    // TODO: Refactor this if/else? So far, everything I've come up with as an alternative is less clear and readable than this.
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
