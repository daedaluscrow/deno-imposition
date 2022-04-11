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
const pages = pdfDoc.getPages();
const pagesPerSignature = args.p * 4;
const totalPages = pages.length;

const processedDoc = impositionPages(pages, pagesPerSignature, totalPages);

// Save the PDFDocument and write it to a file
const pdfBytes = await processedDoc.save();
await Deno.writeFile("./output/" + outputFile, pdfBytes);

// Log out successful write operation
console.log("PDF file written to output/" + outputFile);

function impositionPages(
  pages: Array<PDFPage>,
  pagesPerSignature: number,
  totalPages: number
): PDFDocument {
  let toggle = false;
  const newDoc = [];
  for (let i = 0; i < pagesPerSignature / 2; i++) {
    if (toggle) {
      newDoc.push(pages[i]);
      newDoc.push(pages[-i - 1]);
    } else {
      newDoc.push(pages[-i - 1]);
      newDoc.push(pages[i]);
    }
    toggle = !toggle;
  }
  console.log(pages);
  console.log(pagesPerSignature);
  console.log(totalPages);
  return PDFDocument.create();
}
