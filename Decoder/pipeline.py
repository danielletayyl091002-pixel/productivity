"""Pipeline: complete automatic CJK compression pipeline — the core product."""

import os
import tiktoken
from encoder import load_encoder, build_phrase_lengths, encode
from decoder import load_decoder, decode
from efficiency_calculator import calculate_efficiency

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYSTEM_PROMPT_PATH = os.path.join(SCRIPT_DIR, "system_prompt.txt")

# System prompt token count (from prompt_generator.py output)
SYSTEM_PROMPT_TOKENS = 2899


def load_system_prompt() -> str:
    """Load the system prompt from file."""
    with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()


def run_pipeline(
    input_text: str,
    conversation_length: int,
    mock_response: str | None = None,
) -> dict:
    """Run the full compression pipeline.

    Steps:
    1. Check efficiency — decide ENCODE or SEND PLAIN ENGLISH
    2. If ENCODE: compress the input
    3. Load system prompt
    4. API call placeholder (or use mock_response)
    5. Decode the AI response
    6. Return results
    """
    enc = tiktoken.get_encoding("cl100k_base")
    encode_map = load_encoder()
    phrase_lengths = build_phrase_lengths(encode_map)
    decode_map = load_decoder()

    # Step 1: Efficiency check
    efficiency = calculate_efficiency(
        input_text, conversation_length, SYSTEM_PROMPT_TOKENS,
        encode_map, phrase_lengths, enc,
    )
    recommendation = efficiency["recommendation"]

    result = {
        "original_input": input_text,
        "conversation_length": conversation_length,
        "recommendation": recommendation,
        "encoded_input": None,
        "system_prompt_loaded": False,
        "mock_response": None,
        "decoded_output": None,
        "original_tokens": efficiency["original_tokens_per_msg"],
        "encoded_tokens": efficiency["encoded_tokens_per_msg"],
        "tokens_saved_per_msg": efficiency["tokens_saved_per_msg"],
        "net_saving": efficiency["net_saving"],
        "break_even_messages": efficiency["break_even_messages"],
    }

    # Step 2: If SEND PLAIN ENGLISH, skip compression
    if recommendation == "SEND PLAIN ENGLISH":
        result["decoded_output"] = input_text
        return result

    # Step 3: Encode the input
    encoded_text, _ = encode(input_text, encode_map, phrase_lengths)
    result["encoded_input"] = encoded_text

    # Step 4: Load system prompt
    system_prompt = load_system_prompt()
    result["system_prompt_loaded"] = True

    # Step 5: API call placeholder
    # ──────────────────────────────────────────────────────────────────────
    # API CALL GOES HERE — add ANTHROPIC_API_KEY to .env and uncomment
    # this block
    #
    # import anthropic
    #
    # client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
    # response = client.messages.create(
    #     model="claude-sonnet-4-6",
    #     max_tokens=1024,
    #     system=[
    #         {
    #             "type": "text",
    #             "text": system_prompt,
    #             "cache_control": {"type": "ephemeral"}
    #         }
    #     ],
    #     messages=[{"role": "user", "content": encoded_text}],
    # )
    # ai_response = response.content[0].text
    # ──────────────────────────────────────────────────────────────────────

    # For testing: use mock_response instead of real API call
    if mock_response is not None:
        ai_response = mock_response
        result["mock_response"] = mock_response
    else:
        ai_response = encoded_text  # echo back encoded input as fallback
        result["mock_response"] = "(echo — no mock provided)"

    # Step 6: Decode the AI response
    decoded_output, unknown_count = decode(ai_response, decode_map)
    result["decoded_output"] = decoded_output
    if unknown_count > 0:
        result["unknown_characters"] = unknown_count

    return result


def print_pipeline_report(label: str, result: dict):
    """Print a formatted pipeline report."""
    print(f"═══ {label} ═══")
    print(f"  Original input:      {result['original_input']}")
    print(f"  Conversation length: {result['conversation_length']} messages")
    print(f"  Efficiency decision: {result['recommendation']}")

    if result["recommendation"] == "ENCODE":
        print(f"  Encoded input:       {result['encoded_input']}")
        print(f"  System prompt:       {'loaded' if result['system_prompt_loaded'] else 'skipped'}")
        print(f"  Mock AI response:    {result['mock_response']}")
        print(f"  Decoded output:      {result['decoded_output']}")
        print(f"  Tokens per message:  {result['original_tokens']} → {result['encoded_tokens']} (saving {result['tokens_saved_per_msg']})")
        print(f"  Net saving:          {result['net_saving']} tokens over {result['conversation_length']} messages")
        be = result["break_even_messages"]
        print(f"  Break-even at:       {be} messages")
        if "unknown_characters" in result:
            print(f"  WARNING:             {result['unknown_characters']} unknown CJK character(s) in response")
    else:
        print(f"  Action:              Sending plain English (compression not worth it)")
        print(f"  Output:              {result['decoded_output']}")
        print(f"  Net saving:          {result['net_saving']} (would lose tokens)")
        be = result["break_even_messages"]
        if be == float("inf"):
            print(f"  Break-even at:       never (no tokens saved per message)")
        else:
            print(f"  Break-even at:       {be} messages (conversation too short)")

    print()


def main():
    # Test 1 — Should ENCODE (long batch, 200 messages)
    result1 = run_pipeline(
        input_text="please generate a detailed report about our quarterly performance and provide a comprehensive summary of the following key metrics",
        conversation_length=200,
        mock_response="下三向",
    )
    print_pipeline_report("Test 1 — Long batch (200 messages, should ENCODE)", result1)

    # Test 2 — Should SEND PLAIN (short, 3 messages)
    result2 = run_pipeline(
        input_text="hello",
        conversation_length=3,
    )
    print_pipeline_report("Test 2 — Short conversation (3 messages, should SEND PLAIN)", result2)


if __name__ == "__main__":
    main()
