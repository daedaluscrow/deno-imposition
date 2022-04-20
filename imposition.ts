import {
  PDFDocument,
  PDFPage,
} from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
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

// Make total page count even by adding a blank page at the end if it is odd
if (pdfDoc.getPageCount() % 2 !== 0) pdfDoc.addPage();

// Get array of all pages in document and set page constants
const pages = pdfDoc.getPages();
const pagesPerSignature = args.p * 4;
const totalPages = pages.length;

const processedDoc = await breakIntoSignatures(
  pages,
  pagesPerSignature,
  totalPages
);

// Save the PDFDocument and write it to a file
const pdfBytes = await processedDoc.save();
await Deno.writeFile("./output/" + outputFile, pdfBytes);

// Log out successful write operation
console.log("PDF file written to output/" + outputFile);

async function breakIntoSignatures(
  pages: Array<PDFPage>,
  pagesPerSignature: number,
  totalPages: number
): Promise<PDFDocument> {
  const totalSignatures = Math.ceil(totalPages / pagesPerSignature);
  const signatures: PDFPage[][] = [];

  for (let i = 0; i < totalSignatures; i++) {
    const lastSignature =
      i === totalSignatures - 1 && totalPages % pagesPerSignature !== 0
        ? totalPages % pagesPerSignature
        : false;

    if (lastSignature) {
      signatures.push(
        pages.slice(
          i * pagesPerSignature,
          i * pagesPerSignature + lastSignature
        )
      );
    } else {
      signatures.push(
        pages.slice(
          i * pagesPerSignature,
          i * pagesPerSignature + pagesPerSignature
        )
      );
    }
  }

  const promiseArray = signatures.map((signature) => {
    impositionSignatures(signature, pagesPerSignature);
  });

  const finalDoc = await PDFDocument.create();

  // console.log(promiseArray);

  Promise.all(promiseArray).then((finishedFile) => {
    // console.log(finishedFile);

    finishedFile.forEach((arr) => {
      // console.log(arr);
      // arr.forEach((page: PDFPage) => {
      //   finalDoc.addPage(page);
      // });
    });
  });

  return await finalDoc;
}

async function impositionSignatures(
  signature: Array<PDFPage>,
  pagesPerSignature: number
): Promise<Array<PDFPage | undefined>> {
  let toggle = false;
  const newDoc: (PDFPage | undefined)[] = [];
  for (let i = 0; i < pagesPerSignature / 2; i++) {
    if (toggle) {
      newDoc.push(signature.at(i));
      newDoc.push(signature.at(-i - 1));
    } else {
      newDoc.push(signature.at(-i - 1));
      newDoc.push(signature.at(i));
    }
    toggle = !toggle;
  }
  console.log(await newDoc);
  return await newDoc;
}

// To run from the cmd:
// deno run --allow-write --allow-read imposition.ts -i ./test/test-12.pdf -o test-12-output.pdf -p 3
// or
// deno run --allow-write --allow-read imposition.ts -i ./test/test-60.pdf -o test-60-output.pdf -p 3
