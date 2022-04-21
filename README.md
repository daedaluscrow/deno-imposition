To run using Deno:

deno run --allow-write --allow-read imposition.ts path/to/document.pdf output-filename.pdf

The repo contains a number of test PDFs that you can run the script on in order to see that it is functioning correctly. Each contains a different number of pages for testing various scenarios. See the arguments below on how to run this script on these test files. The resulting PDF will appear in the "output" folder in the repo

To run from the cmd, start from the project directory and use:
deno run --allow-write --allow-read imposition.ts -i ./test/test-12.pdf -o test-12-output.pdf -p 3
or
deno run --allow-write --allow-read imposition.ts -i ./test/test-60.pdf -o test-60-output.pdf -p 3
or
deno run --allow-write --allow-read imposition.ts -i ./test/test-103.pdf -o test-103-output.pdf -p 3
