"""Build dictionary.json with 200 phrase-to-CJK mappings across 6 categories."""

import json
import tiktoken
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SAFE_CHARS_PATH = os.path.join(SCRIPT_DIR, "safe_chars.json")
DICT_PATH = os.path.join(SCRIPT_DIR, "dictionary.json")

# ── Category 1: Commands (50 entries) ──────────────────────────────────────

COMMANDS = [
    "please generate a detailed report about",
    "analyze the following data and provide insights",
    "summarize the following text in bullet points",
    "explain in detail how the following works",
    "provide a comprehensive summary of the following",
    "list all the key points from the following",
    "describe the following in simple terms",
    "write a detailed summary of the following",
    "create a new function that handles",
    "give me a step by step explanation of",
    "translate the following text into English",
    "rewrite the following to be more concise",
    "compare and contrast the following two approaches",
    "evaluate the following code for potential issues",
    "suggest improvements for the following implementation",
    "identify the main issues in the following",
    "extract the key information from the following",
    "classify the following items into categories",
    "predict the likely outcome based on the following",
    "optimize the following code for better performance",
    "debug the following code and explain the fix",
    "refactor the following code to improve readability",
    "review the following code and suggest changes",
    "validate the following input against the schema",
    "convert the following data into the specified format",
    "merge the following datasets into a single result",
    "calculate the total cost based on the following",
    "find all instances of the following pattern in",
    "check for errors in the following code block",
    "remove all duplicate entries from the following",
    "sort the results by the following criteria",
    "filter the results based on the following conditions",
    "group the results by category and summarize",
    "update the existing record with the following data",
    "delete the following entries from the database",
    "insert the following records into the database",
    "replace all occurrences of the following pattern",
    "expand on the following points in more detail",
    "elaborate on the following topic with examples",
    "break down the following into smaller components",
    "walk me through the steps to complete this",
    "help me understand how this works in detail",
    "show me how to implement the following feature",
    "tell me about the best practices for this",
    "search for all matching records in the database",
    "count the number of occurrences in the following",
    "verify the accuracy of the following information",
    "confirm that the following meets the requirements",
    "generate a comprehensive report based on this data",
    "perform a detailed analysis of the following data",
]

# ── Category 2: Multi-word phrases (50 entries) ───────────────────────────

MULTI_WORD = [
    "as soon as possible",
    "based on the information provided above",
    "in order to achieve the desired result",
    "as a result of the previous operation",
    "for example if the input contains",
    "on the other hand if we consider",
    "in addition to the above requirements",
    "with respect to the current implementation",
    "according to the official documentation",
    "as well as any additional parameters",
    "due to the following constraints",
    "in the context of this specific use case",
    "prior to executing the following operation",
    "in terms of performance and scalability",
    "at the same time ensuring that",
    "on behalf of the authenticated user",
    "in response to the previous request",
    "with regard to the specified requirements",
    "as opposed to the alternative approach",
    "in conjunction with the existing system",
    "up to and including the final step",
    "for the purpose of this analysis",
    "in the event of an error occurring",
    "in the case of an invalid input",
    "with the exception of the following items",
    "in such a way that the output",
    "to the extent that it is possible",
    "as a matter of best practice",
    "in the absence of any explicit configuration",
    "for the sake of clarity and completeness",
    "in light of the recent changes to",
    "at the end of the processing pipeline",
    "in the form of a structured response",
    "on top of the existing functionality",
    "in the middle of the current transaction",
    "at the beginning of each new session",
    "in the process of being updated",
    "for the duration of the active session",
    "by the end of the current iteration",
    "at the time of the initial request",
    "from the perspective of the end user",
    "to the best of my knowledge",
    "in the interest of maintaining consistency",
    "with the help of the following utility",
    "under the terms of the current agreement",
    "in the same way as the previous example",
    "at the expense of additional complexity",
    "for the benefit of future maintainability",
    "in the course of normal operation",
    "with the goal of improving overall performance",
]

# ── Category 3: Data fields (30 entries) ──────────────────────────────────

