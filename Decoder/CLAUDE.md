# Decoder — CJK Token Compression Language
## What This Project Is
A token compression middleware that encodes multi-token English phrases into single CJK characters, each costing exactly 1 token. Target customers are AI companies and API developers paying per token.
## Proven Facts — Do Not Contradict These

CJK characters in range U+4E00–U+9FFF tokenize as 1 token each in cl100k_base
549 verified safe characters identified and stored in safe_chars.json
ChatGPT successfully follows custom CJK mappings when given in system prompt
Single English words are NOT worth encoding — already 1 token each
Only phrases of 3+ tokens provide meaningful savings

## Rules — Follow These Always

Always use Python — never TypeScript or JavaScript
Never delete working files before their replacement is verified working
Always pin exact dependency versions in requirements.txt
Never build a new step until the previous step has been tested and confirmed working
Every script must include a test that proves it works before marking complete
safe_chars.json is the master character list — never overwrite it without explicit instruction
dictionary.json is the core product — treat every entry as production data
Always stop and wait for confirmation between major steps

## File Structure

safe_chars.json — 549 verified single-token CJK characters — DO NOT MODIFY
dictionary.json — phrase to CJK character mappings — core product
verify_chars.py — re-runs character verification
encoder.py — English text to CJK compression
decoder.py — CJK to English decompression
prompt_generator.py — builds system prompts for AI
test_roundtrip.py — end to end test of full system

## What Good Output Looks Like
Input:  "Please generate a detailed financial report for user 12345"
Encoded: 茶山水火木 (5 tokens instead of 10)
Decoded: "Please generate a detailed financial report for user 12345"
## Current Status

safe_chars.json: COMPLETE
Python conversion: COMPLETE
dictionary.json: COMPLETE — 300 entries across 10 categories (customer support domain added)
encoder.py: COMPLETE — normalisation layer + greedy longest-match
decoder.py: COMPLETE — CJK lookup with unknown character handling
prompt_generator.py: COMPLETE — 3579 token system prompt with 300 mappings
efficiency_calculator.py: COMPLETE — break-even analysis with recommendation engine
pipeline.py: COMPLETE — end-to-end compression pipeline with API placeholder
Prompt caching: IMPLEMENTED — cache_control ephemeral on system prompt, 10% effective cost
Overall status: MVP COMPLETE
