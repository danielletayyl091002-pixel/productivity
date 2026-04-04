"""Calculates whether CJK compression is worth using for a given scenario."""

import math
import tiktoken
from encoder import load_encoder, build_phrase_lengths, encode


def calculate_efficiency(
    input_text: str,
    conversation_length: int,
    system_prompt_tokens: int,
    encode_map: dict,
    phrase_lengths: list,
    enc: tiktoken.Encoding,
) -> dict:
    """Calculate compression efficiency for a given scenario.

    Returns a dict with all metrics and a recommendation.
    """
    # Encode the input
    encoded_text, normalised = encode(input_text, encode_map, phrase_lengths)

    original_tokens = len(enc.encode(input_text))
    encoded_tokens = len(enc.encode(encoded_text))
    tokens_saved_per_message = original_tokens - encoded_tokens

    # Calculate totals
    total_savings = tokens_saved_per_message * conversation_length
    total_cost = system_prompt_tokens  # paid once, cached after first use
    net_saving = total_savings - total_cost

    # Break-even calculation
    if tokens_saved_per_message > 0:
        break_even_messages = math.ceil(total_cost / tokens_saved_per_message)
    else:
        break_even_messages = float("inf")

    # Recommendation
    recommendation = "ENCODE" if net_saving > 0 else "SEND PLAIN ENGLISH"

    return {
        "input_text": input_text,
        "normalised_text": normalised,
        "encoded_text": encoded_text,
        "original_tokens_per_msg": original_tokens,
        "encoded_tokens_per_msg": encoded_tokens,
        "tokens_saved_per_msg": tokens_saved_per_message,
        "conversation_length": conversation_length,
        "total_savings": total_savings,
        "system_prompt_tokens": system_prompt_tokens,
        "net_saving": net_saving,
        "break_even_messages": break_even_messages,
        "recommendation": recommendation,
    }


def print_report(label: str, result: dict):
    """Print a formatted efficiency report."""
    print(f"═══ {label} ═══")
    print(f"  Input:                  {result['input_text']}")
    print(f"  Encoded:                {result['encoded_text']}")
    print(f"  Tokens per message:     {result['original_tokens_per_msg']} → {result['encoded_tokens_per_msg']} (saving {result['tokens_saved_per_msg']})")
    print(f"  Conversation length:    {result['conversation_length']} messages")
    print(f"  Total token savings:    {result['total_savings']}")
    print(f"  System prompt cost:     {result['system_prompt_tokens']} (paid once, cached)")
    print(f"  Net saving:             {result['net_saving']}")
    be = result["break_even_messages"]
    print(f"  Break-even at:          {be} messages" if be != float("inf") else "  Break-even at:          never (no tokens saved per message)")
    print(f"  ➤ Recommendation:       {result['recommendation']}")
    print()


def main():
    enc = tiktoken.get_encoding("cl100k_base")
    encode_map = load_encoder()
    phrase_lengths = build_phrase_lengths(encode_map)

    # System prompt token count from prompt_generator
    system_prompt_tokens = 3579

    scenarios = [
        (
            "Scenario A — Short conversation (5 messages)",
            "please generate a detailed report about sales",
            5,
        ),
        (
            "Scenario B — Medium conversation (50 messages)",
            "analyze the following data and provide insights then summarize the following text in bullet points",
            50,
        ),
        (
            "Scenario C — Long API batch job (500 messages)",
            "please generate a detailed report about quarterly performance and provide a comprehensive summary of the following key metrics and list all the key points from the following",
            500,
        ),
    ]

    print("=== CJK Compression Efficiency Calculator ===\n")
    print(f"System prompt tokens: {system_prompt_tokens} (cached after first use)\n")

    for label, input_text, conv_length in scenarios:
        result = calculate_efficiency(
            input_text, conv_length, system_prompt_tokens,
            encode_map, phrase_lengths, enc,
        )
        print_report(label, result)


if __name__ == "__main__":
    main()
