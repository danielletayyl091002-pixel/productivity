import { get_encoding } from "tiktoken";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "safe_chars.json");

const CJK_START = 0x4e00;
const CJK_END = 0x9fff;
const MAX_SAVED = 500;

function main() {
  console.log("Loading cl100k_base encoding...");
  const enc = get_encoding("cl100k_base");

  const safeChars: string[] = [];
  const totalTested = CJK_END - CJK_START + 1;

  console.log(`Testing ${totalTested} CJK characters (U+4E00 to U+9FFF)...`);

  for (let codePoint = CJK_START; codePoint <= CJK_END; codePoint++) {
    const char = String.fromCodePoint(codePoint);
    const tokens = enc.encode(char);

    if (tokens.length === 1) {
      safeChars.push(char);
    }
  }

  enc.free();

  const output = {
    encoding: "cl100k_base",
    totalTested,
    totalSafeFound: safeChars.length,
    savedCount: Math.min(MAX_SAVED, safeChars.length),
    generatedAt: new Date().toISOString(),
    characters: safeChars.slice(0, MAX_SAVED),
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Total characters tested: ${totalTested}`);
  console.log(`Total single-token characters found: ${safeChars.length}`);
  console.log(`Characters saved to safe_chars.json: ${output.savedCount}`);
  console.log(`First 10 safe characters: ${safeChars.slice(0, 10).join(" ")}`);
  console.log(`\nOutput written to: ${OUTPUT_PATH}`);
}

main();
