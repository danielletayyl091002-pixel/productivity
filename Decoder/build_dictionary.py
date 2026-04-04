"""Build dictionary.json with 200 phrase-to-CJK mappings across 6 categories."""

import json
import tiktoken
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SAFE_CHARS_PATH = os.path.join(SCRIPT_DIR, "safe_chars.json")
DICT_PATH = os.path.join(SCRIPT_DIR, "dictionary.json")

# ── Category 1: Commands (50 entries) ──────────────────────────────────────

COMMANDS = [
    "please generate a",
    "analyze the following",
    "summarize this",
    "explain in detail",
    "provide a summary",
    "list all the",
    "describe the following",
    "write a detailed",
    "create a new",
    "give me a",
    "translate the following",
    "rewrite the following",
    "compare and contrast",
    "evaluate the following",
    "suggest improvements for",
    "identify the main",
    "extract the key",
    "classify the following",
    "predict the outcome",
    "optimize the following",
    "debug the following",
    "refactor the following",
    "review the following",
    "validate the following",
    "convert the following",
    "merge the following",
    "calculate the total",
    "find all instances",
    "check for errors",
    "remove all duplicates",
    "sort the results",
    "filter the results",
    "group the results",
    "update the existing",
    "delete the following",
    "insert the following",
    "replace all occurrences",
    "expand on the",
    "elaborate on the",
    "break down the",
    "walk me through",
    "help me understand",
    "show me how",
    "tell me about",
    "search for all",
    "count the number",
    "verify the accuracy",
    "confirm the following",
    "generate a report",
    "perform an analysis",
]

# ── Category 2: Multi-word phrases (50 entries) ───────────────────────────

MULTI_WORD = [
    "as soon as possible",
    "based on the above",
    "in order to",
    "as a result",
    "for example if",
    "on the other hand",
    "in addition to",
    "with respect to",
    "according to the",
    "as well as",
    "due to the",
    "in the context of",
    "prior to the",
    "in terms of",
    "at the same time",
    "on behalf of",
    "in response to",
    "with regard to",
    "as opposed to",
    "in conjunction with",
    "up to and including",
    "for the purpose of",
    "in the event of",
    "in the case of",
    "with the exception of",
    "in such a way",
    "to the extent that",
    "as a matter of",
    "in the absence of",
    "for the sake of",
    "in light of the",
    "at the end of",
    "in the form of",
    "on top of the",
    "in the middle of",
    "at the beginning of",
    "in the process of",
    "for the duration of",
    "by the end of",
    "at the time of",
    "from the perspective of",
    "to the best of",
    "in the interest of",
    "with the help of",
    "under the terms of",
    "in the same way",
    "at the expense of",
    "for the benefit of",
    "in the course of",
    "with the goal of",
]

# ── Category 3: Data fields (30 entries) ──────────────────────────────────

DATA_FIELDS = [
    "user ID:",
    "timestamp value:",
    "status code:",
    "priority level:",
    "error message:",
    "request body:",
    "response body:",
    "content type:",
    "file name:",
    "file path:",
    "created at:",
    "updated at:",
    "deleted at:",
    "session ID:",
    "transaction ID:",
    "account number:",
    "first name:",
    "last name:",
    "email address:",
    "phone number:",
    "IP address:",
    "API key:",
    "access token:",
    "refresh token:",
    "expiration date:",
    "start date:",
    "end date:",
    "total amount:",
    "unit price:",
    "quantity available:",
]

# ── Category 4: Output formats (30 entries) ───────────────────────────────

OUTPUT_FORMATS = [
    "return as JSON",
    "format as a table",
    "as bullet points",
    "numbered list",
    "return as CSV",
    "format as markdown",
    "plain text only",
    "as a code block",
    "in paragraph form",
    "as key-value pairs",
    "in XML format",
    "as a summary",
    "in YAML format",
    "as a diagram",
    "in a list",
    "step by step",
    "with line numbers",
    "in chronological order",
    "in alphabetical order",
    "grouped by category",
    "sorted by priority",
    "sorted by date",
    "with headers included",
    "with examples included",
    "in a single line",
    "as a nested structure",
    "with proper indentation",
    "separated by commas",
    "enclosed in brackets",
    "with proper formatting",
]

