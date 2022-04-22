# deno-imposition

## About

This script is for impositioning pages for printing books and magazines. You provide a PDF that contains all of the pages of the document and how many signatures you need in the final binding. The script then rearranges the pages in the PDF so that when printed two pages to a side, printed front and back, and folded over and nested to form a signature, all of the pages are in the correct order. Check the releases page to find prebuilt binaries for different platforms.

### To build your own binary for Windows, start from the project directory and use:

`deno compile --allow-write --allow-read --target x86_64-pc-windows-msvc --output deno-imposition.ps1 imposition.ts`

or for Linux

`deno compile --allow-write --allow-read --target x86_64-unknown-linux-gnu --output deno-imposition.sh imposition.ts`

or for MacOS

`deno compile --allow-write --allow-read --target x86_64-apple-darwin --output deno-imposition.sh imposition.ts`

or MacOS (ARM Processors)

`deno compile --allow-write --allow-read --target aarch64-apple-darwin --output deno-imposition.sh imposition.ts`

See the Deno documentation on how to build your own binary from this source code if you don't want to use one of the files provided.

### To run the binary, open powershell and navigate to the directory you downloaded the binary to, then use:

`./deno-imposition.ps1 -i path/to/document.pdf -o output-filename.pdf -p 3`

If you don't want to run this program's binary and would rather run it from the command line as a Deno project, see the details below.

### To run using Deno, start from the project directory and use:

`deno run --allow-write --allow-read imposition.ts path/to/document.pdf output-filename.pdf`

## Test PDFs

The repo contains a number of test PDFs that you can run the script on in order to see that it is functioning correctly. Each contains a different number of pages for testing various scenarios. See the arguments below on how to run this script on these test files. The resulting PDF will appear in the "output" folder in the repo

### To run against the test files using Deno, start from the project directory and use:

`deno run --allow-write --allow-read imposition.ts -i ./test/test-12.pdf -o test-12-output.pdf -p 3`

or

`deno run --allow-write --allow-read imposition.ts -i ./test/test-60.pdf -o test-60-output.pdf -p 3`

or

`deno run --allow-write --allow-read imposition.ts -i ./test/test-103.pdf -o test-103-output.pdf -p 3`
