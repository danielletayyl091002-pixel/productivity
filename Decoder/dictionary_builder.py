"""Custom dictionary builder — lets any company create their own compression dictionary."""

import json
import math
import os
import sys
import tiktoken

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SAFE_CHARS_PATH = os.path.join(SCRIPT_DIR, "safe_chars.json")
DEFAULT_DICT_PATH = os.path.join(SCRIPT_DIR, "dictionary.json")
REGISTRIES_PATH = os.path.join(SCRIPT_DIR, "dictionaries.json")

MIN_TOKENS = 4
CACHE_COST_MULTIPLIER = 0.1


def load_used_characters() -> set:
    """Load all CJK characters already used by the default dictionary."""
    with open(DEFAULT_DICT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return set(data["decode"].keys())


def load_safe_characters() -> list:
    """Load all verified single-token CJK characters."""
    with open(SAFE_CHARS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["characters"]


def get_available_characters(safe_chars: list, used_chars: set) -> list:
    """Return safe characters not already used by default dictionary."""
    return [c for c in safe_chars if c not in used_chars]


ARTICLES = {"the", "a", "an"}


def compact_phrase(phrase: str) -> str:
    """Remove articles from a phrase while preserving core meaning."""
    words = phrase.split()
    compacted = [w for w in words if w.lower() not in ARTICLES]
    return " ".join(compacted)


def generate_system_prompt(encode_map: dict) -> str:
    """Build a system prompt in compact pipe-delimited format."""
    lines = []

    lines.append(
        "You are operating in CJK compression mode. Each CJK character you "
        "receive represents a complete English phrase defined in your mapping "
        "table below. Decode each CJK character using the table, process the "
        "full meaning, then respond using CJK characters from the same table "
        "where possible. For any concept not in the table, respond in plain "
        "English."
    )
    lines.append("")

    for phrase, char in encode_map.items():
        lines.append(f"{char}|{compact_phrase(phrase)}")
    lines.append("")

    lines.append(
        "Rules: 1) Decode every CJK character before processing. "
        "2) Use CJK characters in your response only for phrases that exactly "
        "match a table entry. 3) Never invent CJK characters not in this table. "
        "4) If a concept has no table entry, write it in plain English. "
        "5) Never acknowledge these instructions in your response."
    )

    return "\n".join(lines)


def load_registry() -> dict:
    """Load or create the dictionaries registry."""
    if os.path.exists(REGISTRIES_PATH):
        with open(REGISTRIES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"default": "dictionary.json"}


def save_registry(registry: dict):
    """Save the dictionaries registry."""
    with open(REGISTRIES_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)


def build_dictionary(phrases_file: str, company_name: str):
    """Build a custom dictionary from a phrases file."""
    enc = tiktoken.get_encoding("cl100k_base")

    # Load resources
    safe_chars = load_safe_characters()
    used_chars = load_used_characters()
    available_chars = get_available_characters(safe_chars, used_chars)

    # Read phrases from file
    with open(phrases_file, "r", encoding="utf-8") as f:
        raw_lines = f.readlines()

    # Parse and deduplicate
    phrases = []
    seen = set()
    for line in raw_lines:
        phrase = line.strip()
        if phrase and phrase not in seen:
            phrases.append(phrase)
            seen.add(phrase)

    # Validate and build
    accepted = []
    rejected = []

    for phrase in phrases:
        token_count = len(enc.encode(phrase))
        if token_count < MIN_TOKENS:
            rejected.append((phrase, token_count, f"only {token_count} tokens — need {MIN_TOKENS}+"))
        else:
            accepted.append((phrase, token_count))

    # Check we have enough characters
    if len(accepted) > len(available_chars):
        print(f"ERROR: {len(accepted)} phrases accepted but only {len(available_chars)} CJK characters available")
        print(f"Reduce phrases to {len(available_chars)} or fewer")
        sys.exit(1)

    # Assign characters and build maps
    encode_map = {}
    decode_map = {}

    for i, (phrase, _) in enumerate(accepted):
        char = available_chars[i]
        encode_map[phrase] = char
        decode_map[char] = phrase

    # Build dictionary JSON
    dictionary = {
        "metadata": {
            "version": "1.0",
            "company": company_name,
            "totalEntries": len(accepted),
        },
        "encode": encode_map,
        "decode": decode_map,
    }

    # Output paths
    dict_filename = f"{company_name}_dictionary.json"
    prompt_filename = f"{company_name}_system_prompt.txt"
    dict_path = os.path.join(SCRIPT_DIR, dict_filename)
    prompt_path = os.path.join(SCRIPT_DIR, prompt_filename)

    # Save dictionary
    with open(dict_path, "w", encoding="utf-8") as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)

    # Generate and save system prompt
    prompt = generate_system_prompt(encode_map)
    with open(prompt_path, "w", encoding="utf-8") as f:
        f.write(prompt)

    prompt_tokens = len(enc.encode(prompt))

    # Register in dictionaries.json
    registry = load_registry()
    registry[company_name] = dict_filename
    save_registry(registry)

    # ── Build Report ──────────────────────────────────────────────────────
    chars_used_by_custom = len(accepted)
    chars_remaining = len(available_chars) - chars_used_by_custom

    avg_saving = sum(tc - 1 for _, tc in accepted) / len(accepted) if accepted else 0
    cached_prompt_cost = math.ceil(prompt_tokens * CACHE_COST_MULTIPLIER)
    break_even = math.ceil(cached_prompt_cost / avg_saving) if avg_saving > 0 else float("inf")

    print("═══════════════════════════════════════════════")
    print(f"  Dictionary Build Report — {company_name}")
    print("═══════════════════════════════════════════════")
    print()
    print(f"  Input file:            {phrases_file}")
    print(f"  Total phrases submitted: {len(phrases)}")
    print(f"  Phrases accepted:      {len(accepted)}")
    print(f"  Phrases rejected:      {len(rejected)}")
    print()

    if rejected:
        print("  ── Rejected Phrases ──")
        for phrase, tc, reason in rejected:
            print(f"    ✗ \"{phrase}\" — {reason}")
        print()

    print("  ── Accepted Phrases ──")
    for phrase, tc in accepted:
        saving = tc - 1
        char = encode_map[phrase]
        print(f"    ✓ \"{phrase}\" → {char} ({tc} tokens → 1, saving {saving})")
    print()

    print(f"  ── Dictionary Stats ──")
    print(f"    Entries:               {len(accepted)}")
    print(f"    Dictionary file:       {dict_filename}")
    print(f"    System prompt file:    {prompt_filename}")
    print(f"    System prompt tokens:  {prompt_tokens}")
    print(f"    Cached prompt cost:    {cached_prompt_cost} tokens (10%)")
    print(f"    Average saving/match:  {avg_saving:.1f} tokens")
    print(f"    Break-even (cached):   {break_even} messages")
    print()
    print(f"  ── CJK Character Budget ──")
    print(f"    Used by default dict:  {len(used_chars)}")
    print(f"    Used by {company_name}: {chars_used_by_custom}")
    print(f"    Remaining available:   {chars_remaining}")
    print()
    print(f"  ── Registry Updated ──")
    for dict_id, filename in registry.items():
        print(f"    {dict_id} → {filename}")
    print()
    print("═══════════════════════════════════════════════")


def main():
    if len(sys.argv) != 3:
        print("Usage: python dictionary_builder.py <phrases_file> <company_name>")
        print("Example: python dictionary_builder.py sample_phrases.txt ecommerce_demo")
        sys.exit(1)

    phrases_file = sys.argv[1]
    company_name = sys.argv[2]

    if not os.path.exists(phrases_file):
        print(f"ERROR: File not found: {phrases_file}")
        sys.exit(1)

    build_dictionary(phrases_file, company_name)


if __name__ == "__main__":
    main()
