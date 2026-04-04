"""Round-trip tests: encode then decode, verify results."""

import tiktoken
from encoder import load_encoder, build_phrase_lengths, encode, normalise
from decoder import load_decoder, decode


def main():
    enc = tiktoken.get_encoding("cl100k_base")
    encode_map = load_encoder()
    phrase_lengths = build_phrase_lengths(encode_map)
    decode_map = load_decoder()

    tests = [
        (
            "clean input",
            "please generate a detailed report about our quarterly financial performance and provide a comprehensive summary of the following key metrics",
        ),
        (
            "contraction",
            "I'll analyze the following data and provide insights then summarize the following text in bullet points",
        ),
        (
            "extra spaces",
            "explain  in detail   how the following works",
        ),
        (
            "mixed case",
            "PLEASE GENERATE A DETAILED REPORT ABOUT the current situation",
        ),
        (
            "no match — should pass through unchanged",
            "the cat sat on the mat",
        ),
    ]

    for idx, (label, text) in enumerate(tests, 1):
        normalised = normalise(text)
        encoded_text, _ = encode(text, encode_map, phrase_lengths)
        decoded_text, unknowns = decode(encoded_text, decode_map)

        original_tokens = len(enc.encode(text))
        encoded_tokens = len(enc.encode(encoded_text))
        saved = original_tokens - encoded_tokens

        # Check if decoded output matches the normalised intent
        # (normalised is the fair comparison — we can't recover original casing/spacing)
        matches = decoded_text.strip().lower() == normalised.strip().lower()

        print(f"═══ Test {idx} ({label}) ═══")
        print(f"  Original input:   {text}")
        print(f"  Normalised input: {normalised}")
        print(f"  Encoded output:   {encoded_text}")
        print(f"  Decoded output:   {decoded_text}")
        print(f"  Original tokens:  {original_tokens}")
        print(f"  Encoded tokens:   {encoded_tokens}")
        print(f"  Tokens saved:     {saved}")
        print(f"  Decoded matches original intent: {'YES' if matches else 'NO'}")
        if unknowns > 0:
            print(f"  WARNING: {unknowns} unknown CJK character(s)")
        print()


if __name__ == "__main__":
    main()
