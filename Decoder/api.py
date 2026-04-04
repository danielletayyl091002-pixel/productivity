"""FastAPI REST API wrapper around the CJK compression pipeline."""

import json
import logging
import math
import os
from typing import Optional

import tiktoken
from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

from encoder import load_encoder, build_phrase_lengths, encode
from decoder import load_decoder, decode
from efficiency_calculator import calculate_efficiency

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
API_KEYS_PATH = os.path.join(SCRIPT_DIR, "api_keys.json")
DICT_PATH = os.path.join(SCRIPT_DIR, "dictionary.json")

MAX_INPUT_LENGTH = 10_000

# ── Logging ───────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("decoder-api")

# ── Load resources at startup ─────────────────────────────────────────────

with open(API_KEYS_PATH, "r") as f:
    API_KEYS: dict[str, str] = json.load(f)

enc = tiktoken.get_encoding("cl100k_base")

# Default dictionary
default_encode_map = load_encoder()
default_decode_map = load_decoder()
default_phrase_lengths = build_phrase_lengths(default_encode_map)

with open(DICT_PATH, "r", encoding="utf-8") as f:
    default_dict_meta = json.load(f)["metadata"]

# System prompt token count (from prompt_generator.py)
SYSTEM_PROMPT_TOKENS = 3579

# ── FastAPI app ───────────────────────────────────────────────────────────

app = FastAPI(
    title="Decoder — CJK Token Compression API",
    version="1.0.0",
)

# ── Request/Response models ───────────────────────────────────────────────


class EncodeRequest(BaseModel):
    text: str
    dictionary_id: str = Field(default="default")


class EncodeResponse(BaseModel):
    encoded: str
    tokens_before: int
    tokens_after: int
    tokens_saved: int


class DecodeRequest(BaseModel):
    encoded: str
    dictionary_id: str = Field(default="default")


class DecodeResponse(BaseModel):
    decoded: str
    unknown_chars: int
    warnings: list[str]


class CompressRequest(BaseModel):
    text: str
    conversation_length: int
    dictionary_id: str = Field(default="default")


class CompressResponse(BaseModel):
    result: str
    decision: str
    tokens_before: int
    tokens_after: int
    net_saving: int
    break_even_messages: int | float


class HealthResponse(BaseModel):
    status: str
    dictionary_entries: int
    version: str


# ── Auth helper ───────────────────────────────────────────────────────────


def authenticate(api_key: Optional[str]) -> str:
    """Validate API key and return company name. Raises 401 on failure."""
    if not api_key or api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return API_KEYS[api_key]


def get_dictionary(dictionary_id: str):
    """Load dictionary by ID. Currently only 'default' is supported."""
    if dictionary_id != "default":
        raise HTTPException(
            status_code=400,
            detail=f"Dictionary '{dictionary_id}' not found. Use 'default' or a valid custom dictionary ID.",
        )
    return default_encode_map, default_decode_map, default_phrase_lengths


def validate_text_length(text: str):
    """Reject input over MAX_INPUT_LENGTH characters."""
    if len(text) > MAX_INPUT_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Input text exceeds maximum length of {MAX_INPUT_LENGTH} characters ({len(text)} provided)",
        )


# ── Endpoints ─────────────────────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        dictionary_entries=default_dict_meta["totalEntries"],
        version="1.0.0",
    )


@app.post("/encode", response_model=EncodeResponse)
def encode_endpoint(
    body: EncodeRequest,
    x_api_key: Optional[str] = Header(None),
):
    company = authenticate(x_api_key)
    logger.info(f"[{company}] POST /encode — {len(body.text)} chars")

    validate_text_length(body.text)

    encode_map, _, phrase_lengths = get_dictionary(body.dictionary_id)
    encoded_text, _ = encode(body.text, encode_map, phrase_lengths)

    tokens_before = len(enc.encode(body.text))
    tokens_after = len(enc.encode(encoded_text))

    return EncodeResponse(
        encoded=encoded_text,
        tokens_before=tokens_before,
        tokens_after=tokens_after,
        tokens_saved=tokens_before - tokens_after,
    )


@app.post("/decode", response_model=DecodeResponse)
def decode_endpoint(
    body: DecodeRequest,
    x_api_key: Optional[str] = Header(None),
):
    company = authenticate(x_api_key)
    logger.info(f"[{company}] POST /decode — {len(body.encoded)} chars")

    validate_text_length(body.encoded)

    _, decode_map, _ = get_dictionary(body.dictionary_id)
    decoded_text, unknown_count = decode(body.encoded, decode_map)

    warnings = []
    if unknown_count > 0:
        warnings.append(f"{unknown_count} unknown CJK character(s) encountered")

    return DecodeResponse(
        decoded=decoded_text,
        unknown_chars=unknown_count,
        warnings=warnings,
    )


@app.post("/compress", response_model=CompressResponse)
def compress_endpoint(
    body: CompressRequest,
    x_api_key: Optional[str] = Header(None),
):
    company = authenticate(x_api_key)
    logger.info(f"[{company}] POST /compress — {len(body.text)} chars, {body.conversation_length} msgs")

    validate_text_length(body.text)

    encode_map, _, phrase_lengths = get_dictionary(body.dictionary_id)

    efficiency = calculate_efficiency(
        body.text,
        body.conversation_length,
        SYSTEM_PROMPT_TOKENS,
        encode_map,
        phrase_lengths,
        enc,
        use_caching=True,
    )

    decision = efficiency["recommendation"]
    tokens_before = efficiency["original_tokens_per_msg"]

    if decision == "ENCODE":
        encoded_text, _ = encode(body.text, encode_map, phrase_lengths)
        tokens_after = len(enc.encode(encoded_text))
        result = encoded_text
    else:
        tokens_after = tokens_before
        result = body.text

    be = efficiency["break_even_messages"]
    # Convert inf to -1 for JSON serialization
    break_even_json = -1 if be == float("inf") else be

    return CompressResponse(
        result=result,
        decision=decision,
        tokens_before=tokens_before,
        tokens_after=tokens_after,
        net_saving=efficiency["net_saving"],
        break_even_messages=break_even_json,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