# ── Category 5: Grammar connectors (20 entries) ───────────────────────────

GRAMMAR_CONNECTORS = [
    "in addition to the",
    "as a result of",
    "in contrast to the",
    "regardless of the",
    "in spite of",
    "as long as",
    "even though the",
    "not only the",
    "rather than the",
    "as far as",
    "in case of",
    "other than the",
    "so that the",
    "such as the",
    "whether or not",
    "as much as",
    "insofar as the",
    "provided that the",
    "assuming that the",
    "given that the",
]

# ── Category 6: Question patterns (20 entries) ────────────────────────────

QUESTION_PATTERNS = [
    "what is the",
    "how do I",
    "can you explain",
    "what are the",
    "how does the",
    "why does the",
    "where can I",
    "when should I",
    "which one is",
    "who is responsible",
    "what happens when",
    "how can I",
    "is it possible to",
    "what would happen if",
    "how many times",
    "what is the difference between",
    "how do you",
    "can you provide",
    "what should I",
    "how would you",
]


def main():
    # Load safe characters
    with open(SAFE_CHARS_PATH, "r", encoding="utf-8") as f:
        safe_data = json.load(f)
    chars = safe_data["characters"]

    # Combine all phrases in category order
    all_phrases = (
        COMMANDS
        + MULTI_WORD
        + DATA_FIELDS
        + OUTPUT_FORMATS
        + GRAMMAR_CONNECTORS
        + QUESTION_PATTERNS
    )

    assert len(all_phrases) == 200, f"Expected 200 phrases, got {len(all_phrases)}"
    assert len(set(all_phrases)) == 200, "Duplicate phrases found!"
    assert len(chars) >= 200, f"Need 200 chars, only have {len(chars)}"

    # Load tokenizer for validation
    enc = tiktoken.get_encoding("cl100k_base")

    # Validate: every phrase must be 3+ tokens
    for phrase in all_phrases:
        token_count = len(enc.encode(phrase))
        assert token_count >= 3, f"Phrase '{phrase}' is only {token_count} token(s)"

    # Build bidirectional dictionary
    encode_map = {}
    decode_map = {}

    for i, phrase in enumerate(all_phrases):
        char = chars[i]
        encode_map[phrase] = char
        decode_map[char] = phrase

    assert len(encode_map) == 200
    assert len(decode_map) == 200  # confirms no duplicate CJK chars

    dictionary = {
        "metadata": {
            "version": "1.0",
            "totalEntries": 200,
            "categories": {
                "commands": 50,
                "multi_word_phrases": 50,
                "data_fields": 30,
                "output_formats": 30,
                "grammar_connectors": 20,
                "question_patterns": 20,
            },
        },
        "encode": encode_map,
        "decode": decode_map,
    }

    with open(DICT_PATH, "w", encoding="utf-8") as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)

    # ── Report ─────────────────────────────────────────────────────────────
    print("=== dictionary.json built successfully ===\n")
    print(f"Total entries: {len(encode_map)}")
    print(f"Unique CJK characters used: {len(decode_map)}")
    print(f"Duplicate CJK characters: {len(encode_map) - len(decode_map)}")
    print(f"Single-word entries: {sum(1 for p in all_phrases if len(p.split()) == 1)}")

    print("\n── 10 Sample Entries ──")
    samples = list(encode_map.items())[:10]
    for phrase, char in samples:
        original_tokens = len(enc.encode(phrase))
        print(
            f"  \"{phrase}\" → {char}  "
            f"({original_tokens} tokens → 1 token, saving {original_tokens - 1})"
        )

    print(f"\nOutput written to: {DICT_PATH}")


if __name__ == "__main__":
    main()
