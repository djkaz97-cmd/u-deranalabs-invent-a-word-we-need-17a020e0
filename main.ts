/**
 * make.fun — "Invent a Word We Need" (u-deranalabs-invent-a-word-we-need-17a020e0)
 *
 * Writes the whole entry to $MAKEFUN_OUTPUT_DIR/entry.txt: one coined English
 * word, a part of speech and one self-contained definition, on a single line
 * with no trailing newline. Node 22.18+ runs this TypeScript directly; there
 * is no package.json, so it is plain CommonJS.
 */
const fs = require("node:fs");
const path = require("node:path");

// The entry itself. Plain string constant: every run writes these exact bytes.
const LINE =
  "crumbrage (n.) — the quiet fury of finding toast crumbs in the butter everyone shares.";

// Local mirror of the sealed gate: the gate counts characters (code points),
// not bytes, so a refusal here has to name the same measure.
function reject(reason: string): never {
  console.error(`entry.txt refused locally: ${reason}`);
  process.exit(1);
  throw new Error("unreachable");
}

const codePoints = [...LINE].length;
if (codePoints < 1 || codePoints > 140) {
  reject(`the gate takes 1 to 140 characters (code points); this entry has ${codePoints}`);
}
if (LINE.trim() === "") reject("the gate refuses text that is only white space");
if (/[\r\n]/.test(LINE)) reject("one line only: the entry carries no carriage return or newline");
if (/[\u0000-\u001f\u007f]/.test(LINE)) reject("no control characters: the entry is printable text");
if (LINE !== LINE.trim()) reject("no leading or trailing white space in the entry");

// The entry is a word plus a definition, not a phrase or a bare word.
const [headword, definition, ...rest] = LINE.split(" — ");
if (!headword || !definition || rest.length > 0) {
  reject("expected exactly one 'word (n.) — definition' split");
}
if (!/^[a-z]+ \(n\.\)$/.test(headword)) reject("headword must be one lowercase word");
if (definition.length < 20) reject("definition is too short to land in one reading");

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "entry.txt");
fs.writeFileSync(outFile, Buffer.from(LINE, "utf8"));

// Read back and compare bytes: the file must be exactly the entry, nothing else.
const expected = Buffer.from(LINE, "utf8");
const written = fs.readFileSync(outFile);
if (!Buffer.isBuffer(written) || !written.equals(expected)) {
  reject("read-back bytes differ from the entry");
}
const lastByte = written[written.length - 1];
if (lastByte === 0x0a || lastByte === 0x0d) reject("file ends with a newline byte");
if (written.toString("utf8") !== LINE) reject("the file does not decode back to the entry");

// Second run of the same write: the grader runs the program twice, so a rerun
// must land the exact same bytes on disk.
const firstRun = fs.readFileSync(outFile);
fs.writeFileSync(outFile, Buffer.from(LINE, "utf8"));
const secondRun = fs.readFileSync(outFile);
if (!secondRun.equals(firstRun)) reject("a second run changed the bytes on disk");

console.log(
  `wrote ${outFile}: ${codePoints} code points, ${written.length} bytes, no trailing newline; rerun is byte-identical`,
);
