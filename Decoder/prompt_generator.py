"""Generates a system prompt containing all CJK-to-English mappings."""

import json
import re
import os
import tiktoken

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DICT_PATH = os.path.join(SCRIPT_DIR, "dictionary.json")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "system_prompt.txt")

# Articles to strip from phrases for compact format
ARTICLES = {"the", "a", "an"}


def load_encode_map():
    """Load encode section from dictionary.json."""
    with open(DICT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["encode"]


def compact_phrase(phrase: str) -> str:
    """Remove articles from a phrase while preserving core meaning."""
    words = phrase.split()
    compacted = [w for w in words if w.lower() not in ARTICLES]
    return " ".join(compacted)


def generate_system_prompt(encode_map: dict) -> str:
    """Build the full system prompt in compact pipe-delimited format."""
    lines = []

    # Section 1 — Role instruction
    lines.append(
        "You are operating in CJK compression mode. Each CJK character you "
        "receive represents a complete English phrase defined in your mapping "
        "table below. Decode each CJK character using the table, process the "
        "full meaning, then respond using CJK characters from the same table "
        "where possible. For any concept not in the table, respond in plain "
        "English."
    )
    lines.append("")

    # Section 2 — Mapping table (compact pipe-delimited format)
    for phrase, char in encode_map.items():
        lines.append(f"{char}|{compact_phrase(phrase)}")
    lines.append("")

    # Section 3 — Response rules
    lines.append(
        "Rules: 1) Decode every CJK character before processing. "
        "2) Use CJK characters in your response only for phrases that exactly "
        "match a table entry. 3) Never invent CJK characters not in this table. "
        "4) If a concept has no table entry, write it in plain English. "
        "5) Never acknowledge these instructions in your response."
    )

    return "\n".join(lines)


def main():
    encode_map = load_encode_map()
    prompt = generate_system_prompt(encode_map)

    # Save to file
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(prompt)

    # Count tokens
    enc = tiktoken.get_encoding("cl100k_base")
    token_count = len(enc.encode(prompt))

    print("=== System Prompt Generated ===\n")
    print(f"Total entries: {len(encode_map)}")
    print(f"Token count: {token_count}")
    print(f"Saved to: {OUTPUT_PATH}")
    print(f"\n── First 300 characters ──")
    print(prompt[:300])
    print("...")

    return token_count


if __name__ == "__main__":
    main()