DATA_FIELDS = [
    "the user ID for this request is",
    "the timestamp of the event is",
    "the HTTP status code returned was",
    "the priority level is set to",
    "the error message returned was",
    "the request body contains the following",
    "the response body includes the following",
    "the content type of the response is",
    "the file name for this resource is",
    "the file path to the resource is",
    "the record was created at",
    "the record was last updated at",
    "the record was deleted at",
    "the session ID for this connection is",
    "the transaction ID for this operation is",
    "the account number associated with this is",
    "the first name of the user is",
    "the last name of the user is",
    "the email address on file is",
    "the phone number on record is",
    "the IP address of the client is",
    "the API key for authentication is",
    "the access token for this session is",
    "the refresh token for renewal is",
    "the expiration date for this token is",
    "the start date of the period is",
    "the end date of the period is",
    "the total amount for this transaction is",
    "the unit price of this item is",
    "the quantity currently available is",
]

# ── Category 4: Output formats (30 entries) ───────────────────────────────

OUTPUT_FORMATS = [
    "return the result as a JSON object",
    "format the output as a markdown table",
    "present the results as bullet points",
    "return the output as a numbered list",
    "return the result as CSV formatted data",
    "format the entire response in markdown",
    "return the result as plain text only",
    "wrap the output in a code block",
    "write the response in paragraph form",
    "return the data as key-value pairs",
    "format the output as valid XML",
    "provide a brief summary of the results",
    "format the output as valid YAML",
    "represent this visually as a diagram",
    "return the items in a bulleted list",
    "explain this step by step with examples",
    "include line numbers in the output",
    "sort the output in chronological order",
    "sort the output in alphabetical order",
    "group the results by their category",
    "sort the results by priority level",
    "sort the results by date created",
    "include column headers in the output",
    "include relevant examples in the response",
    "return the entire result on a single line",
    "return the data as a nested JSON structure",
    "use consistent indentation throughout the output",
    "separate each value with a comma delimiter",
    "enclose each value in square brackets",
    "apply proper formatting to the entire output",
]

# ── Category 5: Grammar connectors (20 entries) ───────────────────────────

GRAMMAR_CONNECTORS = [
    "in addition to the requirements listed above",
    "as a direct result of the previous action",
    "in contrast to the previous approach where",
    "regardless of the outcome of the operation",
    "in spite of the limitations described above",
    "as long as the following conditions are met",
    "even though the previous attempt failed because",
    "not only does this apply to the current",
    "rather than using the default behavior",
    "as far as the current implementation is concerned",
    "in case of an unexpected failure during",
    "other than the exceptions noted above",
    "so that the final output matches the expected",
    "such as the examples provided in the documentation",
    "whether or not the operation was successful",
    "as much as possible while maintaining accuracy",
    "insofar as the available data allows for",
    "provided that the input data is valid",
    "assuming that the initial configuration is correct",
    "given that the following constraints apply",
]

# ── Category 6: Question patterns (20 entries) ────────────────────────────

QUESTION_PATTERNS = [
    "what is the best way to handle",
    "how do I implement this feature in",
    "can you explain how this works in detail",
    "what are the main differences between these",
    "how does this compare to the alternative",
    "why does this return an error when",
    "where can I find the documentation for",
    "when should I use this instead of",
    "which approach is the most efficient for",
    "who is responsible for maintaining this component",
    "what happens when the input is invalid",
    "how can I improve the performance of",
    "is it possible to achieve this without",
    "what would happen if we changed the",
    "how many times should this retry before failing",
    "what is the difference between these two approaches",
    "how do you recommend handling this edge case",
    "can you provide a working example of",
    "what should I consider before implementing this",
    "how would you approach solving this problem",
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

    # Validate: every phrase must be 4+ tokens (minimum 3 token saving)
    for phrase in all_phrases:
        token_count = len(enc.encode(phrase))
        assert token_count >= 4, f"Phrase '{phrase}' is only {token_count} token(s) — need 4+"

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
    all_savings = []
    for phrase in all_phrases:
        all_savings.append(len(enc.encode(phrase)) - 1)

    print("=== dictionary.json built successfully ===\n")
    print(f"Total entries: {len(encode_map)}")
    print(f"Unique CJK characters used: {len(decode_map)}")
    print(f"Duplicate CJK characters: {len(encode_map) - len(decode_map)}")
    print(f"Single-word entries: {sum(1 for p in all_phrases if len(p.split()) == 1)}")
    print(f"Minimum token saving: {min(all_savings)}")
    print(f"Maximum token saving: {max(all_savings)}")
    print(f"Average token saving: {sum(all_savings) / len(all_savings):.1f}")

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
