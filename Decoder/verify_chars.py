import tiktoken
import json
import os
from datetime import datetime, timezone

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "safe_chars.json")

CJK_START = 0x4E00
CJK_END = 0x9FFF
MAX_SAVED = 500


def main():
    print("Loading cl100k_base encoding...")
    enc = tiktoken.get_encoding("cl100k_base")

    safe_chars = []
    total_tested = CJK_END - CJK_START + 1

    print(f"Testing {total_tested} CJK characters (U+4E00 to U+9FFF)...")

    for code_point in range(CJK_START, CJK_END + 1):
        char = chr(code_point)
        tokens = enc.encode(char)

        if len(tokens) == 1:
            safe_chars.append(char)

    saved_count = min(MAX_SAVED, len(safe_chars))

    output = {
        "encoding": "cl100k_base",
        "totalTested": total_tested,
        "totalSafeFound": len(safe_chars),
        "savedCount": saved_count,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "characters": safe_chars[:MAX_SAVED],
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\n=== Summary ===")
    print(f"Total characters tested: {total_tested}")
    print(f"Total single-token characters found: {len(safe_chars)}")
    print(f"Characters saved to safe_chars.json: {saved_count}")
    print(f"First 10 safe characters: {' '.join(safe_chars[:10])}")
    print(f"\nOutput written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
