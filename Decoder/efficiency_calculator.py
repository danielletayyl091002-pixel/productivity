"""Calculates whether CJK compression is worth using for a given scenario."""

import math
import tiktoken
from encoder import load_encoder, build_phrase_lengths, encode

CACHE_COST_MULTIPLIER = 0.1  # Cached reads are 10% of full token price


def calculate_efficiency(
    input_text: str,
    conversation_length: int,
    system_prompt_tokens: int,
    encode_map: dict,
    phrase_lengths: list,
    enc: tiktoken.Encoding,
    use_caching: bool = True,
) -> dict:
    """Calculate compression efficiency for a given scenario.

    When use_caching=True, system prompt cost is 10% of full token count
    (Anthropic prompt caching — cached reads after first call).
    When use_caching=False, system prompt cost is the full token count.

    Returns a dict with all metrics and a recommendation.
    """
    # Encode the input
    encoded_text, normalised = encode(input_text, encode_map, phrase_lengths)

    original_tokens = len(enc.encode(input_text))
    encoded_tokens = len(enc.encode(encoded_text))
    tokens_saved_per_message = original_tokens - encoded_tokens

    # System prompt effective cost
    if use_caching:
        effective_prompt_cost = math.ceil(system_prompt_tokens * CACHE_COST_MULTIPLIER)
    else:
        effective_prompt_cost = system_prompt_tokens

    # Calculate totals
    total_savings = tokens_saved_per_message * conversation_length
    net_saving = total_savings - effective_prompt_cost

    # Break-even calculation
    if tokens_saved_per_message > 0:
        break_even_messages = math.ceil(effective_prompt_cost / tokens_saved_per_message)
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
        "effective_prompt_cost": effective_prompt_cost,
        "use_caching": use_caching,
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
    caching_label = "cached at 10%" if result["use_caching"] else "full cost"
    print(f"  System prompt:          {result['system_prompt_tokens']} tokens ({caching_label} = {result['effective_prompt_cost']} effective)")
    print(f"  Net saving:             {result['net_saving']}")
    be = result["break_even_messages"]
    if be == float("inf"):
        print("  Break-even at:          never (no tokens saved per message)")
    else:
        print(f"  Break-even at:          {be} messages")
    print(f"  ➤ Recommendation:       {result['recommendation']}")
    print()


def main():
    enc = tiktoken.get_encoding("cl100k_base")
    encode_map = load_encoder()
    phrase_lengths = build_phrase_lengths(encode_map)

    system_prompt_tokens = 2899

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

    for use_caching in [False, True]:
        mode = "WITH PROMPT CACHING" if use_caching else "WITHOUT CACHING"
        print(f"=== {mode} ===")
        print(f"System prompt: {system_prompt_tokens} tokens", end="")
        if use_caching:
            print(f" (effective cost: {math.ceil(system_prompt_tokens * CACHE_COST_MULTIPLIER)} tokens at 10%)\n")
        else:
            print(f" (full cost: {system_prompt_tokens} tokens)\n")

        for label, input_text, conv_length in scenarios:
            result = calculate_efficiency(
                input_text, conv_length, system_prompt_tokens,
                encode_map, phrase_lengths, enc,
                use_caching=use_caching,
            )
            print_report(label, result)


if __name__ == "__main__":
    main()
