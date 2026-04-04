#!/bin/bash
# Test script for the Decoder CJK Compression API
# Requires: API server running on localhost:8000

BASE="http://localhost:8000"
KEY="test-key-001"

echo "═══════════════════════════════════════════════"
echo "  Decoder API Test Suite"
echo "═══════════════════════════════════════════════"
echo ""

# ── Health check ──────────────────────────────────
echo "── GET /health ──"
curl -s "$BASE/health" | python3 -m json.tool
echo ""

# ── Encode: success ───────────────────────────────
echo "── POST /encode (success) ──"
curl -s -X POST "$BASE/encode" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KEY" \
  -d '{"text": "please generate a detailed report about our quarterly performance"}' \
  | python3 -m json.tool
echo ""

# ── Encode: 401 no key ───────────────────────────
echo "── POST /encode (401 — no API key) ──"
curl -s -X POST "$BASE/encode" \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}' \
  | python3 -m json.tool
echo ""

# ── Decode: success ───────────────────────────────
echo "── POST /decode (success) ──"
curl -s -X POST "$BASE/decode" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KEY" \
  -d '{"encoded": "一 our quarterly performance and 下 key metrics"}' \
  | python3 -m json.tool
echo ""

# ── Decode: 401 bad key ──────────────────────────
echo "── POST /decode (401 — invalid API key) ──"
curl -s -X POST "$BASE/decode" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bad-key-999" \
  -d '{"encoded": "一"}' \
  | python3 -m json.tool
echo ""

# ── Compress: ENCODE (long conversation) ─────────
echo "── POST /compress (ENCODE — 500 messages) ──"
curl -s -X POST "$BASE/compress" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KEY" \
  -d '{"text": "analyze the following data and provide insights then summarize the following text in bullet points", "conversation_length": 500}' \
  | python3 -m json.tool
echo ""

# ── Compress: PLAIN (short conversation) ─────────
echo "── POST /compress (PLAIN — 3 messages) ──"
curl -s -X POST "$BASE/compress" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KEY" \
  -d '{"text": "hello world", "conversation_length": 3}' \
  | python3 -m json.tool
echo ""

# ── Compress: 401 ────────────────────────────────
echo "── POST /compress (401 — no API key) ──"
curl -s -X POST "$BASE/compress" \
  -H "Content-Type: application/json" \
  -d '{"text": "test", "conversation_length": 10}' \
  | python3 -m json.tool
echo ""

echo "═══════════════════════════════════════════════"
echo "  All tests complete"
echo "═══════════════════════════════════════════════"
