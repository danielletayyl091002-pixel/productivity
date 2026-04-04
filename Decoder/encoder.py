"""Encoder: converts English text to CJK-compressed form using dictionary.json."""

import json
import os
import re
import tiktoken

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DICT_PATH = os.path.join(SCRIPT_DIR, "dictionary.json")

# ── Contraction expansions ────────────────────────────────────────────────

CONTRACTIONS = {
    "don't": "do not",
    "i'll": "i will",
    "won't": "will not",
    "can't": "cannot",
    "i'm": "i am",
    "it's": "it is",
    "that's": "that is",
    "there's": "there is",
    "we're": "we are",
    "you're": "you are",
    "doesn't": "does not",
    "didn't": "did not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "hasn't": "has not",
    "haven't": "have not",
    "couldn't": "could not",
    "wouldn't": "would not",
    "shouldn't": "should not",
    "let's": "let us",
    "they're": "they are",
    "we'll": "we will",
    "you'll": "you will",
    "they'll": "they will",
    "he's": "he is",
    "she's": "she is",
    "who's": "who is",
    "what's": "what is",
}


def normalise(text: str) -> str:
    """Pre-process input text before matching."""
    # 1. Lowercase
    text = text.lower()

    # 2. Expand contractions (must happen before punctuation stripping)
    # Use word-boundary matching to avoid partial replacements
    for contraction, expansion in CONTRACTIONS.items():
        text = re.sub(r'\b' + re.escape(contraction) + r'\b', expansion, text)

    # 3. Strip leading/trailing punctuation from the full input
    text = text.strip()
    text = re.sub(r'^[^\w\s]+', '', text)
    text = re.sub(r'[^\w\s]+$', '', text)

    # 4. Collapse duplicate/extra whitespace
    text = re.sub(r'\s+', ' ', text)

    # 5. Final trim
    text = text.strip()

    return text


def load_encoder():
    """Load encode map from dictionary.json, keyed by lowercase phrase."""
    with open(DICT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Store phrases lowercased for case-insensitive matching
    encode_map = {}
    for phrase, char in data["encode"].items():
        encode_map[phrase.lower()] = char

    return encode_map


def build_phrase_lengths(encode_map: dict) -> list:
    """Get sorted list of unique phrase word-counts, longest first."""
    lengths = sorted(set(len(p.split()) for p in encode_map), reverse=True)
    return lengths


def encode(text: str, encode_map: dict, phrase_lengths: list) -> str:
    """Encode text using greedy longest-match against the dictionary."""
    normalised = normalise(text)
    words = normalised.split()
    result = []
    i = 0

    while i < len(words):
        matched = False

        # Try longest phrase first, then shorter
        for length in phrase_lengths:
            if i + length > len(words):
                continue

            candidate = " ".join(words[i:i + length])

            if candidate in encode_map:
                result.append(encode_map[candidate])
                i += length
                matched = True
                break

        if not matched:
            # No match — pass through as plain English
            result.append(words[i])
            i += 1

    # Join: CJK characters get no space between them,
    # but English words need spaces, and transitions need spaces
    output_parts = []
    for part in result:
        if len(part) == 1 and ord(part) >= 0x4E00 and ord(part) <= 0x9FFF:
            # CJK character — no leading space if previous was also CJK
            if output_parts and len(output_parts[-1]) == 1 and ord(output_parts[-1]) >= 0x4E00:
                output_parts.append(part)
            else:
                output_parts.append(part)
        else:
            output_parts.append(part)

    # Build final string with proper spacing
    final = []
    for part in output_parts:
        is_cjk = len(part) == 1 and 0x4E00 <= ord(part) <= 0x9FFF
        if not final:
            final.append(part)
        else:
            prev = final[-1]
            prev_is_cjk = len(prev) == 1 and 0x4E00 <= ord(prev) <= 0x9FFF
            if is_cjk and prev_is_cjk:
                # CJK after CJK — no space
                final.append(part)
            else:
                # All other transitions get a space
                final.append(" ")
                final.append(part)

    return "".join(final), normalised


def main():
    enc = tiktoken.get_encoding("cl100k_base")
    encode_map = load_encoder()
    phrase_lengths = build_phrase_lengths(encode_map)

    print(f"Encoder loaded: {len(encode_map)} phrases")
    print(f"Phrase lengths (word counts): {phrase_lengths}\n")

    test_inputs = [
        "please generate a detailed report about our quarterly financial performance and provide a comprehensive summary of the following key metrics",
        "I'll analyze the following data and provide insights then summarize the following text in bullet points",
        "explain  in detail   how the following works",
        "PLEASE GENERATE A DETAILED REPORT ABOUT the current situation",
        "the cat sat on the mat",
    ]

    for idx, text in enumerate(test_inputs, 1):
        encoded_text, normalised = encode(text, encode_map, phrase_lengths)
        original_tokens = len(enc.encode(text))
        encoded_tokens = len(enc.encode(encoded_text))
        saved = original_tokens - encoded_tokens

        print(f"── Test {idx} ──")
        print(f"  Original:   {text}")
        print(f"  Normalised: {normalised}")
        print(f"  Encoded:    {encoded_text}")
        print(f"  Tokens:     {original_tokens} → {encoded_tokens} (saved {saved})")
        ratio = (1 - encoded_tokens / original_tokens) * 100 if original_tokens > 0 else 0
        print(f"  Compression: {ratio:.1f}%")
        print()


if __name__ == "__main__":
    main()
