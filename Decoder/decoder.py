"""Decoder: converts CJK-compressed text back to English using dictionary.json."""

import json
import os
import tiktoken

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DICT_PATH = os.path.join(SCRIPT_DIR, "dictionary.json")


def load_decoder():
    """Load decode map from dictionary.json."""
    with open(DICT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["decode"]


def decode(text: str, decode_map: dict) -> tuple:
    """Decode a mixed CJK + English string back to natural English.

    Returns (decoded_text, unknown_count).
    """
    result = []
    unknown_count = 0
    i = 0

    while i < len(text):
        char = text[i]
        code = ord(char)

        if 0x4E00 <= code <= 0x9FFF:
            # CJK character — look it up
            if char in decode_map:
                # Add space before if previous output doesn't end with space
                if result and not result[-1].endswith(" "):
                    result.append(" ")
                result.append(decode_map[char])
            else:
                # Unknown CJK character
                if result and not result[-1].endswith(" "):
                    result.append(" ")
                result.append(f"[UNKNOWN:{char}]")
                unknown_count += 1
            i += 1
        elif char == " ":
            # Space between English words or at CJK/English boundary
            if result and not result[-1].endswith(" "):
                result.append(" ")
            i += 1
        else:
            # English text — collect the full word
            word_start = i
            while i < len(text) and text[i] != " " and not (0x4E00 <= ord(text[i]) <= 0x9FFF):
                i += 1
            word = text[word_start:i]
            if result and not result[-1].endswith(" "):
                result.append(" ")
            result.append(word)

    decoded = "".join(result).strip()

    # Clean up any double spaces
    while "  " in decoded:
        decoded = decoded.replace("  ", " ")

    return decoded, unknown_count


def main():
    decode_map = load_decoder()
    enc = tiktoken.get_encoding("cl100k_base")

    print(f"Decoder loaded: {len(decode_map)} mappings\n")

    # Test with some sample encoded strings
    test_inputs = [
        "一 our quarterly financial performance and 下 key metrics",
        "i will 万 then 三",
        "上",
        "一 the current situation",
        "the cat sat on the mat",
    ]

    for idx, text in enumerate(test_inputs, 1):
        decoded_text, unknowns = decode(text, decode_map)
        print(f"── Test {idx} ──")
        print(f"  Input:    {text}")
        print(f"  Decoded:  {decoded_text}")
        if unknowns > 0:
            print(f"  WARNING: {unknowns} unknown CJK character(s) encountered")
        print()


if __name__ == "__main__":
    main()
